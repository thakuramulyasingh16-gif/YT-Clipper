const path = require('path');
const fs = require('fs');
const { getVideoMetadata } = require('../utils/youtube');
const jobQueue = require('../services/jobQueue');
const { runClipperJob } = require('../services/pythonBridge');

async function getMetadata(req, res) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'YouTube URL is required' });
    }

    const metadata = await getVideoMetadata(url);
    return res.json({ success: true, metadata });
  } catch (error) {
    console.error('[Metadata Error]', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to fetch video metadata' });
  }
}

async function createClipJob(req, res) {
  try {
    const {
      url,
      numClips = 3,
      clipDuration = 45,
      prompt = '',
      aspectRatio = '9:16',
      framing = 'blur',
      highlightColor = 'yellow',
      fontSize = 70
    } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'YouTube URL is required' });
    }

    const job = jobQueue.createJob({
      url,
      numClips: Math.min(Math.max(parseInt(numClips, 10) || 1, 1), 5),
      clipDuration: Math.min(Math.max(parseFloat(clipDuration) || 30, 15), 180),
      prompt: prompt ? String(prompt).trim() : '',
      aspectRatio: ['9:16', '16:9', '1:1'].includes(aspectRatio) ? aspectRatio : '9:16',
      framing: ['blur', 'crop'].includes(framing) ? framing : 'blur',
      highlightColor: ['yellow', 'green', 'cyan', 'pink', 'orange'].includes(highlightColor) ? highlightColor : 'yellow',
      fontSize: parseInt(fontSize, 10) || 70
    });

    // Start background processing
    setImmediate(() => {
      runClipperJob(job.id, job.params);
    });

    return res.status(202).json({
      success: true,
      jobId: job.id,
      message: 'Processing started',
      job
    });
  } catch (error) {
    console.error('[Create Job Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

function getJobStatus(req, res) {
  const { id } = req.params;
  const job = jobQueue.getJob(id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  return res.json({ success: true, job });
}

function streamJobProgress(req, res) {
  const { id } = req.params;
  const job = jobQueue.getJob(id);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send current state immediately
  res.write(`data: ${JSON.stringify(job)}\n\n`);

  // Subscribe to updates
  const unsubscribe = jobQueue.subscribe(id, (updatedJob) => {
    res.write(`data: ${JSON.stringify(updatedJob)}\n\n`);
    if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
      // Allow final packet to flush, then close
      setTimeout(() => {
        res.end();
      }, 1000);
    }
  });

  req.on('close', () => {
    unsubscribe();
  });
}

function downloadClip(req, res) {
  const { filename } = req.params;
  // Sanitize filename to prevent directory traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(__dirname, '..', 'storage', 'clips', safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  return res.download(filePath, safeFilename, (err) => {
    if (err) {
      console.error('[Download Error]', err);
    }
  });
}

module.exports = {
  getMetadata,
  createClipJob,
  getJobStatus,
  streamJobProgress,
  downloadClip
};
