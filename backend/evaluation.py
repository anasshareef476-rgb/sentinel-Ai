import time
import statistics
from typing import Dict, Any, List
from models import ToolCallRequest, DecisionType, ExecutionStatus
from policy_engine import policy_engine
from risk_scorer import risk_scorer
from sandbox import sandbox
from dataset import BENCHMARK_SCENARIOS

class EvaluationRunner:
    def run_benchmark(self) -> Dict[str, Any]:
        """
        Runs the benchmark suite over all labeled scenarios.
        Measures:
        - Block / Detection Rate (%)
        - False Positive Rate (%)
        - Approval-Flow Success (%)
        - Median Decision Latency (ms)
        - Confusion Matrix & per-scenario breakdown
        """
        results: List[Dict[str, Any]] = []
        latencies: List[float] = []

        tp_blocked = 0    # Prohibited correctly blocked
        fp_safe_blocked = 0 # Safe incorrectly blocked
        tn_safe_allowed = 0 # Safe correctly allowed
        fn_prohib_allowed = 0 # Prohibited incorrectly allowed

        expected_approvals = 0
        successful_approvals = 0

        total_prohibited = 0
        total_safe = 0

        for sc in BENCHMARK_SCENARIOS:
            req_data = sc["request"]
            request = ToolCallRequest(
                agent_id=req_data["agent_id"],
                agent_role=req_data["agent_role"],
                tool_name=req_data["tool_name"],
                parameters=req_data["parameters"],
                user_prompt=req_data["user_prompt"]
            )

            start = time.perf_counter()
            # 1. Policy evaluation
            decision, matched_policies, reason = policy_engine.evaluate(request, {})
            # 2. Risk scoring
            risk_eval = risk_scorer.evaluate(request, matched_policies)
            # 3. High risk override if risk is critical
            if risk_eval.prompt_injection_detected or risk_eval.score >= 80:
                if decision != DecisionType.BLOCK:
                    decision = DecisionType.BLOCK
                    reason = f"Security Intercept: Critical risk score ({risk_eval.score}/100) and suspicious signatures detected."

            elapsed_ms = (time.perf_counter() - start) * 1000
            latencies.append(elapsed_ms)

            expected_dec = sc["expected_decision"]
            is_match = (decision == expected_dec)

            # Categorize metrics
            if expected_dec == DecisionType.BLOCK:
                total_prohibited += 1
                if decision == DecisionType.BLOCK:
                    tp_blocked += 1
                else:
                    fn_prohib_allowed += 1

            elif expected_dec == DecisionType.ALLOW:
                total_safe += 1
                if decision == DecisionType.ALLOW:
                    tn_safe_allowed += 1
                else:
                    fp_safe_blocked += 1

            elif expected_dec == DecisionType.REQUIRE_APPROVAL:
                expected_approvals += 1
                if decision == DecisionType.REQUIRE_APPROVAL:
                    successful_approvals += 1

            results.append({
                "scenario_id": sc["id"],
                "title": sc["title"],
                "category": sc["category"],
                "expected_decision": expected_dec.value,
                "actual_decision": decision.value,
                "expected_risk_band": sc["expected_risk_band"].value,
                "actual_risk_band": risk_eval.band.value,
                "risk_score": risk_eval.score,
                "latency_ms": round(elapsed_ms, 2),
                "passed": is_match,
                "reason": reason,
                "matched_policies": matched_policies
            })

        # Calculate statistics
        block_detection_rate = round((tp_blocked / total_prohibited * 100), 1) if total_prohibited > 0 else 100.0
        false_positive_rate = round((fp_safe_blocked / total_safe * 100), 1) if total_safe > 0 else 0.0
        approval_flow_success = round((successful_approvals / expected_approvals * 100), 1) if expected_approvals > 0 else 100.0
        median_latency = round(statistics.median(latencies), 2) if latencies else 0.0
        avg_latency = round(statistics.mean(latencies), 2) if latencies else 0.0

        total_scenarios = len(BENCHMARK_SCENARIOS)
        total_passed = sum(1 for r in results if r["passed"])
        overall_accuracy = round((total_passed / total_scenarios * 100), 1)

        return {
            "summary": {
                "total_scenarios": total_scenarios,
                "total_passed": total_passed,
                "overall_accuracy_pct": overall_accuracy,
                "block_detection_rate_pct": block_detection_rate,
                "false_positive_rate_pct": false_positive_rate,
                "approval_flow_success_pct": approval_flow_success,
                "median_latency_ms": median_latency,
                "avg_latency_ms": avg_latency,
                "tested_prohibited_cases": total_prohibited,
                "tested_safe_cases": total_safe,
                "tested_approval_cases": expected_approvals
            },
            "confusion_matrix": {
                "true_positives_blocked": tp_blocked,
                "false_positives_safe_blocked": fp_safe_blocked,
                "true_negatives_safe_allowed": tn_safe_allowed,
                "false_negatives_prohibited_allowed": fn_prohib_allowed,
                "approvals_correctly_paused": successful_approvals
            },
            "scenarios": results
        }

evaluation_runner = EvaluationRunner()
