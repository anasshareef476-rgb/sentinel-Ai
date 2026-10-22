import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Terminal,
  Lock,
  RefreshCw,
  Eye
} from 'lucide-react';
import { ToolCallRequest, InterceptResult, BenchmarkScenario } from '../types';

interface InterceptorStudioProps {
  scenarios: BenchmarkScenario[];
  onIntercept: (req: ToolCallRequest) => Promise<InterceptResult>;
  lastResult: InterceptResult | null;
  onNavigateApprovals: () => void;
}

export const InterceptorStudio: React.FC<InterceptorStudioProps> = ({
  scenarios,
  onIntercept,
  lastResult,
  onNavigateApprovals
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SAFE-001');
  const [agentId, setAgentId] = useState<string>('agent-support-01');
  const [agentRole, setAgentRole] = useState<string>('support_rep');
  const [toolName, setToolName] = useState<string>('read_file');
  const [userPrompt, setUserPrompt] = useState<string>('What are our company standard operating hours?');
  const [parametersJson, setParametersJson] = useState<string>(
    JSON.stringify({ path: '/public/company_faq.md' }, null, 2)
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Scenario Selection Handler
  const handleSelectScenario = (scId: string) => {
    setSelectedScenarioId(scId);
    const sc = scenarios.find((s) => s.id === scId);
    if (sc) {
      setAgentId(sc.request.agent_id);
      setAgentRole(sc.request.agent_role);
      setToolName(sc.request.tool_name);
      setUserPrompt(sc.request.user_prompt || '');
      setParametersJson(JSON.stringify(sc.request.parameters, null, 2));
      setJsonError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedParams = JSON.parse(parametersJson);
      setJsonError(null);
      setIsSubmitting(true);
      await onIntercept({
        agent_id: agentId,
        agent_role: agentRole,
        tool_name: toolName,
        parameters: parsedParams,
        user_prompt: userPrompt
      });
    } catch (err: any) {
      setJsonError('Invalid JSON format in parameters: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
      {/* Left Column: Preset Scenarios & Interactive Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Preset Selector Card */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="#00f2fe" />
              1-Click Demo Scenarios (Slide 8 Requirement)
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Safe • Blocked • Human Review
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 8,
            maxHeight: 210,
            overflowY: 'auto',
            paddingRight: 4
          }}>
            {scenarios.map((sc) => {
              const isSelected = selectedScenarioId === sc.id;
              const isBlock = sc.expected_decision === 'BLOCK';
              const isReview = sc.expected_decision === 'REQUIRE_APPROVAL';

              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isSelected ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid',
                    borderColor: isSelected
                      ? '#00f2fe'
                      : isBlock
                      ? 'rgba(239, 68, 68, 0.2)'
                      : isReview
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: isBlock ? '#f87171' : isReview ? '#fbbf24' : '#34d399'
                    }}>
                      {sc.expected_decision}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
                      {sc.id}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {sc.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Request Form */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={18} color="#4facfe" />
              Proposed AI Agent Tool Call (Interceptor Input)
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Editable Payload
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Agent ID
              </label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                style={{ width: '100%' }}
                placeholder="e.g. agent-finance-01"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Agent Role (RBAC)
              </label>
              <select
                value={agentRole}
                onChange={(e) => setAgentRole(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="support_rep">support_rep</option>
                <option value="data_analyst">data_analyst</option>
                <option value="ops_admin">ops_admin</option>
                <option value="guest_assistant">guest_assistant (Restricted)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Tool Name
            </label>
            <input
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              placeholder="e.g. read_file, query_db, export_records, system_exec"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              User Prompt / Task Context
            </label>
            <textarea
              rows={2}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="The human prompt or agent goal that triggered this tool call..."
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Tool Parameters (JSON)
              </label>
              {jsonError && (
                <span style={{ fontSize: '0.7rem', color: '#f87171' }}>{jsonError}</span>
              )}
            </div>
            <textarea
              rows={5}
              value={parametersJson}
              onChange={(e) => setParametersJson(e.target.value)}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.4,
                resize: 'vertical'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Interception & Policy Evaluation in Progress...
              </>
            ) : (
              <>
                <Shield size={18} />
                Intercept & Enforce Policy (SentinelAI)
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Real-Time Interception Output */}
      <div>
        {lastResult ? (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header / Outcome Banner */}
            <div style={{
              padding: '16px 20px',
              borderRadius: 12,
              background:
                lastResult.decision === 'ALLOW'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : lastResult.decision === 'BLOCK'
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)',
              border: '1px solid',
              borderColor:
                lastResult.decision === 'ALLOW'
                  ? 'rgba(16, 185, 129, 0.4)'
                  : lastResult.decision === 'BLOCK'
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background:
                    lastResult.decision === 'ALLOW'
                      ? '#10b981'
                      : lastResult.decision === 'BLOCK'
                      ? '#ef4444'
                      : '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 16px ${
                    lastResult.decision === 'ALLOW'
                      ? 'rgba(16, 185, 129, 0.5)'
                      : lastResult.decision === 'BLOCK'
                      ? 'rgba(239, 68, 68, 0.5)'
                      : 'rgba(245, 158, 11, 0.5)'
                  }`
                }}>
                  {lastResult.decision === 'ALLOW' && <CheckCircle2 size={24} color="#070a13" />}
                  {lastResult.decision === 'BLOCK' && <XCircle size={24} color="#ffffff" />}
                  {lastResult.decision === 'REQUIRE_APPROVAL' && <Lock size={24} color="#070a13" />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                      DECISION: {lastResult.decision}
                    </span>
                    <span className={`badge risk-${lastResult.risk.band.toLowerCase()}`}>
                      Risk Band: {lastResult.risk.band}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Request ID: <code style={{ color: '#00f2fe' }}>{lastResult.request_id}</code> • Decision Latency: {lastResult.latency_ms}ms
                  </p>
                </div>
              </div>

              {lastResult.decision === 'REQUIRE_APPROVAL' && (
                <button
                  onClick={onNavigateApprovals}
                  className="btn btn-outline"
                  style={{ fontSize: '0.78rem', borderColor: '#f59e0b', color: '#fbbf24' }}
                >
                  <Eye size={14} /> View in Approval Queue
                </button>
              )}
            </div>

            {/* Risk Gauge & Anomaly Indicators */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '16px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                  Risk Scorer Multi-Factor Analysis
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: lastResult.risk.score >= 70 ? '#f87171' : lastResult.risk.score >= 40 ? '#fbbf24' : '#34d399' }}>
                  {lastResult.risk.score} / 100
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{
                height: 8,
                borderRadius: 4,
                background: '#1e293b',
                overflow: 'hidden',
                marginBottom: 12
              }}>
                <div style={{
                  height: '100%',
                  width: `${lastResult.risk.score}%`,
                  background:
                    lastResult.risk.score >= 75
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : lastResult.risk.score >= 40
                      ? 'linear-gradient(90deg, #10b981, #f59e0b)'
                      : '#10b981',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              {/* Factors list */}
              {lastResult.risk.factors.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {lastResult.risk.factors.map((f, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: '0.72rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={14} color="#f87171" />
                        <span style={{ fontWeight: 600, color: '#fff' }}>{f.factor_name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>— {f.description}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#f87171' }}>+{f.weight} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} /> No adverse risk anomalies or prompt injection patterns detected.
                </div>
              )}
            </div>

            {/* Policy Rationale & Explainability */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '16px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                Policy Engine Rationale & Explanation
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: 10 }}>
                {lastResult.reason}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Matched Policies:</span>
                {lastResult.matched_policies.map((pId) => (
                  <span key={pId} style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(0, 242, 254, 0.1)',
                    border: '1px solid rgba(0, 242, 254, 0.25)',
                    color: '#00f2fe',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {pId}
                  </span>
                ))}
              </div>
            </div>

            {/* Execution Sandbox Result (If Allowed) */}
            {lastResult.decision === 'ALLOW' && lastResult.execution_result && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 10,
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} /> Sandbox Execution Output (Safely Isolated)
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Mode: {lastResult.execution_result.sandbox_mode || 'isolated_container'}
                  </span>
                </div>
                <pre style={{
                  background: '#070a13',
                  padding: '12px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  color: '#e2e8f0',
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)',
                  maxHeight: 180
                }}>
                  {JSON.stringify(lastResult.execution_result, null, 2)}
                </pre>
              </div>
            )}

            {/* Blocked Security Warning */}
            {lastResult.decision === 'BLOCK' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 10,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <ShieldAlert size={28} color="#f87171" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171' }}>
                    Zero-Execution Policy Enforced
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tool execution was arrested before any system call occurred. Incident logged to audit trail for forensic review.
                  </p>
                </div>
              </div>
            )}

            {/* Human Review Pause Warning */}
            {lastResult.decision === 'REQUIRE_APPROVAL' && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 10,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <Clock size={28} color="#fbbf24" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
                    Action Paused: Human-in-the-Loop Required
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Security Principle: Never execute high-impact actions while approval is pending. An authorized reviewer must approve or reject this request.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 460
          }}>
            <div style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Shield size={28} color="#00f2fe" />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              Ready for Interception
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.5 }}>
              Select a 1-click scenario on the left or customize your own agent tool call. Click <strong>Intercept & Enforce Policy</strong> to see SentinelAI evaluate risk and enforce control.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
