import os
import sys
import subprocess
import tempfile
import shutil
from typing import Dict, Any, Optional

try:
    import yt_dlp
except ImportError:
    yt_dlp = None

from ytdlp_opts import apply_cookies

# ---- Resource settings (tuned for small servers, e.g. Render 512 MB) ----------
# CLIP_BASE_WIDTH : output width of the clip. 720 -> 720x1280 (9:16). Use 1080 on bigger plans.
# CLIP_SOURCE_HEIGHT : max height of the downloaded source video (default = CLIP_BASE_WIDTH).
# CLIP_X264_PRESET : ffmpeg x264 preset (veryfast uses far less CPU/RAM than fast/medium).
# CLIP_FFMPEG_THREADS : encoder threads (fewer = less RAM).
BASE_WIDTH = int(os.environ.get('CLIP_BASE_WIDTH', '720'))
SOURCE_HEIGHT = int(os.environ.get('CLIP_SOURCE_HEIGHT', str(BASE_WIDTH)))
X264_PRESET = os.environ.get('CLIP_X264_PRESET', 'veryfast')
FFMPEG_THREADS = os.environ.get('CLIP_FFMPEG_THREADS', '2')


def output_size(aspect_ratio: str):
    """Returns (width, height) for the chosen aspect ratio (always even numbers)."""
    b = BASE_WIDTH - (BASE_WIDTH % 2)
    if aspect_ratio == '9:16':
        return b, (b * 16 // 9) // 2 * 2
    if aspect_ratio == '1:1':
        return b, b
    return (b * 16 // 9) // 2 * 2, b  # 16:9

def escape_ffmpeg_path(path: str) -> str:
    """
    Escapes paths for FFmpeg filter arguments (especially on Windows).
    Replaces backslashes with forward slashes and escapes colons.
    """
    normalized = path.replace('\\', '/')
    escaped = normalized.replace(':', '\\:')
    return escaped


def download_segment(
    video_url: str,
    start_time: float,
    end_time: float,
    output_path: str
) -> str:
    """
    Downloads a targeted slice of a YouTube video using yt-dlp.
    """
    if not yt_dlp:
        raise RuntimeError("yt-dlp is not installed in the python environment.")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    temp_download_template = os.path.splitext(output_path)[0] + "_raw.%(ext)s"

    ydl_opts = {
        'format': (
            f'bestvideo[ext=mp4][height<={SOURCE_HEIGHT}]+bestaudio[ext=m4a]/'
            f'best[ext=mp4][height<={SOURCE_HEIGHT}]/best[height<={SOURCE_HEIGHT}]/best'
        ),
        'outtmpl': temp_download_template,
        'download_ranges': yt_dlp.utils.download_range_func(None, [(start_time, end_time)]),
        'force_keyframes_at_cuts': True,
        'quiet': False,
        'no_warnings': True
    }

    with yt_dlp.YoutubeDL(apply_cookies(ydl_opts)) as ydl:
        ydl.download([video_url])

    # Find the downloaded file
    base_dir = os.path.dirname(output_path)
    base_name = os.path.splitext(os.path.basename(temp_download_template))[0]
    
    for f in os.listdir(base_dir):
        if f.startswith(base_name.replace('.%(ext)s', '')) and not f.endswith('.ass'):
            return os.path.join(base_dir, f)

    # Fallback search
    matched = [
        os.path.join(base_dir, f)
        for f in os.listdir(base_dir)
        if f.endswith(('.mp4', '.mkv', '.webm')) and '_raw' in f
    ]
    if matched:
        return matched[0]

    raise FileNotFoundError("yt-dlp failed to download the requested video segment.")


def render_clip(
    raw_video_path: str,
    ass_subtitle_path: Optional[str],
    output_path: str,
    aspect_ratio: str = '9:16',
    framing: str = 'blur'
) -> str:
    """
    Processes the raw video slice through FFmpeg:
    - Crops or applies blurred background letterboxing to 9:16 / 16:9 / 1:1
    - Burns dynamic ASS word-by-word subtitles
    - Encodes MP4 with faststart (no watermarks)
    Tuned to be light on RAM/CPU (see settings at the top of this file).
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    sub_arg = escape_ffmpeg_path(ass_subtitle_path) if ass_subtitle_path and os.path.exists(ass_subtitle_path) else None
    W, H = output_size(aspect_ratio)

    def build_filter_args(with_subs: bool):
        sub = f",ass='{sub_arg}'" if (with_subs and sub_arg) else ""
        if aspect_ratio == '9:16' and framing != 'crop':
            # Blurred background: blur a tiny copy and scale it up (much cheaper than blurring full-res)
            bw, bh = max(W // 4, 2) // 2 * 2, max(H // 4, 2) // 2 * 2
            fc = (
                f"[0:v]scale={bw}:{bh}:force_original_aspect_ratio=increase,crop={bw}:{bh},boxblur=6:2,scale={W}:{H}[bg];"
                f"[0:v]scale={W}:-2:force_original_aspect_ratio=decrease[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2[base];"
                + (f"[base]ass='{sub_arg}'[outv]" if (with_subs and sub_arg) else "[base]null[outv]")
            )
            return ["-filter_complex", fc, "-map", "[outv]", "-map", "0:a?"]
        if aspect_ratio == '16:9':
            vf = f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2" + sub
        else:
            vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}:(in_w-{W})/2:(in_h-{H})/2" + sub
        return ["-vf", vf]

    def build_cmd(with_subs: bool):
        return [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", raw_video_path,
        ] + build_filter_args(with_subs) + [
            "-threads", FFMPEG_THREADS, "-filter_complex_threads", "1",
            "-c:v", "libx264",
            "-preset", X264_PRESET,
            "-crf", "23",
            "-x264-params", "rc-lookahead=10:ref=2",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            output_path,
        ]

    cmd = build_cmd(True)
    print(f"[FFmpeg Command] {' '.join(cmd)}", flush=True)
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if result.returncode != 0:
        err = (result.stderr or '').strip()
        print(f"[FFmpeg Error] {err[-600:]}", flush=True)
        # If the subtitle (ASS) filter failed (fontconfig/libass issue), retry without burning subtitles
        if sub_arg:
            print("[FFmpeg Fallback] Retrying render without subtitles...", flush=True)
            fb = subprocess.run(build_cmd(False), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if fb.returncode != 0:
                raise RuntimeError(f"FFmpeg fallback failed: {(fb.stderr or '').strip()[-400:]}")
        else:
            raise RuntimeError(f"FFmpeg failed with code {result.returncode}: {err[-400:]}")

    return output_path
