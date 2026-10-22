import React from 'react';
import { Bot, ShieldAlert, Cpu, CheckCircle2, XCircle, UserCheck } from 'lucide-react';
import { DecisionType } from '../types';

interface WorkflowDiagramProps {
  currentDecision?: DecisionType | null;
  animatingStep?: number;
}

export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({ currentDecision, animatingStep = 0 }) => {
  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} color="#00f2fe" />
            System Workflow Architecture (Slide 5 Specification)
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            The agent does not decide its own permissions. A separate policy engine enforces the execution decision.
          </p>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
          Real-time Interception Pipeline
        </div>
      </div>

      {/* Workflow Nodes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        alignItems: 'stretch'
      }}>
        {/* Node 1: AI Agent */}
        <div style={{
          background: animatingStep === 1 ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
          border: '1px solid',
          borderColor: animatingStep === 1 ? '#00f2fe' : 'var(--border-subtle)',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={18} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>01. AI Agent</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Proposes Tool Call</div>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
            Proposes action (e.g. read file, query database, export data, shell command).
          </p>
        </div>

        {/* Node 2: Action Interceptor */}
        <div style={{
          background: animatingStep === 2 ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
          border: '1px solid',
          borderColor: animatingStep === 2 ? '#00f2fe' : 'var(--border-subtle)',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(0, 242, 254, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldAlert size={18} color="#00f2fe" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>02. Interceptor</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Format & Intent Extraction</div>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
            Validates schema, extracts target resource, intent, agent role, and parameters.
          </p>
        </div>

        {/* Node 3: Policy + Risk Engine */}
        <div style={{
          background: animatingStep === 3 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
          border: '1px solid',
          borderColor: animatingStep === 3 ? '#a855f7' : 'var(--border-subtle)',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Cpu size={18} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>03. Policy Engine</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Risk & Anomaly Scoring</div>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
            Default-deny evaluation, RBAC, sensitivity rules, prompt injection detection (0-100 score).
          </p>
        </div>

        {/* Node 4: Decision Enforcement (3 Branch status) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>
            04. Decision Outcome
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 600,
              background: currentDecision === 'ALLOW' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.06)',
              border: currentDecision === 'ALLOW' ? '1px solid #10b981' : '1px solid transparent',
              color: '#34d399'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> ALLOW
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Sandbox Exec</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 600,
              background: currentDecision === 'BLOCK' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.06)',
              border: currentDecision === 'BLOCK' ? '1px solid #ef4444' : '1px solid transparent',
              color: '#f87171'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <XCircle size={12} /> BLOCK
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Stop & Explain</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 600,
              background: currentDecision === 'REQUIRE_APPROVAL' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.06)',
              border: currentDecision === 'REQUIRE_APPROVAL' ? '1px solid #f59e0b' : '1px solid transparent',
              color: '#fbbf24'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <UserCheck size={12} /> REVIEW
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Human Pause</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
