import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False):
    font_path = "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    if not os.path.exists(font_path):
        font_path = "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
    return ImageFont.truetype(font_path, size)

def render_frame(screenshot_path, scene_title, scene_num, chunk_text, current_time_s, total_time_s=197.8):
    W, H = 1920, 1080
    canvas = Image.new("RGB", (W, H), (10, 15, 26))
    
    # Load screenshot and paste
    if os.path.exists(screenshot_path):
        img = Image.open(screenshot_path).convert("RGBA")
        # Scale to fit nicely with top margin and bottom margin for HUD
        target_w = 1920
        target_h = int(img.height * (target_w / img.width))
        if target_h > 880:
            target_h = 880
            target_w = int(img.width * (target_h / img.height))
        img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        offset_x = (W - target_w) // 2
        offset_y = 65  # below top header
        canvas.paste(img, (offset_x, offset_y), img)
    
    draw = ImageDraw.Draw(canvas, "RGBA")
    
    # 1. Top Header Bar (HUD)
    draw.rectangle([0, 0, W, 58], fill=(13, 20, 36, 240))
    draw.line([0, 58, W, 58], fill=(30, 41, 59, 255), width=1)
    
    # SentinelAI Branding
    draw.ellipse([24, 20, 38, 34], fill=(16, 185, 129, 255)) # Green status dot
    f_brand = get_font(20, bold=True)
    draw.text((46, 16), "SENTINEL-AI", fill=(255, 255, 255, 255), font=f_brand)
    f_subbrand = get_font(15, bold=False)
    draw.text((180, 20), "|  Autonomous AI Agent Security Gateway", fill=(148, 163, 184, 255), font=f_subbrand)
    
    # Scene Badge (Right Top)
    f_scene = get_font(16, bold=True)
    scene_str = f"SCENE {scene_num:02d}/09: {scene_title.upper()}"
    bbox = f_scene.getbbox(scene_str)
    sw = bbox[2] - bbox[0]
    draw.rounded_rectangle([W - sw - 44, 12, W - 20, 46], radius=6, fill=(30, 41, 59, 200), outline=(59, 130, 246, 255), width=1)
    draw.text((W - sw - 32, 17), scene_str, fill=(56, 189, 248, 255), font=f_scene)
    
    # 2. Lower-Third Caption Glass Card
    card_h = 135
    card_y = H - card_h - 22
    card_margin = 80
    card_w = W - (card_margin * 2)
    
    # Glass background with gradient border
    draw.rounded_rectangle([card_margin, card_y, card_margin + card_w, card_y + card_h], radius=14, fill=(10, 15, 29, 235), outline=(14, 165, 233, 180), width=2)
    
    # Speaker Tag Pill
    f_tag = get_font(13, bold=True)
    tag_text = "AI NARRATOR"
    tag_box = f_tag.getbbox(tag_text)
    tag_w = tag_box[2] - tag_box[0]
    draw.rounded_rectangle([card_margin + 24, card_y + 14, card_margin + 24 + tag_w + 18, card_y + 36], radius=4, fill=(3, 105, 161, 220))
    draw.text((card_margin + 33, card_y + 17), tag_text, fill=(240, 249, 255, 255), font=f_tag)
    
    # Audio Waveform Icon representation
    f_tech = get_font(13, bold=False)
    draw.text((card_margin + 24 + tag_w + 30, card_y + 18), "•  Voice Synthesis & Subtitles", fill=(100, 116, 139, 255), font=f_tech)
    
    # Subtitle Text with auto word-wrap
    f_captions = get_font(23, bold=True)
    
    # Wrap text
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
    
    line_y = card_y + 48
    for line in lines[:2]:  # max 2 lines
        draw.text((card_margin + 26, line_y), line, fill=(248, 250, 252, 255), font=f_captions)
        line_y += 34
        
    # 3. Dynamic Progress Bar at bottom
    bar_y = H - 8
    draw.rectangle([0, bar_y, W, H], fill=(15, 23, 42, 255))
    progress = min(1.0, max(0.0, current_time_s / total_time_s))
    progress_w = int(W * progress)
    if progress_w > 0:
        draw.rectangle([0, bar_y, progress_w, H], fill=(6, 182, 212, 255))
    
    return canvas

if __name__ == "__main__":
    frame = render_frame(
        "video_assets/02_blocked_action.png",
        "Arresting Prohibited Attacks in Real Time",
        3,
        "SentinelAI's policy engine matches rule POL-001, calculates a risk score of 50 out of 100, and arrests the request with an immediate BLOCK decision.",
        48.5,
        197.8
    )
    frame.save("video_assets/test_rendered_frame.png")
    print("Test frame rendered successfully to video_assets/test_rendered_frame.png")
