const axios = require('axios');
const { spawn } = require('child_process');

function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

async function getVideoMetadata(url) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL or Video ID');
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const standardThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  let metadata = {
    videoId,
    url: canonicalUrl,
    title: `YouTube Video (${videoId})`,
    author: 'YouTube Creator',
    thumbnail: standardThumbnail,
    duration: 180,
    durationFormatted: '3:00',
  };

  // 1. Try fast YouTube oEmbed endpoint
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
    const response = await axios.get(oembedUrl, { timeout: 4000 });
    if (response.data) {
      metadata.title = response.data.title || metadata.title;
      metadata.author = response.data.author_name || metadata.author;
    }
  } catch (err) {
    // oEmbed might fail for unlisted or restricted videos; continue
  }

  // 2. Fetch accurate duration via yt-dlp
  try {
    const duration = await new Promise((resolve) => {
      const pythonCmd = process.platform === 'win32' ? 'py' : 'python3';
      const pythonArgs = process.platform === 'win32'
        ? ['-3.12', '-m', 'yt_dlp', '--print', 'duration', '--skip-download', canonicalUrl]
        : ['-m', 'yt_dlp', '--print', 'duration', '--skip-download', canonicalUrl];

      const p = spawn(pythonCmd, pythonArgs);
      let out = '';
      p.stdout.on('data', (d) => { out += d.toString(); });
      p.on('close', (code) => {
        if (code === 0 && out.trim()) {
          const val = parseFloat(out.trim());
          if (!isNaN(val)) return resolve(val);
        }
        resolve(null);
      });
      p.on('error', () => resolve(null));
      // Timeout after 6 seconds to prevent slow UI
      setTimeout(() => resolve(null), 6000);
    });

    if (duration) {
      metadata.duration = duration;
      metadata.durationFormatted = formatDuration(duration);
    }
  } catch (e) {
    // Fallback duration
  }

  return metadata;
}

module.exports = {
  extractVideoId,
  formatDuration,
  getVideoMetadata
};
