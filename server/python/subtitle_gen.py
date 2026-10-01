import os
import re
from typing import List, Dict, Any, Optional


COLOR_MAP = {
    # ASS uses &HAABBGGRR& (Alpha, Blue, Green, Red)
    'yellow': '&H0000FFFF&',    # Bright Yellow #FFFF00
    'green': '&H0033FF66&',     # Neon / Electric Green #66FF33
    'cyan': '&H00FFFF00&',      # Vibrant Cyan #00FFFF
    'pink': '&H009900FF&',      # Hot Pink #FF0099
    'orange': '&H000088FF&',    # Vibrant Orange #FF8800
    'white': '&H00FFFFFF&',
}


def format_ass_time(seconds: float) -> str:
    """
    Formats seconds into ASS timecode: H:MM:SS.cs (centiseconds)
    Example: 0:01:23.45
    """
    seconds = max(0.0, seconds)
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int(round((seconds - int(seconds)) * 100))
    if centis >= 100:
        secs += 1
        centis -= 100
    return f"{hrs}:{mins:02d}:{secs:02d}.{centis:02d}"


def generate_ass_subtitles(
    transcript_slice: List[Dict[str, Any]],
    clip_start: float,
    clip_end: float,
    output_path: str,
    aspect_ratio: str = '9:16',
    highlight_color: str = 'yellow',
    font_size: int = 70,
    font_name: str = "DejaVu Sans"
) -> str:
    """
    Generates dynamic word-by-word highlighted ASS subtitle file (TikTok / Hormozi style).
    """
    # ASS style lines are comma-separated: a font list with commas shifts every field
    font_name = (font_name.split(',')[0].strip() or 'DejaVu Sans')
    # Video dimensions configuration
    if aspect_ratio == '9:16':
        res_x = 1080
        res_y = 1920
        margin_v = 360      # Centered towards lower third
        actual_font_size = font_size or 72
    elif aspect_ratio == '1:1':
        res_x = 1080
        res_y = 1080
        margin_v = 180
        actual_font_size = font_size or 60
    else:  # 16:9
        res_x = 1920
        res_y = 1080
        margin_v = 140
        actual_font_size = font_size or 54

    active_bgr = COLOR_MAP.get(highlight_color.lower(), COLOR_MAP['yellow'])
    inactive_bgr = '&H00FFFFFF&'  # Bold Crisp White

    # ASS Header
    ass_lines = [
        "[Script Info]",
        "ScriptType: v4.00+",
        f"PlayResX: {res_x}",
        f"PlayResY: {res_y}",
        "ScaledBorderAndShadow: yes",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: HormoziBold,{font_name},{actual_font_size},{inactive_bgr},&H000000FF&,&H00000000&,&H80000000&,1,0,0,0,100,100,2,0,1,5,3,2,60,60,{margin_v},1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
    ]

    # Process transcript segments into word-level highlighted dialogue events
    clip_dur = clip_end - clip_start

    for segment in transcript_slice:
        # Offset start and end to clip timeline
        seg_start = max(0.0, segment['start'] - clip_start)
        seg_end = min(clip_dur, segment['end'] - clip_start)
        if seg_start >= seg_end or seg_start >= clip_dur:
            continue

        raw_text = segment.get('text', '').strip().upper()
        # Clean text
        raw_text = re.sub(r'[\r\n]+', ' ', raw_text)
        raw_text = re.sub(r'[^\w\s\?\!\,\.\'\-]', '', raw_text)
        words = raw_text.split()
        if not words:
            continue

        # Group words into short phrases (2 to 4 words max for high impact)
        chunk_size = 3
        if len(words) <= 4:
            word_chunks = [words]
        else:
            word_chunks = [words[i:i + chunk_size] for i in range(0, len(words), chunk_size)]

        total_words = len(words)
        seg_duration = max(0.4, seg_end - seg_start)
        time_per_word = seg_duration / total_words

        word_idx = 0
        current_time = seg_start

        for chunk in word_chunks:
            chunk_word_count = len(chunk)
            chunk_start = current_time
            chunk_end = min(clip_dur, chunk_start + (chunk_word_count * time_per_word))

            # Generate individual events for each word being highlighted in the active chunk
            for local_idx, active_word in enumerate(chunk):
                w_start = chunk_start + (local_idx * time_per_word)
                w_end = min(chunk_end, w_start + time_per_word)
                if w_start >= w_end:
                    continue

                # Build styled line: all words white except the current one highlighted
                styled_words = []
                for idx, w in enumerate(chunk):
                    if idx == local_idx:
                        # Highlighted active word
                        styled_words.append(f"{{\\c{active_bgr}\\fscx108\\fscy108}}{w}{{\\c{inactive_bgr}\\fscx100\\fscy100}}")
                    else:
                        # Normal word
                        styled_words.append(w)

                dialogue_text = " ".join(styled_words)
                start_code = format_ass_time(w_start)
                end_code = format_ass_time(w_end)

                ass_lines.append(
                    f"Dialogue: 0,{start_code},{end_code},HormoziBold,,0,0,0,,{dialogue_text}"
                )

            current_time = chunk_end
            word_idx += chunk_word_count

    # Write ASS file
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(ass_lines) + "\n")

    return output_path
