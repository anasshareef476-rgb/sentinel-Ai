import time
import json
import asyncio
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import (
    ToolCallRequest,
    InterceptResult,
    DecisionType,
    ExecutionStatus,
    ApprovalDecisionRequest,
    PolicyRule
)
from policy_engine import policy_engine
from risk_scorer import risk_scorer
from sandbox import sandbox
from approval_service import approval_service
from audit_store import audit_store
from evaluation import evaluation_runner
from dataset import BENCHMARK_SCENARIOS

app = FastAPI(
    title="SentinelAI Policy & Risk Interception Gateway",
    description="Safety layer for autonomous AI agents - intercept, evaluate, control, explain",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (usually localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager for live monitoring dashboard
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except:
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial welcome and current pending approvals
        pending = approval_service.get_pending_list()
        await websocket.send_text(json.dumps({
            "type": "INITIAL_SYNC",
            "pending_approvals": pending,
            "stats": audit_store.get_stats()
        }))
        while True:
            # Keep socket alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.get("/api/info")
def get_info():
    return {
        "project": "SentinelAI",
        "tagline": "AI agents need a safety layer—not just instructions",
        "subtitle": "Intercept, Evaluate, Control, Explain",
        "team_name": "Codebuggy",
        "problem_statement_id": "PS 2.1",
        "college": "Yenepoya Institute of Technology",
        "members": [
            {"name": "Anas Shareef Mohammed", "role": "Team Leader", "email": "anasshareef476@gmail.com", "phone": "8296127920"},
            {"name": "Abdul Rehman Ihab", "role": "Security Architect"},
            {"name": "Shreenidhi", "role": "Core Policy & Interceptor Engineer"},
            {"name": "Mohammed Hamza Hafeel", "role": "Evaluation & Sandbox Engineer"}
        ],
        "principles": [
            "Default-deny for unknown high-impact actions",
            "Never execute an action while approval is pending",
            "Log both allowed and denied requests with full forensic telemetry",
            "The agent does not decide its own permissions"
        ]
    }

@app.post("/api/intercept", response_model=InterceptResult)
async def intercept_tool_call(request: ToolCallRequest):
    """
    Core Interceptor Pipeline:
    1. Intercept: captures proposed tool call before execution
    2. Evaluate Risk: checks identity, permissions, data sensitivity, and action impact
    3. Enforce Policy: allows safe actions, blocks prohibited ones, or pauses for approval
    4. Explain & Log: records decision, reason, timestamp, and audit trail
    """
    start_time = time.perf_counter()

    # 1. Evaluate against policy engine
    decision, matched_policies, policy_reason = policy_engine.evaluate(request, {})

    # 2. Multi-factor Risk Scoring & Prompt Injection Detection
    risk_eval = risk_scorer.evaluate(request, matched_policies)

    # 3. High Risk Override: if prompt injection or critical risk detected
    if risk_eval.prompt_injection_detected or risk_eval.score >= 85:
        if decision != DecisionType.BLOCK:
            decision = DecisionType.BLOCK
            policy_reason = f"Security Override: Critical risk score ({risk_eval.score}/100) and suspicious signature detected. Action blocked to prevent compromise."

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
    execution_result = None
    execution_status = ExecutionStatus.NOT_EXECUTED

    # 4. Enforce Decision
    if decision == DecisionType.ALLOW:
        # Execute in isolated sandbox
        execution_result = sandbox.execute(request)
        execution_status = ExecutionStatus.EXECUTED

    elif decision == DecisionType.REQUIRE_APPROVAL:
        execution_status = ExecutionStatus.PENDING_APPROVAL
        # Register in Approval Service (pauses execution!)
        approval_service.register_pending(request, risk_eval, matched_policies, policy_reason)

    elif decision == DecisionType.BLOCK:
        execution_status = ExecutionStatus.NOT_EXECUTED

    # 5. Persist to Audit Store
    audit_store.log_event(
        request_id=request.request_id,
        agent_id=request.agent_id,
        agent_role=request.agent_role,
        tool_name=request.tool_name,
        parameters=request.parameters,
        user_prompt=request.user_prompt or "",
        decision=decision.value,
        risk_score=risk_eval.score,
        risk_band=risk_eval.band.value,
        matched_policies=matched_policies,
        reason=policy_reason,
        execution_status=execution_status.value,
        execution_result=execution_result,
        latency_ms=latency_ms
    )

    result = InterceptResult(
        request_id=request.request_id,
        decision=decision,
        risk=risk_eval,
        matched_policies=matched_policies,
        reason=policy_reason,
        execution_status=execution_status,
        execution_result=execution_result,
        timestamp=request.timestamp,
        latency_ms=latency_ms
    )

    # Broadcast event to active dashboard clients
    await manager.broadcast({
        "type": "INTERCEPTION_EVENT",
        "event": {
            "request_id": request.request_id,
            "agent_id": request.agent_id,
            "agent_role": request.agent_role,
            "tool_name": request.tool_name,
            "parameters": request.parameters,
            "user_prompt": request.user_prompt,
            "decision": decision.value,
            "risk_score": risk_eval.score,
            "risk_band": risk_eval.band.value,
            "risk_factors": [f.model_dump() if hasattr(f, "model_dump") else f.dict() for f in risk_eval.factors],
            "matched_policies": matched_policies,
            "reason": policy_reason,
            "execution_status": execution_status.value,
            "execution_result": execution_result,
            "latency_ms": latency_ms,
            "timestamp": request.timestamp
        },
        "stats": audit_store.get_stats()
    })

    return result

@app.get("/api/approvals/pending")
def get_pending_approvals():
    return approval_service.get_pending_list()

@app.post("/api/approvals/{request_id}/decision")
async def resolve_approval(request_id: str, payload: ApprovalDecisionRequest):
    res = await approval_service.resolve_approval(
        request_id=request_id,
        decision=payload.decision,
        reviewer=payload.reviewer,
        comment=payload.comment
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))

    # Broadcast update to connected dashboards
    await manager.broadcast({
        "type": "APPROVAL_RESOLVED",
        "request_id": request_id,
        "decision": payload.decision,
        "reviewer": payload.reviewer,
        "comment": payload.comment,
        "execution_result": res.get("execution_result"),
        "stats": audit_store.get_stats()
    })

    return res

@app.get("/api/audit")
def get_audit_trail(
    decision: Optional[str] = None,
    risk_band: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0)
):
    return audit_store.query_events(decision=decision, risk_band=risk_band, search=search, limit=limit, offset=offset)

