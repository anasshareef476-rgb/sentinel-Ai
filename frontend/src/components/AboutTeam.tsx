import React from 'react';
import {
  Mail,
  Phone,
  School
} from 'lucide-react';

export const AboutTeam: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Team Header Card */}
      <div className="glass-panel" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-info">DevHost 2026 • Synergia '26 • SOSC</span>
              <span className="badge badge-allow">Problem Statement ID: PS 2.1</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Sentinel<span style={{ color: '#00f2fe' }}>AI</span>: Intercept, Evaluate, Control, Explain
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 750, marginTop: 4 }}>
              "AI agents need a safety layer—not just instructions. The agent does not decide its own permissions. A separate policy engine makes the final execution decision, with human approval for sensitive operations."
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(139, 92, 246, 0.15))',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: 14,
            padding: '16px 20px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Team Name
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f2fe' }}>
              Codebuggy
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Yenepoya Institute of Technology
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {[
          {
            name: 'Anas Shareef Mohammed',
            role: 'Team Leader',
            email: 'anasshareef476@gmail.com',
            phone: '8296127920',
            highlight: true
          },
          {
            name: 'Abdul Rehman Ihab',
            role: 'Member 2 • Security Architect',
            email: 'Team Member',
            phone: 'Yenepoya Institute of Tech',
            highlight: false
          },
          {
            name: 'Shreenidhi',
            role: 'Member 3 • Interceptor & Policy Engineer',
            email: 'Team Member',
            phone: 'Yenepoya Institute of Tech',
            highlight: false
          },
          {
            name: 'Mohammed Hamza Hafeel',
            role: 'Member 4 • Sandbox & Evaluation Engineer',
            email: 'Team Member',
            phone: 'Yenepoya Institute of Tech',
            highlight: false
          }
        ].map((m, idx) => (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: '18px 20px',
              border: m.highlight ? '1px solid rgba(0, 242, 254, 0.35)' : '1px solid var(--border-subtle)',
              background: m.highlight ? 'rgba(0, 242, 254, 0.05)' : 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: m.highlight ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: m.highlight ? '#070a13' : '#fff',
                fontWeight: 800,
                fontSize: '1rem'
              }}>
                {m.name[0]}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{m.name}</h4>
                <p style={{ fontSize: '0.72rem', color: m.highlight ? '#00f2fe' : 'var(--text-dim)', fontWeight: 600 }}>
                  {m.role}
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {m.highlight && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={13} color="var(--text-dim)" /> {m.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={13} color="var(--text-dim)" /> {m.phone}
                  </div>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <School size={13} color="var(--text-dim)" /> Yenepoya Institute of Technology
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide Breakdown: Core Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {/* The Problem (Slide 2) */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
            Slide 2 • The Problem
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 10 }}>
            Autonomous AI Agents Need a Safety Layer
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
            Autonomous AI agents can call tools and interact with business systems with limited human intervention.
            A misunderstood instruction, prompt injection, or excessive permission can trigger an unsafe action.
            A chatbot warning is not enough: risky actions must be checked before they execute.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>• Accessing a restricted file (/etc/shadow, .env)</span>
            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>• Exporting sensitive customer records (PII)</span>
            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>• Changing database/payroll without approval</span>
          </div>
        </div>

        {/* The Solution (Slide 3 & 4) */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ fontSize: '0.72rem', color: '#00f2fe', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
            Slide 3 & 4 • Solution Architecture
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 10 }}>
            Four-Stage Defense in Depth
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
              <strong style={{ color: '#00f2fe' }}>01. Intercept:</strong> Capture proposed tool calls before execution.
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
              <strong style={{ color: '#c084fc' }}>02. Evaluate Risk:</strong> Check identity, permissions, data sensitivity, and prompt injection signatures.
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
              <strong style={{ color: '#34d399' }}>03. Enforce Policy:</strong> Allow safe actions, block prohibited ones, or pause for human approval.
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
              <strong style={{ color: '#fbbf24' }}>04. Explain & Log:</strong> Record decision, reason, timestamp, and reviewer signature.
            </div>
          </div>
        </div>

        {/* Security Principles & Stack */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
            Slide 4 • Implementation Stack
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 10 }}>
            Core Engineering Stack & Principles
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <div><strong style={{ color: '#fff' }}>Backend:</strong> Python 3.11 + FastAPI + Uvicorn + WebSockets</div>
            <div><strong style={{ color: '#fff' }}>Frontend:</strong> React + TypeScript + Vite + Glassmorphic SOC UI</div>
            <div><strong style={{ color: '#fff' }}>Storage:</strong> SQLite with audit indices + real-time event streaming</div>
            <div><strong style={{ color: '#fff' }}>Execution:</strong> Isolated sandbox environment with virtual filesystem & DB</div>
          </div>
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '10px 12px',
            borderRadius: 6,
            marginTop: 12,
            fontSize: '0.72rem',
            color: '#f87171',
            lineHeight: 1.4
          }}>
            <strong>Security Principle:</strong> Default-deny for unknown high-impact actions. Never execute an action while approval is pending. Log both allowed and denied requests.
          </div>
        </div>
      </div>
    </div>
  );
};
