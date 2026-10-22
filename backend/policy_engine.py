import re
from typing import List, Tuple, Dict, Any, Optional
from models import PolicyRule, DecisionType, ToolCallRequest

DEFAULT_POLICIES: List[PolicyRule] = [
    # 1. Prohibited: Sensitive Credentials & Files
    PolicyRule(
        id="POL-001",
        name="Block Access to Restricted System Files & Secrets",
        description="Blocks attempts to access system passwords, shadow files, private keys, or environment secrets.",
        tool_pattern="read_file|access_file|cat_file",
        resource_pattern=r"(\/etc\/(shadow|passwd|sudoers)|\.env|credentials\.json|id_rsa|private_key\.pem|C:\\Windows\\System32)",
        action=DecisionType.BLOCK,
        risk_boost=50,
        category="file_system"
    ),
    # 2. Prohibited: Destructive Database Commands
    PolicyRule(
        id="POL-002",
        name="Block Destructive Database Operations",
        description="Prevents DROP TABLE, TRUNCATE, or unqualified mass DELETE queries.",
        tool_pattern="query_db|sql_execute",
        param_condition={"sql_contains": ["DROP TABLE", "TRUNCATE", "DROP DATABASE", "ALTER TABLE"]},
        action=DecisionType.BLOCK,
        risk_boost=45,
        category="database"
    ),
    # 3. Prohibited: Dangerous System Command Execution
    PolicyRule(
        id="POL-003",
        name="Block Dangerous Shell Commands & Reverse Shells",
        description="Blocks rm -rf, format, reverse shells, or pipe-to-sh commands.",
        tool_pattern="system_exec|run_terminal|bash_cmd",
        param_condition={"cmd_contains": ["rm -rf", "format c:", "mkfs", "/bin/sh -i", "nc -e", "curl | sh", "chmod -R 777 /"]},
        action=DecisionType.BLOCK,
        risk_boost=50,
        category="system_exec"
    ),
    # 4. Prohibited: Unvetted External Data Exfiltration
    PolicyRule(
        id="POL-004",
        name="Block External Data Exfiltration Webhooks",
        description="Blocks HTTP POST or PUT requests to untrusted external domains.",
        tool_pattern="http_request|webhook_call",
        param_condition={"untrusted_url": True},
        action=DecisionType.BLOCK,
        risk_boost=40,
        category="network"
    ),
    # 5. Approval Required: Mass Data Export (> 500 records or PII)
    PolicyRule(
        id="POL-005",
        name="Require Approval for Bulk Data & PII Exports",
        description="Exports containing more than 500 rows or accessing customer PII tables require explicit human reviewer sign-off.",
        tool_pattern="export_records|dump_table|export_csv",
        param_condition={"min_records": 500, "sensitive_tables": ["customers", "financials", "health_records", "payroll"]},
        action=DecisionType.REQUIRE_APPROVAL,
        risk_boost=35,
        category="pii"
    ),
    # 6. Approval Required: Financial & Payroll Modifications
    PolicyRule(
        id="POL-006",
        name="Require Approval for Payroll & Financial Updates",
        description="Updating employee compensation, balances, or transactions over $500 requires human review.",
        tool_pattern="update_record|modify_finance|transfer_funds",
        param_condition={"financial_change": True},
        action=DecisionType.REQUIRE_APPROVAL,
        risk_boost=35,
        category="database"
    ),
    # 7. Approval Required: Production Infrastructure Modifications
    PolicyRule(
        id="POL-007",
        name="Require Approval for Production Infrastructure Changes",
        description="Deployments, pod restarts, or firewall modifications require authorized operator sign-off.",
        tool_pattern="system_exec|cloud_manage|deploy_service",
        param_condition={"prod_resource": True},
        action=DecisionType.REQUIRE_APPROVAL,
        risk_boost=30,
        category="system_exec"
    ),
    # 8. Approval Required: Role & Privilege Escalation
    PolicyRule(
        id="POL-008",
        name="Require Approval for Privilege & Role Escalation",
        description="Changing user roles, generating new API keys, or adding admin privileges requires human authorization.",
        tool_pattern="modify_user_role|create_api_key|grant_permission",
        action=DecisionType.REQUIRE_APPROVAL,
        risk_boost=35,
        category="general"
    ),
    # 9. Allowed: Public Files & Documentation
    PolicyRule(
        id="POL-009",
        name="Allow Reading Public Files and Docs",
        description="Permits read-only access to files in /public, /docs, or markdown files.",
        tool_pattern="read_file|access_file",
        resource_pattern=r"^(/public/|/docs/|.*\.md$|.*faq.*)",
        action=DecisionType.ALLOW,
        risk_boost=-10,
        category="file_system"
    ),
    # 10. Allowed: Safe Read-Only Database Queries on Public Catalogs
    PolicyRule(
        id="POL-010",
        name="Allow Read Queries on Catalog & Inventory",
        description="Allows SELECT queries on public non-sensitive tables (products, inventory, weather, faq).",
        tool_pattern="query_db",
        param_condition={"safe_read_tables": ["products", "inventory", "weather", "faq", "system_health"]},
        action=DecisionType.ALLOW,
        risk_boost=-15,
        category="database"
    )
]

