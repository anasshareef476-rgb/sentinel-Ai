import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Shield,
  FileCode,
  RefreshCw,
  X
} from 'lucide-react';
import { AuditRecord } from '../types';

interface AuditLogViewProps {
  records: AuditRecord[];
  onRefresh: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ records, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const filteredRecords = records.filter((r) => {
    if (decisionFilter !== 'ALL' && r.decision !== decisionFilter) {
      return false;
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchId = r.request_id.toLowerCase().includes(s);
      const matchTool = r.tool_name.toLowerCase().includes(s);
      const matchAgent = r.agent_id.toLowerCase().includes(s);
      const matchReason = r.reason.toLowerCase().includes(s);
      const matchPrompt = (r.user_prompt || '').toLowerCase().includes(s);
      return matchId || matchTool || matchAgent || matchReason || matchPrompt;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Request ID', 'Timestamp', 'Agent ID', 'Role', 'Tool', 'Decision', 'Risk Score', 'Risk Band', 'Reason', 'Reviewer', 'Status'];
    const rows = filteredRecords.map((r) => [
      r.request_id,
      new Date(r.timestamp * 1000).toISOString(),
      r.agent_id,
      r.agent_role,
      r.tool_name,
      r.decision,
      r.risk_score,
      r.risk_band,
      `"${r.reason.replace(/"/g, '""')}"`,
      r.reviewer || 'N/A',
      r.execution_status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentinel_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sentinel_audit_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Search & Filter Header */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Search audit trail by tool, agent, prompt, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: 34 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} color="var(--text-dim)" />
              <select
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              >
                <option value="ALL">All Decisions</option>
                <option value="ALLOW">ALLOW</option>
                <option value="BLOCK">BLOCK</option>
                <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
                <option value="APPROVED">APPROVED (By Human)</option>
                <option value="REJECTED">REJECTED (By Human)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onRefresh} className="btn btn-outline" style={{ fontSize: '0.78rem' }}>
              <RefreshCw size={14} /> Refresh Log
            </button>
            <button onClick={handleExportCSV} className="btn btn-outline" style={{ fontSize: '0.78rem' }}>
              <Download size={14} /> Export CSV
            </button>
            <button onClick={handleExportJSON} className="btn btn-outline" style={{ fontSize: '0.78rem' }}>
              <FileCode size={14} /> Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Main Audit Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Decision</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Risk</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Agent & Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tool Call</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Enforcement Reason</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Latency</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isBlock = r.decision === 'BLOCK';
                  const isApproved = r.decision === 'APPROVED';
                  const isRejected = r.decision === 'REJECTED';
                  const isAllow = r.decision === 'ALLOW';

                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {new Date(r.timestamp * 1000).toLocaleTimeString()}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${
                          isAllow || isApproved ? 'badge-allow' : isBlock || isRejected ? 'badge-block' : 'badge-review'
                        }`}>
                          {r.decision}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge risk-${r.risk_band.toLowerCase()}`}>
                          {r.risk_score} • {r.risk_band}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{r.agent_id}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{r.agent_role}</div>
                      </td>

                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: '#00f2fe', fontWeight: 600 }}>{r.tool_name}</span>
                      </td>

                      <td style={{ padding: '12px 16px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span title={r.reason} style={{ color: 'var(--text-main)' }}>
                          {r.reason}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {r.latency_ms} ms
                      </td>

                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        >
                          <Eye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Drawer Modal */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 520,
          maxWidth: '90vw',
          background: '#0d1322',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.6)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={20} color="#00f2fe" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                Forensic Audit Detail
              </h3>
            </div>
            <button
              onClick={() => setSelectedRecord(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Request Identifier</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#00f2fe', fontFamily: 'var(--font-mono)' }}>
                {selectedRecord.request_id}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Decision</span>
                <div>
                  <span className={`badge ${selectedRecord.decision === 'ALLOW' || selectedRecord.decision === 'APPROVED' ? 'badge-allow' : 'badge-block'}`}>
                    {selectedRecord.decision}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Risk Score</span>
                <div>
                  <span className={`badge risk-${selectedRecord.risk_band.toLowerCase()}`}>
                    {selectedRecord.risk_score} / 100 ({selectedRecord.risk_band})
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Policy Rationale</span>
              <p style={{ fontSize: '0.8rem', color: '#fff', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 6 }}>
                {selectedRecord.reason}
              </p>
            </div>

            {selectedRecord.reviewer && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
                  Human Reviewer Sign-Off
                </div>
                <div style={{ fontSize: '0.8rem', color: '#fff' }}>
                  Reviewer: <strong>{selectedRecord.reviewer}</strong>
                </div>
                {selectedRecord.reviewer_comment && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    "{selectedRecord.reviewer_comment}"
                  </p>
                )}
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>User Prompt / Context</span>
              <div style={{ fontSize: '0.8rem', color: '#fff', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 6 }}>
                {selectedRecord.user_prompt || 'N/A (Direct tool invocation)'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Tool Parameters (Payload)</span>
              <pre style={{
                background: '#070a13',
                padding: '10px',
                borderRadius: 6,
                fontSize: '0.75rem',
                color: '#e2e8f0',
                border: '1px solid var(--border-subtle)',
                maxHeight: 180,
                overflowY: 'auto'
              }}>
                {JSON.stringify(selectedRecord.parameters, null, 2)}
              </pre>
            </div>

            {selectedRecord.execution_result && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Sandbox Execution Output</span>
                <pre style={{
                  background: '#070a13',
                  padding: '10px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  maxHeight: 180,
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(selectedRecord.execution_result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
