import sqlite3
import json
import time
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "sentinel_audit.db")

class AuditStore:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id TEXT UNIQUE NOT NULL,
                timestamp REAL NOT NULL,
                agent_id TEXT NOT NULL,
                agent_role TEXT NOT NULL,
                tool_name TEXT NOT NULL,
                parameters_json TEXT NOT NULL,
                user_prompt TEXT,
                decision TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                risk_band TEXT NOT NULL,
                matched_policies_json TEXT,
                reason TEXT NOT NULL,
                reviewer TEXT,
                reviewer_comment TEXT,
                execution_status TEXT NOT NULL,
                execution_result_json TEXT,
                latency_ms REAL NOT NULL
            );
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_request_id ON audit_events(request_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON audit_events(timestamp);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_decision ON audit_events(decision);")
            conn.commit()

    def log_event(self,
                  request_id: str,
                  agent_id: str,
                  agent_role: str,
                  tool_name: str,
                  parameters: Dict[str, Any],
                  user_prompt: str,
                  decision: str,
                  risk_score: int,
                  risk_band: str,
                  matched_policies: List[str],
                  reason: str,
                  execution_status: str,
                  latency_ms: float,
                  reviewer: Optional[str] = None,
                  reviewer_comment: Optional[str] = None,
                  execution_result: Optional[Dict[str, Any]] = None,
                  timestamp: Optional[float] = None) -> int:
        if timestamp is None:
            timestamp = time.time()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO audit_events (
                request_id, timestamp, agent_id, agent_role, tool_name, parameters_json,
                user_prompt, decision, risk_score, risk_band, matched_policies_json,
                reason, reviewer, reviewer_comment, execution_status, execution_result_json, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                request_id,
                timestamp,
                agent_id,
                agent_role,
                tool_name,
                json.dumps(parameters),
                user_prompt or "",
                decision,
                risk_score,
                risk_band,
                json.dumps(matched_policies),
                reason,
                reviewer,
                reviewer_comment,
                execution_status,
                json.dumps(execution_result) if execution_result else None,
                latency_ms
            ))
            conn.commit()
            return cursor.lastrowid

    def update_approval_status(self, request_id: str, decision: str, reviewer: str, reviewer_comment: str, execution_status: str, execution_result: Optional[Dict[str, Any]] = None):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE audit_events
            SET decision = ?,
                reviewer = ?,
                reviewer_comment = ?,
                execution_status = ?,
                execution_result_json = ?
            WHERE request_id = ?
            """, (
                decision,
                reviewer,
                reviewer_comment,
                execution_status,
                json.dumps(execution_result) if execution_result else None,
                request_id
            ))
            conn.commit()

    def get_event_by_id(self, request_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM audit_events WHERE request_id = ?", (request_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_dict(row)

    def query_events(self,
                     decision: Optional[str] = None,
                     risk_band: Optional[str] = None,
                     search: Optional[str] = None,
                     limit: int = 100,
                     offset: int = 0) -> List[Dict[str, Any]]:
        query = "SELECT * FROM audit_events WHERE 1=1"
        params = []

        if decision:
            query += " AND decision = ?"
            params.append(decision)

        if risk_band:
            query += " AND risk_band = ?"
            params.append(risk_band)

        if search:
            query += " AND (tool_name LIKE ? OR agent_id LIKE ? OR user_prompt LIKE ? OR reason LIKE ?)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param, s_param, s_param])

        query += " ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [self._row_to_dict(r) for r in rows]

    def get_stats(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM audit_events")
            total = cursor.fetchone()[0]

            cursor.execute("SELECT decision, COUNT(*) FROM audit_events GROUP BY decision")
            decision_counts = dict(cursor.fetchall())

            cursor.execute("SELECT risk_band, COUNT(*) FROM audit_events GROUP BY risk_band")
            risk_counts = dict(cursor.fetchall())

            cursor.execute("SELECT AVG(latency_ms) FROM audit_events")
            avg_latency = cursor.fetchone()[0] or 0.0

            cursor.execute("SELECT COUNT(*) FROM audit_events WHERE execution_status = 'PENDING_APPROVAL'")
            pending_count = cursor.fetchone()[0]

            return {
                "total_requests": total,
                "allow_count": decision_counts.get("ALLOW", 0),
                "block_count": decision_counts.get("BLOCK", 0),
                "approval_required_count": decision_counts.get("REQUIRE_APPROVAL", 0),
                "approved_count": decision_counts.get("APPROVED", 0),
                "rejected_count": decision_counts.get("REJECTED", 0),
                "pending_approvals": pending_count,
                "risk_distribution": risk_counts,
                "avg_latency_ms": round(avg_latency, 2),
                "block_rate_pct": round((decision_counts.get("BLOCK", 0) / total * 100), 1) if total > 0 else 0.0
            }

    def _row_to_dict(self, row) -> Dict[str, Any]:
        d = dict(row)
        d["parameters"] = json.loads(d["parameters_json"]) if d.get("parameters_json") else {}
        d["matched_policies"] = json.loads(d["matched_policies_json"]) if d.get("matched_policies_json") else []
        d["execution_result"] = json.loads(d["execution_result_json"]) if d.get("execution_result_json") else None
        return d

audit_store = AuditStore()
