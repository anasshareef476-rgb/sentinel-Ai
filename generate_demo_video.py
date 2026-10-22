import os
import wave
import subprocess
import time
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

W, H = 1920, 1080
FPS = 30.0

def get_font(size, bold=False):
    font_path = "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    if not os.path.exists(font_path):
        font_path = "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
    return ImageFont.truetype(font_path, size)

SCENES_CONFIG = [
    {
        "id": "scene_01",
        "num": 1,
        "title": "Introduction & The Agent Safety Problem",
        "wav": "video_audio/scene_01.wav",
        "sub_slides": [
            {
                "img": "video_assets/01_overview.png",
                "start_ratio": 0.0,
                "end_ratio": 1.0,
                "chunks": [
                    ("Welcome to SentinelAI. Autonomous AI agents can execute tools and query enterprise databases with minimal human supervision.", 0.0, 0.40),
                    ("However, prompt injection or excessive permissions can trigger dangerous actions. Simple chatbot warnings are not enough.", 0.40, 0.72),
                    ("SentinelAI introduces an independent, pre-execution safety and policy enforcement gateway.", 0.72, 1.0)
                ]
            }
        ]
    },
    {
        "id": "scene_02",
        "num": 2,
        "title": "System Architecture & Interception Engine",
        "wav": "video_audio/scene_02.wav",
        "sub_slides": [
            {
                "img": "video_assets/10_architecture_team.png",
                "start_ratio": 0.0,
                "end_ratio": 1.0,
                "chunks": [
                    ("Here is our core security principle: the agent does not decide its own permissions.", 0.0, 0.33),
                    ("When an AI agent proposes a tool call, SentinelAI intercepts it in sub-milliseconds before execution begins.", 0.33, 0.68),
                    ("We extract target parameters, verify RBAC role permissions, and evaluate multi-factor risk.", 0.68, 1.0)
                ]
            }
        ]
    },
    {
        "id": "scene_03",
        "num": 3,
        "title": "Arresting Prohibited Attacks in Real Time",
        "wav": "video_audio/scene_03.wav",
        "sub_slides": [
            {
                "img": "video_assets/02_blocked_action.png",
                "start_ratio": 0.0,
                "end_ratio": 1.0,
                "chunks": [
                    ("In this scenario, an agent attempts to read the Linux shadow password file.", 0.0, 0.32),
                    ("SentinelAI's policy engine matches rule POL-001, calculates a risk score of 50 out of 100, and arrests the request with an immediate BLOCK decision.", 0.32, 0.74),
                    ("Zero commands touch the host operating system, and the incident is securely logged.", 0.74, 1.0)
                ]
            }
        ]
    },
    {
        "id": "scene_04",
        "num": 4,
        "title": "Human-in-the-Loop Review for Sensitive Actions",
        "wav": "video_audio/scene_04.wav",
        "sub_slides": [
            {
                "img": "video_assets/03_sensitive_action.png",
                "start_ratio": 0.0,
                "end_ratio": 0.52,
                "chunks": [
                    ("What about sensitive actions that are not strictly malicious, but require executive authorization?", 0.0, 0.32),
                    ("Here, an agent requests a bulk export of 10,000 customer PII records.", 0.32, 0.52)
                ]
            },
            {
                "img": "video_assets/04_approvals_queue.png",
                "start_ratio": 0.52,
                "end_ratio": 1.0,
                "chunks": [
                    ("SentinelAI enforces policy POL-005, pausing execution in a Pending Approval state until an authorized human reviewer signs off.", 0.52, 1.0)
                ]
            }
        ]
    },
    {
        "id": "scene_05",
        "num": 5,
        "title": "SOC Authorization Center & Sandbox Execution",
        "wav": "video_audio/scene_05.wav",
        "sub_slides": [
            {
                "img": "video_assets/05_approval_inspect.png",
                "start_ratio": 0.0,
                "end_ratio": 0.50,
                "chunks": [
                    ("In the Human Review Authorization Center, security operators inspect paused requests in real time over WebSockets.", 0.0, 0.38),
                    ("Operators examine raw parameters, target tables, and prompt context.", 0.38, 0.50)
                ]
            },
            {
                "img": "video_assets/06_approved_executed.png",
                "start_ratio": 0.50,
                "end_ratio": 1.0,
                "chunks": [
                    ("With one click, an authorized reviewer approves the action, which executes safely in an isolated sandbox environment.", 0.50, 1.0)
                ]
            }
        ]
    },
    {
        "id": "scene_06",
        "num": 6,
        "title": "Immutable Forensic Audit Trail & Telemetry",
        "wav": "video_audio/scene_06.wav",
        "sub_slides": [
            {
                "img": "video_assets/07_audit_trail.png",
                "start_ratio": 0.0,
                "end_ratio": 1.0,
                "chunks": [
                    ("Every decision—whether allowed, blocked, or approved—is preserved in an immutable, searchable audit store.", 0.0, 0.40),
                    ("Security teams can filter by decision type, risk band, or keywords, inspect complete JSON telemetry in the forensic drawer, and export compliance audit reports in CSV and JSON formats.", 0.40, 1.0)
                ]
            }
        ]
    },
    {
        "id": "scene_07",
        "num": 7,
        "title": "Dynamic Security Policy Governance",
        "wav": "video_audio/scene_07.wav",
        "sub_slides": [
            {
                "img": "video_assets/08_policy_rules.png",
                "start_ratio": 0.0,
                "end_ratio": 1.0,
                "chunks": [
                    ("Security requirements evolve continuously.", 0.0, 0.18),
                    ("With SentinelAI's Dynamic Policy Manager, security officers can toggle existing rules on the fly, or deploy custom policies with regex tool patterns and resource filters across file system, database, shell execution, and PII categories instantaneously.", 0.18, 1.0)
                ]
            }
        ]
    },
    {
        "id": "scene_08",
        "num": 8,
        "title": "Empirical Benchmark & Latency Evaluation",
        "wav": "video_audio/scene_08.wav",
        "sub_slides": [
            {
                "img": "video_assets/09_benchmark_results.png",
                "start_ratio": 0.0,
                "end_ratio": 1.0,
                "chunks": [
                    ("SentinelAI was empirically tested against a labeled benchmark of 20 real-world scenarios.", 0.0, 0.35),
                    ("The measured results show a 100 percent block detection rate across prohibited attacks, a zero percent false positive rate on benign actions, 100 percent approval success, and a median decision latency of just 0.06 milliseconds.", 0.35, 1.0)
                ]
            }
        ]
    },
    {
        "id": "scene_09",
        "num": 9,
        "title": "Conclusion & Team Codebuggy",
        "wav": "video_audio/scene_09.wav",
        "sub_slides": [
            {
                "img": "video_assets/10_architecture_team.png",
                "start_ratio": 0.0,
                "end_ratio": 1.0,
                "chunks": [
                    ("Developed for DevHost 2026 Problem Statement PS 2.1 by Team Codebuggy from Yenepoya Institute of Technology: Anas Shareef Mohammed, Abdul Rehman Ihab, Shreenidhi, and Mohammed Hamza Hafeel.", 0.0, 0.68),
                    ("SentinelAI: Intercept, Evaluate, Control, and Explain.", 0.68, 1.0)
                ]
            }
        ]
    }
]

