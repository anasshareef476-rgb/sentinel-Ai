import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Eye,
  Lock
} from 'lucide-react';
import { PendingApprovalItem } from '../types';

interface ApprovalQueueProps {
  pendingItems: PendingApprovalItem[];
  onResolve: (requestId: string, decision: 'APPROVE' | 'REJECT', reviewer: string, comment: string) => Promise<any>;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ pendingItems, onResolve }) => {
  const [selectedItem, setSelectedItem] = useState<PendingApprovalItem | null>(null);
  const [reviewerName, setReviewerName] = useState<string>('Security Officer (You)');
  const [reviewerComment, setReviewerComment] = useState<string>('Authorized after verifying request context and team scope.');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedItem) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await onResolve(selectedItem.request_id, decision, reviewerName, reviewerComment);
      if (res.success) {
        setStatusMessage({
          text: `Request ${selectedItem.request_id} successfully ${decision === 'APPROVE' ? 'Approved & Executed in Sandbox' : 'Rejected & Blocked'}!`,
          type: 'success'
        });
        setSelectedItem(null);
      } else {
        setStatusMessage({
          text: res.error || 'Failed to process approval decision',
          type: 'error'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: 'Error processing approval: ' + err.message,
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header card */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <UserCheck size={24} color="#f59e0b" />
              Human-in-the-Loop (HITL) Authorization Center
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Actions with significant enterprise impact are paused until an authorized human operator grants explicit approval.
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            background: pendingItems.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: '1px solid',
            borderColor: pendingItems.length > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)',
            color: pendingItems.length > 0 ? '#fbbf24' : '#34d399',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            <Clock size={16} />
            {pendingItems.length} Actions Awaiting Review
          </div>
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 8,
          background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: '1px solid',
          borderColor: statusMessage.type === 'success' ? '#10b981' : '#ef4444',
          color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          {statusMessage.text}
        </div>
      )}

      {/* Main split: List of items vs Detail inspection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Pending Requests List */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            Pending High-Impact Queue
          </h3>

          {pendingItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 16px',
              color: 'var(--text-muted)'
            }}>
              <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: 12, opacity: 0.8 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>Queue Clean</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                No actions currently paused. Try triggering a sensitive action (e.g. bulk export or payroll edit) in the Agent Simulator.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingItems.map((item) => {
                const isSelected = selectedItem?.request_id === item.request_id;
                return (
                  <div
                    key={item.request_id}
                    onClick={() => {
                      setSelectedItem(item);
                      setReviewerComment(
                        item.tool_name === 'export_records'
                          ? 'Approved: verified business purpose for quarterly segmentation.'
                          : item.tool_name === 'update_record'
                          ? 'Approved: verified bonus payout authorized by department head.'
                          : 'Approved: verified operational requirement and scheduled window.'
                      );
                    }}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid',
                      borderColor: isSelected ? '#f59e0b' : 'var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#fbbf24',
                          fontWeight: 700
                        }}>
                          {item.tool_name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          by <strong style={{ color: '#fff' }}>{item.agent_id}</strong> ({item.agent_role})
                        </span>
                      </div>
                      <span className="badge risk-high">
                        Risk {item.risk_score}/100
                      </span>
                    </div>

                    <p style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-main)',
                      marginBottom: 8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.user_prompt || item.reason}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      <span>Req ID: {item.request_id}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24' }}>
                        <Eye size={12} /> Click to Inspect
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Inspection & Decision Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          {selectedItem ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={18} color="#00f2fe" />
                  Forensic Action Inspection
                </h3>
                <span className="badge badge-review">PENDING HUMAN DECISION</span>
              </div>

              {/* Rationale & Policies */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
                  Why did SentinelAI pause this action?
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  {selectedItem.reason}
                </p>
              </div>

              {/* Request Parameters */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>
                  Tool Parameters & Payload:
                </label>
                <pre style={{
                  background: '#070a13',
                  padding: '12px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  color: '#e2e8f0',
                  border: '1px solid var(--border-subtle)',
                  maxHeight: 140,
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(selectedItem.parameters, null, 2)}
                </pre>
              </div>

              {/* Reviewer Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Authorized Reviewer Name
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Reviewer Notes / Compliance Justification
                  </label>
                  <textarea
                    rows={2}
                    value={reviewerComment}
                    onChange={(e) => setReviewerComment(e.target.value)}
                    style={{ width: '100%' }}
                    placeholder="Provide justification for approval or rejection..."
                  />
                </div>
              </div>

              {/* Approve & Reject Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                <button
                  onClick={() => handleDecision('APPROVE')}
                  disabled={isProcessing}
                  className="btn btn-success"
                  style={{ padding: '12px', fontSize: '0.85rem' }}
                >
                  <CheckCircle2 size={18} />
                  Approve & Execute (Sandbox)
                </button>
                <button
                  onClick={() => handleDecision('REJECT')}
                  disabled={isProcessing}
                  className="btn btn-danger"
                  style={{ padding: '12px', fontSize: '0.85rem' }}
                >
                  <XCircle size={18} />
                  Reject & Enforce Block
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)'
            }}>
              <Lock size={36} color="#64748b" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                Select a Pending Request
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Click on any item from the left queue to review its payload, risk breakdown, and issue a signed authorization decision.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
