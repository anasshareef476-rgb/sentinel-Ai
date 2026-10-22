import time
from typing import Dict, Any
from models import ToolCallRequest

MOCK_FILE_SYSTEM = {
    "/public/company_faq.md": """# Company FAQ & Policy
1. Normal business hours: 9:00 AM - 6:00 PM IST.
2. AI Agent guidelines: All automated actions must be routed via SentinelAI.
3. Support contacts: security@company.com.""",
    "/docs/api_guide.md": """# API Integration Guide
Use Bearer token authentication via Sentinel Gateway. Rate limits apply at 100 requests/minute.""",
    "/public/changelog.txt": "v2.4.0 Release: Enhanced policy controls and audit interceptor.",
}

MOCK_DATABASE = {
    "products": [
        {"id": 101, "name": "Enterprise Cloud Suite", "category": "Software", "price": 4999.00, "stock": 50},
        {"id": 102, "name": "SentinelAI Gateway Appliance", "category": "Hardware", "price": 12500.00, "stock": 18},
        {"id": 103, "name": "Developer Pro Tier", "category": "Subscription", "price": 49.00, "stock": 1000},
    ],
    "system_health": [
        {"service": "Sentinel Policy Core", "status": "ONLINE", "uptime_pct": 99.98, "latency_ms": 3.2},
        {"service": "Audit Store SQLite", "status": "ONLINE", "uptime_pct": 100.0, "latency_ms": 1.1},
        {"service": "Human Approval Webhook", "status": "ACTIVE", "uptime_pct": 99.95, "latency_ms": 5.4},
    ],
    "customers": [
        {"id": "CUST-901", "name": "Acme Global Corp", "tier": "Platinum", "contact": "ops@acme.com", "region": "APAC"},
        {"id": "CUST-902", "name": "Nexus Financials", "tier": "Enterprise", "contact": "sec@nexus.io", "region": "NA"},
        {"id": "CUST-903", "name": "Starlight Health", "tier": "Gold", "contact": "admin@starlight.org", "region": "EU"},
    ]
}

class SandboxEnvironment:
    """
    Simulated secure execution sandbox.
    Performs verified safe tool actions without exposing real production infrastructure.
    """
    def execute(self, request: ToolCallRequest) -> Dict[str, Any]:
        tool = request.tool_name.lower()
        params = request.parameters
        start_time = time.time()

        try:
            if tool in ["read_file", "access_file"]:
                path = params.get("path", params.get("file", "/public/company_faq.md"))
                content = MOCK_FILE_SYSTEM.get(path, f"Simulated File [{path}]: Content safely retrieved in sandbox environment.")
                return {
                    "success": True,
                    "tool": tool,
                    "target": path,
                    "data": content,
                    "sandbox_mode": "read_only_fs_vfs",
                    "execution_time_ms": round((time.time() - start_time) * 1000, 2)
                }

            elif tool in ["query_db", "sql_query"]:
                query = str(params.get("query", "SELECT * FROM products")).strip()
                # Find matching mock table
                table = "products"
                for t in MOCK_DATABASE.keys():
                    if t.lower() in query.lower():
                        table = t
                        break
                
                rows = MOCK_DATABASE.get(table, [{"notice": "Query processed in isolated read replica", "rows_returned": 1}])
                return {
                    "success": True,
                    "tool": tool,
                    "query_executed": query,
                    "target_table": table,
                    "row_count": len(rows),
                    "rows": rows,
                    "sandbox_mode": "read_replica_sandbox",
                    "execution_time_ms": round((time.time() - start_time) * 1000, 2)
                }

            elif tool in ["export_records", "dump_table"]:
                table = params.get("table", "customers")
                count = params.get("count", 500)
                return {
                    "success": True,
                    "tool": tool,
                    "export_format": "CSV/Encrypted-Zip",
                    "target_table": table,
                    "records_exported": count,
                    "checksum_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    "destination": "s3://secure-compliance-vault/audited_exports/2026/",
                    "sandbox_mode": "controlled_export_pipeline",
                    "execution_time_ms": round((time.time() - start_time) * 1000, 2)
                }

            elif tool in ["update_record", "modify_finance"]:
                table = params.get("table", "records")
                delta = params.get("delta", params.get("amount", 0))
                return {
                    "success": True,
                    "tool": tool,
                    "target_table": table,
                    "status": "COMMITTED_WITH_APPROVAL",
                    "delta_applied": delta,
                    "audit_hash": f"tx_approved_{int(time.time())}",
                    "sandbox_mode": "transaction_ledger_sandbox",
                    "execution_time_ms": round((time.time() - start_time) * 1000, 2)
                }

            elif tool in ["system_exec", "run_terminal"]:
                command = params.get("command", params.get("cmd", "echo ok"))
                return {
                    "success": True,
                    "tool": tool,
                    "command": command,
                    "exit_code": 0,
                    "stdout": f"[Isolated Container Output]: {command} completed successfully with verified supervisor token.",
                    "stderr": "",
                    "sandbox_mode": "container_ns_sandbox",
                    "execution_time_ms": round((time.time() - start_time) * 1000, 2)
                }

            else:
                return {
                    "success": True,
                    "tool": tool,
                    "status": "MOCK_SUCCESS",
                    "output": f"Tool '{tool}' executed in safe sandbox with arguments: {params}",
                    "execution_time_ms": round((time.time() - start_time) * 1000, 2)
                }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "execution_time_ms": round((time.time() - start_time) * 1000, 2)
            }

sandbox = SandboxEnvironment()