def pre_render_base(screenshot_path, scene_title, scene_num):
    canvas = Image.new("RGB", (W, H), (10, 15, 26))
    
    # Load screenshot and paste
    if os.path.exists(screenshot_path):
        img = Image.open(screenshot_path).convert("RGBA")
        target_w = 1920
        target_h = int(img.height * (target_w / img.width))
        if target_h > 840:
            target_h = 840
            target_w = int(img.width * (target_h / img.height))
        img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        offset_x = (W - target_w) // 2
        offset_y = 66
        canvas.paste(img, (offset_x, offset_y), img)
        
    draw = ImageDraw.Draw(canvas, "RGBA")
    
    # 1. Top Header Bar (HUD)
    draw.rectangle([0, 0, W, 58], fill=(13, 20, 36, 245))
    draw.line([0, 58, W, 58], fill=(30, 41, 59, 255), width=1)
    
    # SentinelAI Branding
    draw.ellipse([24, 20, 38, 34], fill=(16, 185, 129, 255))
    f_brand = get_font(20, bold=True)
    draw.text((46, 16), "SENTINEL-AI", fill=(255, 255, 255, 255), font=f_brand)
    f_subbrand = get_font(15, bold=False)
    draw.text((180, 20), "|  Autonomous AI Agent Security Gateway", fill=(148, 163, 184, 255), font=f_subbrand)
    
    # Scene Badge
    f_scene = get_font(15, bold=True)
    scene_str = f"SCENE {scene_num:02d}/09: {scene_title.upper()}"
    bbox = f_scene.getbbox(scene_str)
    sw = bbox[2] - bbox[0]
    draw.rounded_rectangle([W - sw - 44, 12, W - 20, 46], radius=6, fill=(30, 41, 59, 210), outline=(59, 130, 246, 255), width=1)
    draw.text((W - sw - 32, 17), scene_str, fill=(56, 189, 248, 255), font=f_scene)
    
    return canvas