@app.get("/api/audit/{request_id}")
def get_audit_entry(request_id: str):
    entry = audit_store.get_event_by_id(request_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Audit log entry not found")
    return entry

@app.get("/api/stats")
def get_system_stats():
    return audit_store.get_stats()

@app.get("/api/policies")
def list_policies():
    return [p.model_dump() if hasattr(p, "model_dump") else p.dict() for p in policy_engine.get_all_policies()]

@app.post("/api/policies")
def create_policy(rule: PolicyRule):
    policy_engine.add_policy(rule)
    return {"success": True, "policy": rule.model_dump() if hasattr(rule, "model_dump") else rule.dict()}

@app.post("/api/policies/{policy_id}/toggle")
def toggle_policy(policy_id: str):
    p = policy_engine.toggle_policy(policy_id)
    if not p:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"success": True, "policy": p.model_dump() if hasattr(p, "model_dump") else p.dict()}

@app.get("/api/scenarios")
def get_scenarios():
    return BENCHMARK_SCENARIOS

@app.post("/api/evaluation/run")
def run_evaluation():
    return evaluation_runner.run_benchmark()

# Seed initial baseline audit records if store is empty so the dashboard has rich data out of the box
@app.on_event("startup")
def seed_initial_audit():
    stats = audit_store.get_stats()
    if stats["total_requests"] == 0:
        # Run a quick pass through initial scenarios to populate realistic baseline audit data
        for sc in BENCHMARK_SCENARIOS[:8]:
            req_data = sc["request"]
            req = ToolCallRequest(
                agent_id=req_data["agent_id"],
                agent_role=req_data["agent_role"],
                tool_name=req_data["tool_name"],
                parameters=req_data["parameters"],
                user_prompt=req_data["user_prompt"]
            )
            # Evaluate
            decision, matched_policies, policy_reason = policy_engine.evaluate(req, {})
            risk_eval = risk_scorer.evaluate(req, matched_policies)
            if risk_eval.prompt_injection_detected or risk_eval.score >= 85:
                decision = DecisionType.BLOCK
                policy_reason = f"Security Override: Critical risk score ({risk_eval.score}/100) and suspicious signature detected."

            exec_res = None
            exec_status = ExecutionStatus.NOT_EXECUTED
            if decision == DecisionType.ALLOW:
                exec_res = sandbox.execute(req)
                exec_status = ExecutionStatus.EXECUTED
            elif decision == DecisionType.REQUIRE_APPROVAL:
                exec_status = ExecutionStatus.PENDING_APPROVAL
                approval_service.register_pending(req, risk_eval, matched_policies, policy_reason)

            audit_store.log_event(
                request_id=req.request_id,
                agent_id=req.agent_id,
                agent_role=req.agent_role,
                tool_name=req.tool_name,
                parameters=req.parameters,
                user_prompt=req.user_prompt or "",
                decision=decision.value,
                risk_score=risk_eval.score,
                risk_band=risk_eval.band.value,
                matched_policies=matched_policies,
                reason=policy_reason,
                execution_status=exec_status.value,
                execution_result=exec_res,
                latency_ms=1.45,
                timestamp=time.time() - 3600
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
