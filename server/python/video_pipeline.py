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
        'format': 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best',
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
    - Encodes pristine MP4 with faststart (no watermarks)
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    sub_arg = escape_ffmpeg_path(ass_subtitle_path) if ass_subtitle_path and os.path.exists(ass_subtitle_path) else None

    # Construct video filter chain based on aspect ratio & framing mode
    if aspect_ratio == '9:16':
        # 1080x1920 vertical format
        if framing == 'crop':
            # Smart center crop
            vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(in_w-1080)/2:(in_h-1920)/2"
            if sub_arg:
                vf += f",ass='{sub_arg}'"
            filter_args = ["-vf", vf]
        else:
            # Cinematic Blurred Background (Default & Best for Podcasts/Interviews)
            if sub_arg:
                fc = (
                    f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg];"
                    f"[0:v]scale=1080:-2:force_original_aspect_ratio=decrease[fg];"
                    f"[bg][fg]overlay=(W-w)/2:(H-h)/2[base];"
                    f"[base]ass='{sub_arg}'[outv]"
                )
            else:
                fc = (
                    f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg];"
                    f"[0:v]scale=1080:-2:force_original_aspect_ratio=decrease[fg];"
                    f"[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]"
                )
            filter_args = ["-filter_complex", fc, "-map", "[outv]", "-map", "0:a?"]

    elif aspect_ratio == '1:1':
        # 1080x1080 square format
        vf = "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080:(in_w-1080)/2:(in_h-1080)/2"
        if sub_arg:
            vf += f",ass='{sub_arg}'"
        filter_args = ["-vf", vf]

    else:
        # 16:9 standard landscape format
        vf = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"
        if sub_arg:
            vf += f",ass='{sub_arg}'"
        filter_args = ["-vf", vf]

    cmd = [
        "ffmpeg", "-y",
        "-i", raw_video_path
    ] + filter_args + [
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        output_path
    ]

    print(f"[FFmpeg Command] {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if result.returncode != 0:
        print(f"[FFmpeg Warning] Ass filter execution had issues: {result.stderr[-400:]}")
        # If ASS filter had an error (e.g. fontconfig/libass path issue), attempt fallback without subtitle burn
        # or with basic scale so the user still gets their pristine cropped video!
        if sub_arg and "ass" in result.stderr:
            print("[FFmpeg Fallback] Retrying render without ASS filter...")
            fallback_cmd = [
                "ffmpeg", "-y",
                "-i", raw_video_path,
                "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "22",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                output_path
            ]
            fb_res = subprocess.run(fallback_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if fb_res.returncode != 0:
                raise RuntimeError(f"FFmpeg fallback failed: {fb_res.stderr[-300:]}")
        else:
            raise RuntimeError(f"FFmpeg failed with code {result.returncode}: {result.stderr[-300:]}")

    return output_path
