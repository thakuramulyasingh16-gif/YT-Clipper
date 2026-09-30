const express = require('express');
const router = express.Router();
const {
  getMetadata,
  createClipJob,
  getJobStatus,
  streamJobProgress,
  downloadClip
} = require('../controllers/videoController');

// Video Metadata Preview
router.post('/video/metadata', getMetadata);

// Launch Video Clipping Job
router.post('/video/generate', createClipJob);

// Query Job Status
router.get('/jobs/:id', getJobStatus);

// Stream Job Live Progress via SSE
router.get('/jobs/:id/stream', streamJobProgress);

// Download Processed Clip
router.get('/clips/download/:filename', downloadClip);

module.exports = router;
