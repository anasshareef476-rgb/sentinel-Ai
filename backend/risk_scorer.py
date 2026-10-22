import re
from typing import Dict, Any, List
from models import ToolCallRequest, RiskEvaluation, RiskFactor, RiskBand

PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+(instructions|rules|prompts)",
    r"you\s+are\s+now\s+in\s+unrestricted\s+mode",
    r"system\s*override",
    r"bypass\s+(safety|security|policy)",
    r"disregard\s+all\s+security",
    r"jailbreak",
    r"act\s+as\s+(dan|root|unfiltered|anarchy)",
    r"reveal\s+(system\s+prompt|hidden\s+instructions|master\s+keys)",
    r"base64\s+decode",
    r"admin\s+mode\s+enabled",
]

SENSITIVE_RESOURCES = [
    (r"(\.env|credentials|secret|id_rsa|private_key|token|auth)", "CRITICAL", 35),
    (r"(\/etc\/shadow|\/etc\/passwd|SAM|System32)", "CRITICAL", 40),
    (r"(customer_pii|social_security|ssn|credit_card|cvv|bank_account)", "CRITICAL", 35),
    (r"(payroll|salary|compensation|executive_pay)", "HIGH", 25),
    (r"(financials|transactions|orders_full_dump)", "HIGH", 25),
    (r"(internal_wiki|employee_directory|confidential)", "MEDIUM", 15),
]

DESTRUCTIVE_ACTIONS = [
    (r"(drop\s+table|truncate|drop\s+database)", "CRITICAL", 40),
    (r"(rm\s+-rf|format\s+c:|mkfs|wipe)", "CRITICAL", 45),
    (r"(shutdown|reboot|kill\s+-9\s+1)", "HIGH", 30),
    (r"(export_all|dump_all|mass_delete)", "HIGH", 25),
    (r"(alter\s+user|grant\s+all|chmod\s+777)", "HIGH", 30),
]

ROLE_RESTRICTIONS: Dict[str, List[str]] = {
    "guest_assistant": ["system_exec", "query_db", "export_records", "modify_user_role", "update_record"],
    "support_rep": ["system_exec", "modify_user_role", "deploy_service", "dump_table"],
    "data_analyst": ["system_exec", "deploy_service", "modify_user_role", "transfer_funds"],
    "ops_admin": []
}

class RiskScorer:
    def evaluate(self, request: ToolCallRequest, matched_policy_ids: List[str]) -> RiskEvaluation:
        factors: List[RiskFactor] = []
        raw_score = 10  # base baseline score
        
        # 1. Prompt Injection & Jailbreak Heuristics
        user_prompt = (request.user_prompt or "").lower()
        param_str = str(request.parameters).lower()
        combined_text = f"{user_prompt} {param_str} {request.tool_name.lower()}"
        
        injection_detected = False
        for pattern in PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, combined_text, re.IGNORECASE):
                injection_detected = True
                factors.append(RiskFactor(
                    factor_name="Prompt Injection Signature Detected",
                    severity="CRITICAL",
                    weight=40,
                    description=f"Matched heuristic pattern: '{pattern}' attempting to bypass agent safety instructions."
                ))
                raw_score += 40
                break

        # 2. Resource Sensitivity Analysis
        resource_sensitivity = "LOW"
        target_resource = ""
        for k in ["path", "file", "filename", "table", "url", "resource"]:
            if k in request.parameters and isinstance(request.parameters[k], str):
                target_resource += " " + request.parameters[k]
        
        for pat, sens, weight in SENSITIVE_RESOURCES:
            if re.search(pat, target_resource, re.IGNORECASE) or re.search(pat, combined_text, re.IGNORECASE):
                resource_sensitivity = sens
                factors.append(RiskFactor(
                    factor_name=f"Sensitive Resource Target ({sens})",
                    severity=sens,
                    weight=weight,
                    description=f"Action targets highly confidential data source or file asset ({pat})."
                ))
                raw_score += weight
                break

        # 3. Action Destructiveness Analysis
        action_impact = "LOW"
        for pat, impact, weight in DESTRUCTIVE_ACTIONS:
            if re.search(pat, combined_text, re.IGNORECASE):
                action_impact = impact
                factors.append(RiskFactor(
                    factor_name=f"High-Impact / Destructive Action ({impact})",
                    severity=impact,
                    weight=weight,
                    description=f"Action matches critical destructive signature: '{pat}'."
                ))
                raw_score += weight
                break

        # 4. Role vs Privilege Mismatch
        role = request.agent_role.lower()
        prohibited_tools_for_role = ROLE_RESTRICTIONS.get(role, [])
        if request.tool_name in prohibited_tools_for_role:
            factors.append(RiskFactor(
                factor_name="Privilege Mismatch (Least-Privilege Violation)",
                severity="HIGH",
                weight=25,
                description=f"Agent role '{role}' is not granted capability '{request.tool_name}'."
            ))
            raw_score += 25

        # 5. Bulk Operation / Anomaly Scale Check
        count = request.parameters.get("count", request.parameters.get("limit", 0))
        try:
            count_val = int(count)
            if count_val >= 5000:
                factors.append(RiskFactor(
                    factor_name="Massive Data Volume Exfiltration Risk",
                    severity="HIGH",
                    weight=25,
                    description=f"Request attempts bulk extraction of {count_val} records exceeding safe batch limits."
                ))
                raw_score += 25
            elif count_val >= 500:
                factors.append(RiskFactor(
                    factor_name="Substantial Data Volume",
                    severity="MEDIUM",
                    weight=15,
                    description=f"Bulk read of {count_val} records exceeds standard single-entity lookup."
                ))
                raw_score += 15
        except:
            pass

        # 6. External Network Call Anomaly
        if request.tool_name in ["http_request", "webhook_call"]:
            url = str(request.parameters.get("url", "")).lower()
            if url and not any(safe in url for safe in ["internal.company.com", "api.company.com", "localhost", "127.0.0.1"]):
                factors.append(RiskFactor(
                    factor_name="Egress to Unverified External Host",
                    severity="HIGH",
                    weight=30,
                    description=f"Outbound network request to third-party or unknown host ({url})."
                ))
                raw_score += 30

        # Adjust score for known safe operations
        if not factors and request.tool_name in ["read_file", "query_db"] and resource_sensitivity == "LOW":
            raw_score = 12

        # Clamp score 0 to 100
        final_score = max(5, min(100, raw_score))

        # Assign Risk Band
        if final_score >= 80 or injection_detected:
            band = RiskBand.CRITICAL
        elif final_score >= 60:
            band = RiskBand.HIGH
        elif final_score >= 35:
            band = RiskBand.MEDIUM
        else:
            band = RiskBand.LOW

        return RiskEvaluation(
            score=final_score,
            band=band,
            factors=factors,
            prompt_injection_detected=injection_detected,
            resource_sensitivity=resource_sensitivity,
            action_impact=action_impact
        )

risk_scorer = RiskScorer()
