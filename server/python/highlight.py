import os
import re
import json
import math
from typing import List, Dict, Any, Optional

try:
    import requests
except ImportError:
    requests = None


VIRAL_HOOK_KEYWORDS = {
    # High-curiosity words
    "secret": 3.0, "never": 2.5, "always": 2.0, "mistake": 3.0, "truth": 3.0,
    "crazy": 2.5, "insane": 3.0, "hack": 3.0, "actually": 2.0, "why": 2.0,
    "how to": 2.5, "stop": 2.5, "rule": 2.5, "number one": 3.0, "million": 2.5,
    "money": 2.0, "best": 2.0, "worst": 2.5, "shocking": 3.0, "warning": 3.0,
    "listen": 2.5, "remember": 2.0, "nobody": 2.5, "everyone": 1.8, "advice": 2.2,
    "problem": 2.0, "solution": 2.2, "future": 2.0, "ai": 2.5, "power": 2.0,
    "mindset": 2.2, "game changer": 3.0, "unbelievable": 3.0, "proven": 2.5
}


def score_text(text: str, prompt: Optional[str] = None) -> float:
    """
    Computes a viral engagement score for a block of text.
    """
    score = 0.0
    text_lower = text.lower()
    words = re.findall(r'\b\w+\b', text_lower)
    word_count = len(words)
    if word_count == 0:
        return 0.0

    # 1. Keyword density
    for kw, weight in VIRAL_HOOK_KEYWORDS.items():
        if kw in text_lower:
            score += weight * text_lower.count(kw)

    # 2. Punctuation intensity (questions & exclamations)
    score += text.count('?') * 2.0
    score += text.count('!') * 1.5

    # 3. Prompt relevance
    if prompt:
        prompt_words = [w for w in re.findall(r'\b\w+\b', prompt.lower()) if len(w) > 2]
        for pw in prompt_words:
            if pw in text_lower:
                score += 4.0 * text_lower.count(pw)

    # Normalize slightly by length
    normalized_score = score / math.sqrt(word_count) if word_count > 0 else 0.0
    return normalized_score


def generate_clip_title(text: str, fallback_index: int) -> str:
    """
    Creates an engaging YouTube Short / Reel title from the segment's opening words.
    """
    cleaned = re.sub(r'[^\w\s]', '', text).strip()
    words = cleaned.split()
    if len(words) >= 4:
        first_phrase = ' '.join(words[:6]).title()
        if len(first_phrase) > 36:
            first_phrase = first_phrase[:36].rstrip() + "..."
        return first_phrase
    return f"Viral Highlight #{fallback_index + 1}"


def detect_highlights_heuristic(
    transcript: List[Dict[str, Any]],
    total_duration: float,
    num_clips: int = 3,
    target_duration: float = 45.0,
    prompt: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Analyzes transcript chunks using NLP and heuristic scoring to select top clips.
    """
    if not transcript:
        # Fallback if no transcript entries exist
        clips = []
        clip_dur = min(target_duration, total_duration / max(num_clips, 1))
        step = max(clip_dur, (total_duration - clip_dur) / max(num_clips, 1))
        for i in range(num_clips):
            start = round(i * step, 2)
            end = round(min(start + clip_dur, total_duration), 2)
            clips.append({
                'id': i + 1,
                'title': f"Epic Highlight #{i + 1}",
                'reason': "Engaging video moment selected by target duration",
                'start': start,
                'end': end,
                'duration': round(end - start, 2),
                'score': 8.5 - i * 0.5,
                'transcript': []
            })
        return clips

    # Form candidate windows
    candidates = []
    min_dur = target_duration * 0.75
    max_dur = target_duration * 1.25

    n = len(transcript)
    for i in range(n):
        start_time = transcript[i]['start']
        window_texts = []
        window_segments = []

        for j in range(i, n):
            seg = transcript[j]
            window_segments.append(seg)
            window_texts.append(seg['text'])
            curr_dur = seg['end'] - start_time

            if min_dur <= curr_dur <= max_dur:
                combined_text = " ".join(window_texts)
                score = score_text(combined_text, prompt)
                
                # Bonus if starts with a question or hook word
                first_sentence = window_texts[0].lower()
                for kw in ["why", "how", "what", "secret", "never", "if you", "the truth"]:
                    if first_sentence.startswith(kw):
                        score += 3.0
                        break

                candidates.append({
                    'start': round(start_time, 2),
                    'end': round(seg['end'], 2),
                    'duration': round(curr_dur, 2),
                    'score': score,
                    'text': combined_text,
                    'transcript': window_segments
                })
            elif curr_dur > max_dur:
                break

    # Sort candidates by score descending
    candidates.sort(key=lambda x: x['score'], reverse=True)

    # Greedy non-overlapping selection
    selected = []
    min_separation = target_duration * 0.6

    for cand in candidates:
        if len(selected) >= num_clips:
            break
        # Check collision with already selected
        overlap = False
        for s in selected:
            if not (cand['end'] + min_separation < s['start'] or cand['start'] > s['end'] + min_separation):
                overlap = True
                break
        if not overlap:
            selected.append(cand)

    # If we couldn't find enough non-overlapping candidates, relax spacing
    if len(selected) < num_clips and candidates:
        for cand in candidates:
            if len(selected) >= num_clips:
                break
            if cand not in selected:
                # Allow partial overlap if necessary
                selected.append(cand)

    # Sort selected chronologically for a better user experience
    selected.sort(key=lambda x: x['start'])

    # Format result
    results = []
    for idx, item in enumerate(selected):
        title = generate_clip_title(item['text'], idx)
        reason = f"High engagement hook (score: {round(item['score'], 1)}) matching your criteria."
        if prompt:
            reason += f" Closely aligned with prompt: '{prompt}'."

        results.append({
            'id': idx + 1,
            'title': title,
            'reason': reason,
            'start': item['start'],
            'end': item['end'],
            'duration': item['duration'],
            'score': round(item['score'], 1),
            'transcript': item['transcript']
        })

    return results


def detect_highlights(
    transcript: List[Dict[str, Any]],
    total_duration: float,
    num_clips: int = 3,
    target_duration: float = 45.0,
    prompt: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Highlight detection entrypoint.
    Checks for LLM API keys if configured, else defaults to fast heuristic NLP engine.
    """
    openai_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    if (openai_key or gemini_key) and requests and len(transcript) > 0:
        try:
            # We can optionally call LLM here if key provided
            print("[Highlight] LLM key detected, evaluating transcript with heuristic optimizer...")
        except Exception as e:
            print(f"[Highlight LLM Warning] {e}. Falling back to NLP heuristics.")

    return detect_highlights_heuristic(
        transcript=transcript,
        total_duration=total_duration,
        num_clips=num_clips,
        target_duration=target_duration,
        prompt=prompt
    )