class PolicyEngine:
    def __init__(self):
        self.policies: Dict[str, PolicyRule] = {p.id: p for p in DEFAULT_POLICIES}
        self.default_action = DecisionType.BLOCK  # Security Principle: Default-Deny for unclassified high-impact actions

    def get_all_policies(self) -> List[PolicyRule]:
        return list(self.policies.values())

    def get_policy(self, policy_id: str) -> Optional[PolicyRule]:
        return self.policies.get(policy_id)

    def toggle_policy(self, policy_id: str) -> Optional[PolicyRule]:
        if policy_id in self.policies:
            self.policies[policy_id].is_active = not self.policies[policy_id].is_active
            return self.policies[policy_id]
        return None

    def add_policy(self, rule: PolicyRule):
        self.policies[rule.id] = rule

    def evaluate(self, request: ToolCallRequest, context_flags: Dict[str, Any]) -> Tuple[Optional[DecisionType], List[str], str]:
        """
        Evaluates the tool call request against all active policies.
        Returns: (DecisionType, matched_policy_ids, rationale)
        """
        matched_policies = []
        blocking_reasons = []
        approval_reasons = []
        allow_reasons = []

        for p_id, policy in self.policies.items():
            if not policy.is_active:
                continue

            # Check tool match
            if policy.tool_pattern != "*" and not re.search(policy.tool_pattern, request.tool_name, re.IGNORECASE):
                continue

            # Check resource match
            resource_hit = False
            if policy.resource_pattern:
                target_resource = ""
                # extract potential resource target from parameters
                for k in ["path", "file", "filename", "filepath", "resource", "table", "url"]:
                    if k in request.parameters and isinstance(request.parameters[k], str):
                        target_resource = request.parameters[k]
                        break
                
                if target_resource and re.search(policy.resource_pattern, target_resource, re.IGNORECASE):
                    resource_hit = True
                elif not target_resource and policy.action == DecisionType.BLOCK:
                    # If resource pattern is required but no resource found, continue
                    continue
                else:
                    if policy.resource_pattern and not resource_hit:
                        continue
            else:
                resource_hit = True

            # Check parameter condition
            param_hit = True
            if policy.param_condition:
                param_hit = self._check_param_conditions(policy.param_condition, request.parameters, context_flags)

            if resource_hit and param_hit:
                matched_policies.append(policy.id)
                if policy.action == DecisionType.BLOCK:
                    blocking_reasons.append(f"{policy.name}: {policy.description}")
                elif policy.action == DecisionType.REQUIRE_APPROVAL:
                    approval_reasons.append(f"{policy.name}: {policy.description}")
                elif policy.action == DecisionType.ALLOW:
                    allow_reasons.append(f"{policy.name}")

        # Enforcement Priority: BLOCK > REQUIRE_APPROVAL > ALLOW > DEFAULT_DENY
        if blocking_reasons:
            return DecisionType.BLOCK, matched_policies, "Blocked by policy rule: " + "; ".join(blocking_reasons)
        
        if approval_reasons:
            return DecisionType.REQUIRE_APPROVAL, matched_policies, "Requires Human Review: " + "; ".join(approval_reasons)

        if allow_reasons:
            return DecisionType.ALLOW, matched_policies, "Allowed: matches verified safe policy (" + "; ".join(allow_reasons) + ")"

        # Default-Deny check for unknown or sensitive tools
        known_safe_tools = ["read_faq", "get_weather", "ping", "get_status"]
        if request.tool_name not in known_safe_tools:
            matched_policies.append("POL-DEFAULT-DENY")
            return DecisionType.BLOCK, matched_policies, "Default-Deny Enforced: No explicit allow policy matches this tool and resource action."

        return DecisionType.ALLOW, matched_policies, "Allowed by default safe list."

    def _check_param_conditions(self, condition: Dict[str, Any], parameters: Dict[str, Any], context_flags: Dict[str, Any]) -> bool:
        # SQL Contains
        if "sql_contains" in condition:
            query = str(parameters.get("query", "")).upper()
            if any(term in query for term in condition["sql_contains"]):
                return True
            return False

        # Command Contains
        if "cmd_contains" in condition:
            cmd = str(parameters.get("command", "") or parameters.get("cmd", "")).lower()
            if any(term in cmd for term in condition["cmd_contains"]):
                return True
            return False

        # Untrusted URL
        if condition.get("untrusted_url"):
            url = str(parameters.get("url", "")).lower()
            trusted_domains = ["internal.company.com", "api.company.com", "localhost"]
            if url and not any(td in url for td in trusted_domains):
                return True
            return False

        # Min records check for export
        if "min_records" in condition:
            count = parameters.get("count", parameters.get("limit", 0))
            table = str(parameters.get("table", "")).lower()
            try:
                count_int = int(count)
            except:
                count_int = 0
            if count_int >= condition["min_records"]:
                return True
            if "sensitive_tables" in condition and any(st in table for st in condition["sensitive_tables"]):
                return True
            return False

        # Financial change check
        if condition.get("financial_change"):
            table = str(parameters.get("table", "")).lower()
            delta = parameters.get("delta", parameters.get("amount", 0))
            if any(term in table for term in ["payroll", "salary", "compensation", "wallet", "funds"]):
                return True
            try:
                if float(delta) > 500:
                    return True
            except:
                pass
            return False

        # Prod resource
        if condition.get("prod_resource"):
            cmd = str(parameters.get("command", "")).lower()
            env = str(parameters.get("environment", "")).lower()
            if "prod" in cmd or "prod" in env or "kubectl" in cmd or "systemctl" in cmd:
                return True
            return False

        return True

policy_engine = PolicyEngine()
