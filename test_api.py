import urllib.request
import json

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read().decode())

def run_tests():
    print("--- Running SentinelAI End-to-End Pipeline Verification ---")
    
    # 1. Prohibited (Shadow file)
    r1 = post('http://127.0.0.1:8000/api/intercept', {
        'agent_id': 'agent-test-01',
        'agent_role': 'assistant',
        'tool_name': 'read_file',
        'parameters': {'path': '/etc/shadow'},
        'user_prompt': 'Read passwords'
    })
    print(f"1. Shadow File: Decision={r1['decision']} | Risk={r1['risk']['score']}/100 | Band={r1['risk']['band']}")
    assert r1['decision'] == 'BLOCK'

    # 2. Safe (FAQ Read)
    r2 = post('http://127.0.0.1:8000/api/intercept', {
        'agent_id': 'agent-test-02',
        'agent_role': 'support_rep',
        'tool_name': 'read_file',
        'parameters': {'path': '/public/company_faq.md'},
        'user_prompt': 'Read operating hours'
    })
    print(f"2. Safe FAQ Read: Decision={r2['decision']} | Sandbox Success={r2['execution_result']['success']}")
    assert r2['decision'] == 'ALLOW'

    # 3. Sensitive (Bulk Export)
    r3 = post('http://127.0.0.1:8000/api/intercept', {
        'agent_id': 'agent-test-03',
        'agent_role': 'data_analyst',
        'tool_name': 'export_records',
        'parameters': {'table': 'customers', 'count': 5000},
        'user_prompt': 'Export customer PII'
    })
    req_id = r3['request_id']
    print(f"3. Bulk Export: Decision={r3['decision']} | Status={r3['execution_status']} | ReqID={req_id}")
    assert r3['decision'] == 'REQUIRE_APPROVAL'

    # 4. Human-in-the-Loop Approval Decision
    r4 = post(f'http://127.0.0.1:8000/api/approvals/{req_id}/decision', {
        'decision': 'APPROVE',
        'reviewer': 'SecOps Lead',
        'comment': 'Authorized for compliance audit'
    })
    print(f"4. Human Review: Decision={r4['decision']} | Status={r4['execution_status']} | Reviewer={r4['reviewer']}")
    assert r4['decision'] == 'APPROVED'
    assert r4['execution_status'] == 'EXECUTED'

    print("\nAll 4 End-to-End Pipeline Assertions PASSED successfully!")

if __name__ == "__main__":
    run_tests()
