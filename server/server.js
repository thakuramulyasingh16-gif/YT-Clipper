const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure storage and temp directories exist
const clipsDir = path.join(__dirname, 'storage', 'clips');
const tempDir = path.join(__dirname, 'temp');
fs.mkdirSync(clipsDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static serving for generated video clips
app.use('/clips', express.static(clipsDir, {
  setHeaders: (res, path) => {
    res.set('Accept-Ranges', 'bytes');
    res.set('Content-Type', 'video/mp4');
  }
}));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'YT-Clipper API'
  });
});

// Production: serve built frontend if available
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/clips')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 YT-Clipper Server running on port ${PORT}`);
  console.log(`📁 Clips directory: ${clipsDir}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
