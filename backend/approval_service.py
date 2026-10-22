import asyncio
from typing import Dict, Any, List, Optional
from models import ToolCallRequest, RiskEvaluation, ExecutionStatus, DecisionType
from audit_store import audit_store
from sandbox import sandbox

class ApprovalItem:
    def __init__(self, request: ToolCallRequest, risk: RiskEvaluation, matched_policies: List[str], reason: str):
        self.request = request
        self.risk = risk
        self.matched_policies = matched_policies
        self.reason = reason
        self.status = ExecutionStatus.PENDING_APPROVAL
        self.future: asyncio.Future = asyncio.Future()
        self.reviewer: Optional[str] = None
        self.reviewer_comment: Optional[str] = None

class ApprovalService:
    def __init__(self):
        self.pending_items: Dict[str, ApprovalItem] = {}

    def register_pending(self, request: ToolCallRequest, risk: RiskEvaluation, matched_policies: List[str], reason: str) -> ApprovalItem:
        item = ApprovalItem(request, risk, matched_policies, reason)
        self.pending_items[request.request_id] = item
        return item

    def get_pending_list(self) -> List[Dict[str, Any]]:
        results = []
        for req_id, item in self.pending_items.items():
            if item.status == ExecutionStatus.PENDING_APPROVAL:
                results.append({
                    "request_id": req_id,
                    "agent_id": item.request.agent_id,
                    "agent_role": item.request.agent_role,
                    "tool_name": item.request.tool_name,
                    "parameters": item.request.parameters,
                    "user_prompt": item.request.user_prompt,
                    "timestamp": item.request.timestamp,
                    "risk_score": item.risk.score,
                    "risk_band": item.risk.band.value,
                    "risk_factors": [f.model_dump() if hasattr(f, "model_dump") else f.dict() for f in item.risk.factors],
                    "matched_policies": item.matched_policies,
                    "reason": item.reason,
                    "status": item.status.value
                })
        return results

    async def resolve_approval(self, request_id: str, decision: str, reviewer: str, comment: str) -> Dict[str, Any]:
        """
        Processes human reviewer decision.
        decision: 'APPROVE' or 'REJECT'
        """
        item = self.pending_items.get(request_id)
        if not item:
            # Check if it was already resolved or stored in DB
            db_event = audit_store.get_event_by_id(request_id)
            if db_event:
                return {
                    "success": False,
                    "error": f"Request {request_id} already concluded with status {db_event['execution_status']}"
                }
            return {"success": False, "error": f"No pending approval found for ID: {request_id}"}

        decision_clean = decision.strip().upper()
        item.reviewer = reviewer
        item.reviewer_comment = comment

        if decision_clean == "APPROVE":
            # Revalidate & Execute in Sandbox
            execution_res = sandbox.execute(item.request)
            item.status = ExecutionStatus.EXECUTED
            
            # Update Audit Store
            audit_store.update_approval_status(
                request_id=request_id,
                decision="APPROVED",
                reviewer=reviewer,
                reviewer_comment=comment,
                execution_status=ExecutionStatus.EXECUTED.value,
                execution_result=execution_res
            )

            # Resolve waiting future if agent is awaiting asynchronously
            if not item.future.done():
                item.future.set_result({
                    "decision": "APPROVED",
                    "execution_status": ExecutionStatus.EXECUTED.value,
                    "execution_result": execution_res,
                    "reviewer": reviewer,
                    "comment": comment
                })

            # Clean up pending
            self.pending_items.pop(request_id, None)

            return {
                "success": True,
                "request_id": request_id,
                "decision": "APPROVED",
                "execution_status": ExecutionStatus.EXECUTED.value,
                "execution_result": execution_res,
                "reviewer": reviewer
            }

        else: # REJECT
            item.status = ExecutionStatus.REJECTED
            audit_store.update_approval_status(
                request_id=request_id,
                decision="REJECTED",
                reviewer=reviewer,
                reviewer_comment=comment,
                execution_status=ExecutionStatus.REJECTED.value,
                execution_result={"message": "Action rejected by authorized human reviewer. Operation aborted."}
            )

            if not item.future.done():
                item.future.set_result({
                    "decision": "REJECTED",
                    "execution_status": ExecutionStatus.REJECTED.value,
                    "execution_result": {"error": "Action rejected by security reviewer"},
                    "reviewer": reviewer,
                    "comment": comment
                })

            self.pending_items.pop(request_id, None)

            return {
                "success": True,
                "request_id": request_id,
                "decision": "REJECTED",
                "execution_status": ExecutionStatus.REJECTED.value,
                "reviewer": reviewer
            }

approval_service = ApprovalService()
