import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Plus,
  Power,
  FolderLock,
  Database,
  Terminal,
  Globe
} from 'lucide-react';
import { PolicyRule } from '../types';

interface PolicyManagerProps {
  policies: PolicyRule[];
  onToggle: (policyId: string) => Promise<any>;
  onAddPolicy: (newRule: PolicyRule) => Promise<any>;
}

export const PolicyManager: React.FC<PolicyManagerProps> = ({ policies, onToggle, onAddPolicy }) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newId, setNewId] = useState<string>(`POL-${String(policies.length + 1).padStart(3, '0')}`);
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newTool, setNewTool] = useState<string>('*');
  const [newResource, setNewResource] = useState<string>('');
  const [newAction, setNewAction] = useState<'BLOCK' | 'REQUIRE_APPROVAL' | 'ALLOW'>('BLOCK');
  const [newCategory, setNewCategory] = useState<string>('general');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const rule: PolicyRule = {
      id: newId,
      name: newName,
      description: newDesc,
      tool_pattern: newTool,
      resource_pattern: newResource ? newResource : undefined,
      action: newAction,
      risk_boost: newAction === 'BLOCK' ? 40 : newAction === 'REQUIRE_APPROVAL' ? 30 : -10,
      is_active: true,
      category: newCategory
    };
    await onAddPolicy(rule);
    setShowAddModal(false);
    setNewName('');
    setNewDesc('');
    setNewId(`POL-${String(policies.length + 2).padStart(3, '0')}`);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'file_system':
        return <FolderLock size={16} color="#00f2fe" />;
      case 'database':
        return <Database size={16} color="#c084fc" />;
      case 'system_exec':
        return <Terminal size={16} color="#f87171" />;
      case 'network':
        return <Globe size={16} color="#fbbf24" />;
      default:
        return <Shield size={16} color="#60a5fa" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sliders size={22} color="#00f2fe" />
              Dynamic Policy Engine & Rule Governance
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Evaluate each proposed tool action against policy, permissions, context, and risk.
            </p>
          </div>

          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Custom Security Policy
          </button>
        </div>
      </div>

      {/* Policies Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
        {policies.map((pol) => {
          const isBlock = pol.action === 'BLOCK';
          const isAllow = pol.action === 'ALLOW';

          return (
            <div
              key={pol.id}
              className="glass-panel"
              style={{
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: pol.is_active ? 1 : 0.55,
                borderColor: pol.is_active ? 'var(--border-subtle)' : 'rgba(255, 255, 255, 0.04)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getCategoryIcon(pol.category)}
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#00f2fe', fontWeight: 700 }}>
                      {pol.id}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      {pol.category}
                    </span>
                  </div>

                  <span className={`badge ${isAllow ? 'badge-allow' : isBlock ? 'badge-block' : 'badge-review'}`}>
                    {pol.action}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                  {pol.name}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 12 }}>
                  {pol.description}
                </p>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 10px', borderRadius: 6, marginBottom: 14 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: 2 }}>Target Tool Match</div>
                  <code style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{pol.tool_pattern}</code>
                  {pol.resource_pattern && (
                    <>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 6, marginBottom: 2 }}>Resource Filter (Regex)</div>
                      <code style={{ fontSize: '0.7rem', color: '#f472b6', wordBreak: 'break-all' }}>{pol.resource_pattern}</code>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <span style={{ fontSize: '0.72rem', color: pol.is_active ? '#34d399' : 'var(--text-dim)', fontWeight: 600 }}>
                  Status: {pol.is_active ? 'Active & Enforcing' : 'Inactive (Bypassed)'}
                </span>

                <button
                  onClick={() => onToggle(pol.id)}
                  className={`btn ${pol.is_active ? 'btn-outline' : 'btn-primary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                >
                  <Power size={12} /> {pol.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Policy Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <form onSubmit={handleCreate} className="glass-panel" style={{ width: '100%', maxWidth: 540, padding: 28 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
              Define Custom SentinelAI Policy Rule
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Policy ID</label>
                <input type="text" value={newId} onChange={(e) => setNewId(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Rule Name</label>
                <input type="text" required placeholder="e.g. Block Modifying Billing Ledger" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Description / Policy Rationale</label>
              <textarea rows={2} placeholder="Explain why this action is restricted..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Tool Pattern (Regex)</label>
                <input type="text" value={newTool} onChange={(e) => setNewTool(e.target.value)} style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Enforcement Action</label>
                <select value={newAction} onChange={(e: any) => setNewAction(e.target.value)} style={{ width: '100%' }}>
                  <option value="BLOCK">BLOCK (Immediate Arrest)</option>
                  <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL (HITL Pause)</option>
                  <option value="ALLOW">ALLOW (Sandbox Execute)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Policy Category</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: '100%' }}>
                <option value="general">General Governance</option>
                <option value="file_system">File System & Storage</option>
                <option value="database">Database & Query Safety</option>
                <option value="system_exec">System Execution & Shell</option>
                <option value="network">Network & Webhooks</option>
                <option value="pii">PII & Sensitive Customer Data</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Resource Target Pattern (Regex, optional)</label>
              <input type="text" placeholder="e.g. .*billing.*|.*invoices.*" value={newResource} onChange={(e) => setNewResource(e.target.value)} style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Deploy Policy Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
