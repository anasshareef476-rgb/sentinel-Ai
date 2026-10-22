import React from 'react';
import { Shield, PlayCircle, UserCheck, History, Sliders, BarChart3, Info } from 'lucide-react';
import { SystemStats } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: SystemStats | null;
  pendingCount: number;
  wsConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, stats, pendingCount, wsConnected = false }) => {
  return (
    <header style={{
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Left: Brand & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer'
          }} onClick={() => setActiveTab('simulator')}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)'
            }}>
              <Shield size={22} color="#070a13" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                  Sentinel<span style={{ color: '#00f2fe' }}>AI</span>
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(0, 242, 254, 0.15)',
                  color: '#00f2fe',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  fontWeight: 700
                }}>
                  PS 2.1
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                AI Agent Safety & Pre-Execution Policy Gateway
              </p>
            </div>
          </div>

          {/* Engine Status Tag */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: wsConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: '1px solid',
            borderColor: wsConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: '0.72rem',
            fontWeight: 600,
            color: wsConnected ? '#34d399' : '#fbbf24'
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: wsConnected ? '#10b981' : '#f59e0b',
              boxShadow: wsConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
            }} />
            {wsConnected ? 'LIVE SOC STREAM • POLICY ACTIVE' : 'CONNECTING SOC...'}
          </div>
        </div>

        {/* Center: Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { id: 'simulator', label: 'Agent Simulator', icon: PlayCircle },
            { id: 'approvals', label: 'Human Review', icon: UserCheck, count: pendingCount },
            { id: 'audit', label: 'Forensic Audit', icon: History },
            { id: 'policies', label: 'Policy Rules', icon: Sliders },
            { id: 'benchmark', label: 'Benchmark & Evaluation', icon: BarChart3 },
            { id: 'about', label: 'Architecture & Team', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isActive ? 'rgba(0, 242, 254, 0.4)' : 'transparent',
                  background: isActive ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                  color: isActive ? '#00f2fe' : 'var(--text-muted)',
                  transition: 'all 0.18s ease',
                  position: 'relative'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: '#f59e0b',
                    color: '#070a13',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    animation: 'pulse 1.5s infinite'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Live Telemetry Snippet & Team Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {stats && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '4px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Interceptions: </span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{stats.total_requests}</span>
              </div>
              <div style={{ width: 1, height: 14, background: 'var(--border-subtle)' }} />
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Block Rate: </span>
                <span style={{ fontWeight: 700, color: stats.block_rate_pct > 0 ? '#f87171' : '#34d399' }}>
                  {stats.block_rate_pct}%
                </span>
              </div>
            </div>
          )}

          <div style={{
            fontSize: '0.72rem',
            padding: '4px 10px',
            borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: '#c084fc',
            fontWeight: 600
          }}>
            Codebuggy • DevHost '26
          </div>
        </div>
      </div>
    </header>
  );
};