def render_caption_and_progress(base_canvas, chunk_text, current_time_s, total_time_s):
    canvas = base_canvas.copy()
    draw = ImageDraw.Draw(canvas, "RGBA")
    
    # 2. Lower-Third Caption Glass Card
    card_h = 125
    card_y = H - card_h - 14
    card_margin = 80
    card_w = W - (card_margin * 2)
    
    draw.rounded_rectangle([card_margin, card_y, card_margin + card_w, card_y + card_h], radius=12, fill=(10, 15, 29, 240), outline=(14, 165, 233, 190), width=2)
    
    # Speaker Tag Pill
    f_tag = get_font(13, bold=True)
    tag_text = "AI NARRATOR"
    tag_box = f_tag.getbbox(tag_text)
    tag_w = tag_box[2] - tag_box[0]
    draw.rounded_rectangle([card_margin + 24, card_y + 12, card_margin + 24 + tag_w + 18, card_y + 34], radius=4, fill=(3, 105, 161, 230))
    draw.text((card_margin + 33, card_y + 15), tag_text, fill=(240, 249, 255, 255), font=f_tag)
    
    f_tech = get_font(13, bold=False)
    draw.text((card_margin + 24 + tag_w + 30, card_y + 16), "•  Voice Synthesis & Real-Time Captions", fill=(100, 116, 139, 255), font=f_tech)
    
    # Time Stamp Badge inside card (right)
    cur_m, cur_s = divmod(int(current_time_s), 60)
    tot_m, tot_s = divmod(int(total_time_s), 60)
    time_str = f"{cur_m:02d}:{cur_s:02d} / {tot_m:02d}:{tot_s:02d}"
    f_time = get_font(14, bold=True)
    t_box = f_time.getbbox(time_str)
    tw = t_box[2] - t_box[0]
    draw.text((card_margin + card_w - tw - 24, card_y + 15), time_str, fill=(148, 163, 184, 255), font=f_time)
    
    # Subtitle Text with auto word-wrap
    f_captions = get_font(22, bold=True)
    words = chunk_text.split()
    lines = []
    curr_line = ""
    for w in words:
        test = (curr_line + " " + w).strip()
        bbox = f_captions.getbbox(test)
        if (bbox[2] - bbox[0]) < (card_w - 60):
            curr_line = test
        else:
            lines.append(curr_line)
            curr_line = w
    if curr_line:
        lines.append(curr_line)
    
    line_y = card_y + 44
    for line in lines[:2]:
        draw.text((card_margin + 26, line_y), line, fill=(248, 250, 252, 255), font=f_captions)
        line_y += 32
        
    # 3. Dynamic Progress Bar at bottom
    bar_y = H - 6
    draw.rectangle([0, bar_y, W, H], fill=(15, 23, 42, 255))
    progress = min(1.0, max(0.0, current_time_s / total_time_s))
    progress_w = int(W * progress)
    if progress_w > 0:
        draw.rectangle([0, bar_y, progress_w, H], fill=(6, 182, 212, 255))
    
    # Convert PIL Image to BGR OpenCV numpy array
    rgb = np.array(canvas)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    return bgr

