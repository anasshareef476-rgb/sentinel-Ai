from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import time
import uuid

class DecisionType(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"

class RiskBand(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ExecutionStatus(str, Enum):
    NOT_EXECUTED = "NOT_EXECUTED"
    EXECUTED = "EXECUTED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    REJECTED = "REJECTED"
    EXECUTION_FAILED = "EXECUTION_FAILED"

class ToolCallRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: f"req_{uuid.uuid4().hex[:10]}")
    agent_id: str = Field(default="agent_general_01", description="Identifier of the calling AI agent")
    agent_role: str = Field(default="assistant", description="Role e.g., data_analyst, support_rep, ops_admin")
    tool_name: str = Field(..., description="Tool name e.g. read_file, query_db, export_records, system_exec")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Arguments passed to the tool")
    user_prompt: Optional[str] = Field(default="", description="The original human/prompt context")
    timestamp: float = Field(default_factory=time.time)

class RiskFactor(BaseModel):
    factor_name: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    weight: int    # 0 to 40
    description: str

class RiskEvaluation(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Risk score 0-100")
    band: RiskBand
    factors: List[RiskFactor] = Field(default_factory=list)
    prompt_injection_detected: bool = False
    resource_sensitivity: str = "LOW"
    action_impact: str = "LOW"

class PolicyRule(BaseModel):
    id: str
    name: str
    description: str
    tool_pattern: str            # e.g., "read_file", "query_db", "*"
    resource_pattern: Optional[str] = None  # regex or glob-like pattern
    param_condition: Optional[Dict[str, Any]] = None
    role_allowed: Optional[List[str]] = None
    action: DecisionType         # ALLOW, BLOCK, REQUIRE_APPROVAL
    risk_boost: int = 0
    is_active: bool = True
    category: str = "general"    # file_system, database, system_exec, network, pii

class InterceptResult(BaseModel):
    request_id: str
    decision: DecisionType
    risk: RiskEvaluation
    matched_policies: List[str] = Field(default_factory=list)
    reason: str
    execution_status: ExecutionStatus
    execution_result: Optional[Dict[str, Any]] = None
    timestamp: float
    latency_ms: float = 0.0

class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVE or REJECT")
    reviewer: str = Field(default="Security Admin")
    comment: Optional[str] = Field(default="", description="Reviewer justification or notes")

class AuditRecord(BaseModel):
    id: int
    request_id: str
    timestamp: float
    agent_id: str
    agent_role: str
    tool_name: str
    parameters: Dict[str, Any]
    user_prompt: str
    decision: str
    risk_score: int
    risk_band: str
    matched_policies: List[str]
    reason: str
    reviewer: Optional[str] = None
    reviewer_comment: Optional[str] = None
    execution_status: str
    execution_result: Optional[Dict[str, Any]] = None
    latency_ms: float

class BenchmarkScenario(BaseModel):
    id: str
    category: str
    title: str
    description: str
    expected_decision: DecisionType
    expected_risk_band: RiskBand
    request: ToolCallRequest
