import subprocess
import os
import wave

SCENES = [
    {
        "id": "scene_01",
        "title": "Introduction & The Agent Safety Problem",
        "script": "Welcome to SentinelAI. Autonomous AI agents can execute tools and query enterprise databases with minimal human supervision. However, prompt injection or excessive permissions can trigger dangerous actions. Simple chatbot warnings are not enough. SentinelAI introduces an independent, pre-execution safety and policy enforcement gateway."
    },
    {
        "id": "scene_02",
        "title": "System Architecture & Action Interception",
        "script": "Here is our core security principle: the agent does not decide its own permissions. When an AI agent proposes a tool call, SentinelAI intercepts it in sub-milliseconds before execution begins. We extract target parameters, verify RBAC role permissions, and evaluate multi-factor risk."
    },
    {
        "id": "scene_03",
        "title": "Arresting Prohibited Attacks in Real Time",
        "script": "In this scenario, an agent attempts to read the Linux shadow password file. SentinelAI's policy engine matches rule POL-001, calculates a risk score of 50 out of 100, and arrests the request with an immediate BLOCK decision. Zero commands touch the host operating system, and the incident is securely logged."
    },
    {
        "id": "scene_04",
        "title": "Human-in-the-Loop Review for Sensitive Actions",
        "script": "What about sensitive actions that are not strictly malicious, but require executive authorization? Here, an agent requests a bulk export of 10,000 customer PII records. SentinelAI enforces policy POL-005, pausing execution in a Pending Approval state until an authorized human reviewer signs off."
    },
    {
        "id": "scene_05",
        "title": "SOC Authorization Center & Sandbox Execution",
        "script": "In the Human Review Authorization Center, security operators inspect paused requests in real time over WebSockets. Operators examine raw parameters, target tables, and prompt context. With one click, an authorized reviewer approves the action, which executes safely in an isolated sandbox environment."
    },
    {
        "id": "scene_06",
        "title": "Immutable Forensic Audit Trail & Telemetry",
        "script": "Every decision—whether allowed, blocked, or approved—is preserved in an immutable, searchable audit store. Security teams can filter by decision type, risk band, or keywords, inspect complete JSON telemetry in the forensic drawer, and export compliance audit reports in CSV and JSON formats."
    },
    {
        "id": "scene_07",
        "title": "Dynamic Security Policy Governance",
        "script": "Security requirements evolve continuously. With SentinelAI's Dynamic Policy Manager, security officers can toggle existing rules on the fly, or deploy custom policies with regex tool patterns and resource filters across file system, database, shell execution, and PII categories instantaneously."
    },
    {
        "id": "scene_08",
        "title": "Measured Empirical Benchmark Evaluation",
        "script": "SentinelAI was empirically tested against a labeled benchmark of 20 real-world scenarios. The measured results show a 100 percent block detection rate across prohibited attacks, a zero percent false positive rate on benign actions, 100 percent approval success, and a median decision latency of just 0.06 milliseconds."
    },
    {
        "id": "scene_09",
        "title": "Conclusion & Team Codebuggy",
        "script": "Developed for DevHost 2026 Problem Statement PS 2.1 by Team Codebuggy from Yenepoya Institute of Technology: Anas Shareef Mohammed, Abdul Rehman Ihab, Shreenidhi, and Mohammed Hamza Hafeel. SentinelAI: Intercept, Evaluate, Control, and Explain."
    }
]

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "video_audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

print("--- Generating AI Narration Audio Files via Windows Speech API ---")

total_duration = 0.0

for idx, scene in enumerate(SCENES, 1):
    wav_path = os.path.join(AUDIO_DIR, f"{scene['id']}.wav")
    clean_wav_path = wav_path.replace("\\", "/")
    escaped_text = scene["script"].replace('"', '`"')
    
    ps_cmd = f"""
Add-Type -AssemblyName System.Speech
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.Rate = 0
$speaker.Volume = 100
$speaker.SetOutputToWaveFile("{clean_wav_path}")
$speaker.Speak("{escaped_text}")
$speaker.Dispose()
"""
    subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-Command", ps_cmd], check=True)
    
    # Read duration
    with wave.open(wav_path, "rb") as w:
        frames = w.getnframes()
        rate = w.getframerate()
        duration = frames / float(rate)
        total_duration += duration
        print(f"[{idx}/9] {scene['id']}: {duration:.2f}s | {scene['title']}")

print(f"\nAll 9 Narration Audio Clips Generated! Total Duration: {total_duration:.1f}s ({total_duration/60:.2f} mins)")
