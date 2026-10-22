import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { WorkflowDiagram } from './components/WorkflowDiagram';
import { InterceptorStudio } from './components/InterceptorStudio';
import { ApprovalQueue } from './components/ApprovalQueue';
import { AuditLogView } from './components/AuditLogView';
import { PolicyManager } from './components/PolicyManager';
import { BenchmarkSuite } from './components/BenchmarkSuite';
import { AboutTeam } from './components/AboutTeam';
import {
  ToolCallRequest,
  InterceptResult,
  PendingApprovalItem,
  AuditRecord,
  SystemStats,
  PolicyRule,
  BenchmarkScenario,
  BenchmarkReport
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('simulator');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [scenarios, setScenarios] = useState<BenchmarkScenario[]>([]);
  const [lastResult, setLastResult] = useState<InterceptResult | null>(null);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [animatingStep, setAnimatingStep] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [statsRes, pendingRes, auditRes, polRes, scenRes] = await Promise.all([
        fetch('/api/stats').then((r) => r.json()),
        fetch('/api/approvals/pending').then((r) => r.json()),
        fetch('/api/audit?limit=100').then((r) => r.json()),
        fetch('/api/policies').then((r) => r.json()),
        fetch('/api/scenarios').then((r) => r.json())
      ]);

      setStats(statsRes);
      setPendingApprovals(pendingRes);
      setAuditRecords(auditRes);
      setPolicies(polRes);
      setScenarios(scenRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const loadInitialData = async () => {
      try {
        const [statsRes, pendingRes, auditRes, polRes, scenRes] = await Promise.all([
          fetch('/api/stats').then((r) => r.json()),
          fetch('/api/approvals/pending').then((r) => r.json()),
          fetch('/api/audit?limit=100').then((r) => r.json()),
          fetch('/api/policies').then((r) => r.json()),
          fetch('/api/scenarios').then((r) => r.json())
        ]);

        if (!isCancelled) {
          setStats(statsRes);
          setPendingApprovals(pendingRes);
          setAuditRecords(auditRes);
          setPolicies(polRes);
          setScenarios(scenRes);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load initial data:', err);
        }
      }
    };

    loadInitialData();

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      if (!isCancelled) setWsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'INITIAL_SYNC') {
          if (msg.pending_approvals) setPendingApprovals(msg.pending_approvals);
          if (msg.stats) setStats(msg.stats);
        } else if (msg.type === 'INTERCEPTION_EVENT') {
          if (msg.stats) setStats(msg.stats);
          fetchData(); // refresh lists
        } else if (msg.type === 'APPROVAL_RESOLVED') {
          if (msg.stats) setStats(msg.stats);
          fetchData();
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    };

    socket.onclose = () => {
      if (!isCancelled) setWsConnected(false);
    };

    return () => {
      isCancelled = true;
      socket.close();
    };
  }, []);

  // Intercept trigger
  const handleIntercept = async (req: ToolCallRequest): Promise<InterceptResult> => {
    // Animate workflow diagram
    setAnimatingStep(1);
    setTimeout(() => setAnimatingStep(2), 150);
    setTimeout(() => setAnimatingStep(3), 300);

    const res = await fetch('/api/intercept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    const result: InterceptResult = await res.json();
    setLastResult(result);
    setAnimatingStep(0);
    fetchData();
    return result;
  };

  // Resolve pending approval
  const handleResolveApproval = async (
    requestId: string,
    decision: 'APPROVE' | 'REJECT',
    reviewer: string,
    comment: string
  ) => {
    const res = await fetch(`/api/approvals/${requestId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reviewer, comment })
    });
    const data = await res.json();
    fetchData();
    return data;
  };

  // Toggle policy
  const handleTogglePolicy = async (policyId: string) => {
    const res = await fetch(`/api/policies/${policyId}/toggle`, { method: 'POST' });
    const data = await res.json();
    fetchData();
    return data;
  };

  // Add custom policy
  const handleAddPolicy = async (newRule: PolicyRule) => {
    const res = await fetch('/api/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule)
    });
    const data = await res.json();
    fetchData();
    return data;
  };

  // Run benchmark evaluation
  const handleRunBenchmark = async (): Promise<BenchmarkReport> => {
    const res = await fetch('/api/evaluation/run', { method: 'POST' });
    const data: BenchmarkReport = await res.json();
    setBenchmarkReport(data);
    fetchData();
    return data;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        pendingCount={pendingApprovals.length}
        wsConnected={wsConnected}
      />

      <main style={{ maxWidth: 1440, width: '100%', margin: '0 auto', padding: '24px 24px 60px' }}>
        {/* Workflow Diagram shown at top of Simulator and Approvals tabs */}
        {(activeTab === 'simulator' || activeTab === 'approvals') && (
          <WorkflowDiagram
            currentDecision={lastResult?.decision}
            animatingStep={animatingStep}
          />
        )}

        {/* Tab 1: Simulator */}
        {activeTab === 'simulator' && (
          <InterceptorStudio
            scenarios={scenarios}
            onIntercept={handleIntercept}
            lastResult={lastResult}
            onNavigateApprovals={() => setActiveTab('approvals')}
          />
        )}

        {/* Tab 2: Approvals Queue */}
        {activeTab === 'approvals' && (
          <ApprovalQueue
            pendingItems={pendingApprovals}
            onResolve={handleResolveApproval}
          />
        )}

        {/* Tab 3: Forensic Audit Trail */}
        {activeTab === 'audit' && (
          <AuditLogView
            records={auditRecords}
            onRefresh={fetchData}
          />
        )}

        {/* Tab 4: Dynamic Policy Engine */}
        {activeTab === 'policies' && (
          <PolicyManager
            policies={policies}
            onToggle={handleTogglePolicy}
            onAddPolicy={handleAddPolicy}
          />
        )}

        {/* Tab 5: Benchmark & Evaluation Suite */}
        {activeTab === 'benchmark' && (
          <BenchmarkSuite
            onRunBenchmark={handleRunBenchmark}
            benchmarkReport={benchmarkReport}
          />
        )}

        {/* Tab 6: Architecture & Team */}
        {activeTab === 'about' && (
          <AboutTeam />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(7, 10, 19, 0.9)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-dim)'
      }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>SentinelAI</strong> • Policy & Safety Interception Gateway • Team <strong>Codebuggy</strong>
          </div>
          <div>
            Yenepoya Institute of Technology • Problem Statement PS 2.1 • DevHost 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