def main():
    print("=== Step 1: Concatenating Narration Audio Tracks ===")
    master_audio_path = "video_audio/master_narration.wav"
    total_audio_frames = 0
    sample_rate = 22050
    channels = 1
    sampwidth = 2
    
    # Read duration for each scene
    scene_durations = []
    wav_files = []
    for sc in SCENES_CONFIG:
        wav_path = sc["wav"]
        wav_files.append(wav_path)
        with wave.open(wav_path, "rb") as w:
            dur = w.getnframes() / float(w.getframerate())
            scene_durations.append(dur)
            sample_rate = w.getframerate()
            channels = w.getnchannels()
            sampwidth = w.getsampwidth()
    
    total_duration_s = sum(scene_durations)
    print(f"Total Duration: {total_duration_s:.2f}s ({total_duration_s/60:.2f} minutes)")
    
    with wave.open(master_audio_path, "wb") as outfile:
        outfile.setnchannels(channels)
        outfile.setsampwidth(sampwidth)
        outfile.setframerate(sample_rate)
        for wav_path in wav_files:
            with wave.open(wav_path, "rb") as infile:
                outfile.writeframes(infile.readframes(infile.getnframes()))
    print(f"Combined audio written to: {master_audio_path}")
    
    print("\n=== Step 2: Pre-rendering Base Slides & Pre-computing Timeline ===")
    t_start = time.time()
    
    # Pre-render base frames
    base_slides = {}
    for sc in SCENES_CONFIG:
        for idx, sub in enumerate(sc["sub_slides"]):
            key = (sc["num"], idx)
            base_slides[key] = pre_render_base(sub["img"], sc["title"], sc["num"])
            
    # Timeline generation
    total_frames = int(total_duration_s * FPS)
    temp_video_path = "video_audio/temp_video_stream.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_video_path, fourcc, FPS, (W, H))
    
    print(f"Writing {total_frames} frames at {FPS} FPS...")
    
    frame_idx = 0
    current_time_s = 0.0
    scene_start_time = 0.0
    
    for sc_idx, sc in enumerate(SCENES_CONFIG):
        sc_dur = scene_durations[sc_idx]
        sc_num = sc["num"]
        
        # Frames for this scene
        sc_frames = int(sc_dur * FPS)
        
        for sf in range(sc_frames):
            frame_time = scene_start_time + (sf / FPS)
            ratio_in_scene = sf / float(sc_frames)
            
            # Find which sub_slide
            active_sub = sc["sub_slides"][0]
            active_sub_idx = 0
            for idx, sub in enumerate(sc["sub_slides"]):
                if sub["start_ratio"] <= ratio_in_scene <= sub["end_ratio"]:
                    active_sub = sub
                    active_sub_idx = idx
                    break
                    
            # Find active chunk
            active_chunk_text = active_sub["chunks"][0][0]
            for (text, c_start, c_end) in active_sub["chunks"]:
                if c_start <= ratio_in_scene <= c_end:
                    active_chunk_text = text
                    break
                    
            base_canvas = base_slides[(sc_num, active_sub_idx)]
            bgr_frame = render_caption_and_progress(base_canvas, active_chunk_text, frame_time, total_duration_s)
            out.write(bgr_frame)
            frame_idx += 1
            
            if frame_idx % 300 == 0 or frame_idx == total_frames:
                pct = (frame_idx / total_frames) * 100
                elapsed = time.time() - t_start
                fps_render = frame_idx / max(1e-5, elapsed)
                print(f"Rendered {frame_idx}/{total_frames} frames ({pct:.1f}%) | {fps_render:.1f} fps")
                
        scene_start_time += sc_dur
        
    out.release()
    print(f"Video stream written to {temp_video_path} in {time.time() - t_start:.1f}s")
    
    print("\n=== Step 3: Muxing High-Definition MP4 with AAC Audio via FFmpeg ===")
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    final_output_path = "sentinel_ai_mvp_demo.mp4"
    if os.path.exists(final_output_path):
        os.remove(final_output_path)
        
    cmd = [
        ffmpeg_exe, "-y",
        "-i", temp_video_path,
        "-i", master_audio_path,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "19",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        final_output_path
    ]
    
    print(f"Executing: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
    
    if os.path.exists(temp_video_path):
        os.remove(temp_video_path)
        
    final_size_mb = os.path.getsize(final_output_path) / (1024 * 1024)
    print(f"\nSUCCESS! Demo video created: {final_output_path} ({final_size_mb:.2f} MB, Duration: {total_duration_s:.1f}s)")

if __name__ == "__main__":
    main()
