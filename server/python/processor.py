import os
import sys
import json
import argparse
import tempfile
import traceback
import shutil

from transcript import get_transcript, extract_video_id
from highlight import detect_highlights
from subtitle_gen import generate_ass_subtitles
from video_pipeline import download_segment, render_clip

try:
    import yt_dlp
except ImportError:
    yt_dlp = None


def send_event(data: dict):
    """Prints a structured JSON event to stdout for Node.js to consume in real time."""
    print(f"__EVENT__{json.dumps(data)}", flush=True)


def get_video_info(url: str) -> dict:
    """Fetches high level video metadata via yt-dlp."""
    if not yt_dlp:
        return {'title': 'YouTube Video', 'duration': 300.0}

    ydl_opts = {
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
        'cookiefile': '/etc/secrets/cookies.txt',
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            'title': info.get('title', 'YouTube Video'),
            'duration': float(info.get('duration', 300.0)),
            'thumbnail': info.get('thumbnail', ''),
            'channel': info.get('uploader', ''),
            'views': info.get('view_count', 0),
        }


def main():
    parser = argparse.ArgumentParser(description="YT-Clipper Video Processing Engine")
    parser.add_argument("--job_id", required=True, help="Unique job ID")
    parser.add_argument("--url", required=True, help="YouTube Video URL")
    parser.add_argument("--num_clips", type=int, default=3, help="Number of clips to generate")
    parser.add_argument("--duration", type=float, default=45.0, help="Target duration per clip in seconds")
    parser.add_argument("--prompt", default="", help="Custom prompt or topic criteria")
    parser.add_argument("--aspect_ratio", default="9:16", choices=["9:16", "16:9", "1:1"], help="Target aspect ratio")
    parser.add_argument("--framing", default="blur", choices=["blur", "crop"], help="Framing mode")
    parser.add_argument("--highlight_color", default="yellow", help="Active word highlight color")
    parser.add_argument("--font_size", type=int, default=70, help="Font size for subtitles")
    parser.add_argument("--output_dir", required=True, help="Output directory for generated clips")

    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    temp_dir = tempfile.mkdtemp(prefix=f"clip_job_{args.job_id}_")

    try:
        send_event({
            "type": "progress",
            "progress": 10,
            "step": "Analyzing Video Metadata",
            "message": "Connecting to YouTube and reading video details..."
        })

        video_info = get_video_info(args.url)
        video_duration = video_info.get('duration', 300.0)

        send_event({
            "type": "progress",
            "progress": 25,
            "step": "Fetching Transcript",
            "message": "Extracting timestamped subtitles with fallback system..."
        })

        transcript = get_transcript(args.url, video_duration=video_duration)

        send_event({
            "type": "progress",
            "progress": 40,
            "step": "Detecting Viral Highlights",
            "message": f"Analyzing speech energy, hooks, and topic alignment for {args.num_clips} clips..."
        })

        clips_plan = detect_highlights(
            transcript=transcript,
            total_duration=video_duration,
            num_clips=args.num_clips,
            target_duration=args.duration,
            prompt=args.prompt if args.prompt.strip() else None
        )

        completed_clips = []
        total_clips = len(clips_plan)

        for i, clip in enumerate(clips_plan):
            clip_num = i + 1
            start_pct = 40 + int((i / max(total_clips, 1)) * 55)
            send_event({
                "type": "progress",
                "progress": start_pct,
                "step": f"Processing Clip {clip_num} of {total_clips}",
                "message": f"Cutting '{clip['title']}' ({clip['duration']}s) and generating word subtitles..."
            })

            clip_filename = f"clip_{args.job_id}_{clip_num}.mp4"
            final_clip_path = os.path.join(args.output_dir, clip_filename)
            raw_clip_path = os.path.join(temp_dir, f"raw_{clip_num}.mp4")
            ass_path = os.path.join(temp_dir, f"subs_{clip_num}.ass")

            # 1. Download specific video segment
            download_segment(
                video_url=args.url,
                start_time=clip['start'],
                end_time=clip['end'],
                output_path=raw_clip_path
            )

            # 2. Generate dynamic word-by-word ASS subtitles
            generate_ass_subtitles(
                transcript_slice=clip.get('transcript', []),
                clip_start=clip['start'],
                clip_end=clip['end'],
                output_path=ass_path,
                aspect_ratio=args.aspect_ratio,
                highlight_color=args.highlight_color,
                font_size=args.font_size
            )

            # 3. Render video through FFmpeg (crop/blur + subtitles burn)
            render_clip(
                raw_video_path=raw_clip_path,
                ass_subtitle_path=ass_path,
                output_path=final_clip_path,
                aspect_ratio=args.aspect_ratio,
                framing=args.framing
            )

            # Build public clip record
            clip_record = {
                "id": clip_num,
                "title": clip["title"],
                "reason": clip["reason"],
                "start": clip["start"],
                "end": clip["end"],
                "duration": clip["duration"],
                "score": clip.get("score", 9.0),
                "filename": clip_filename,
                "url": f"/clips/{clip_filename}",
                "aspectRatio": args.aspect_ratio,
            }
            completed_clips.append(clip_record)

            send_event({
                "type": "clip_completed",
                "clip": clip_record,
                "progress": min(95, start_pct + int(50 / max(total_clips, 1)))
            })

        send_event({
            "type": "complete",
            "progress": 100,
            "step": "Finished",
            "message": "All clips have been generated successfully!",
            "clips": completed_clips
        })

    except Exception as e:
        traceback.print_exc()
        send_event({
            "type": "error",
            "error": str(e)
        })
        sys.exit(1)
    finally:
        # Cleanup temp directory
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass


if __name__ == "__main__":
    main()
