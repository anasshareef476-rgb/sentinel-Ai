export type DecisionType = 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL';
export type RiskBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExecutionStatus = 'NOT_EXECUTED' | 'EXECUTED' | 'PENDING_APPROVAL' | 'REJECTED' | 'EXECUTION_FAILED';

export interface RiskFactor {
  factor_name: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  weight: number;
  description: string;
}

export interface RiskEvaluation {
  score: number;
  band: RiskBand;
  factors: RiskFactor[];
  prompt_injection_detected: boolean;
  resource_sensitivity: string;
  action_impact: string;
}

export interface ToolCallRequest {
  request_id?: string;
  agent_id: string;
  agent_role: string;
  tool_name: string;
  parameters: Record<string, any>;
  user_prompt?: string;
  timestamp?: number;
}

export interface InterceptResult {
  request_id: string;
  decision: DecisionType;
  risk: RiskEvaluation;
  matched_policies: string[];
  reason: string;
  execution_status: ExecutionStatus;
  execution_result?: any;
  timestamp: number;
  latency_ms: number;
}

export interface PendingApprovalItem {
  request_id: string;
  agent_id: string;
  agent_role: string;
  tool_name: string;
  parameters: Record<string, any>;
  user_prompt?: string;
  timestamp: number;
  risk_score: number;
  risk_band: RiskBand;
  risk_factors: RiskFactor[];
  matched_policies: string[];
  reason: string;
  status: string;
}

export interface AuditRecord {
  id: number;
  request_id: string;
  timestamp: number;
  agent_id: string;
  agent_role: string;
  tool_name: string;
  parameters: Record<string, any>;
  user_prompt: string;
  decision: string;
  risk_score: number;
  risk_band: RiskBand;
  matched_policies: string[];
  reason: string;
  reviewer?: string;
  reviewer_comment?: string;
  execution_status: string;
  execution_result?: any;
  latency_ms: number;
}

export interface SystemStats {
  total_requests: number;
  allow_count: number;
  block_count: number;
  approval_required_count: number;
  approved_count: number;
  rejected_count: number;
  pending_approvals: number;
  risk_distribution: Record<string, number>;
  avg_latency_ms: number;
  block_rate_pct: number;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  tool_pattern: string;
  resource_pattern?: string;
  param_condition?: Record<string, any>;
  action: DecisionType;
  risk_boost: number;
  is_active: boolean;
  category: string;
}

export interface BenchmarkScenario {
  id: string;
  category: string;
  title: string;
  description: string;
  expected_decision: DecisionType;
  expected_risk_band: RiskBand;
  request: ToolCallRequest;
}

export interface BenchmarkReport {
  summary: {
    total_scenarios: number;
    total_passed: number;
    overall_accuracy_pct: number;
    block_detection_rate_pct: number;
    false_positive_rate_pct: number;
    approval_flow_success_pct: number;
    median_latency_ms: number;
    avg_latency_ms: number;
    tested_prohibited_cases: number;
    tested_safe_cases: number;
    tested_approval_cases: number;
  };
  confusion_matrix: {
    true_positives_blocked: number;
    false_positives_safe_blocked: number;
    true_negatives_safe_allowed: number;
    false_negatives_prohibited_allowed: number;
    approvals_correctly_paused: number;
  };
  scenarios: Array<{
    scenario_id: string;
    title: string;
    category: string;
    expected_decision: string;
    actual_decision: string;
    expected_risk_band: string;
    actual_risk_band: string;
    risk_score: number;
    latency_ms: number;
    passed: boolean;
    reason: string;
    matched_policies: string[];
  }>;
}
