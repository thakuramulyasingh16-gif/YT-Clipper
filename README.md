# ⚡ YT-Clipper — AI YouTube Short-Form Video Generator

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-Ready-007808?logo=ffmpeg&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

**Turn any long YouTube video into viral 9:16 vertical Shorts, Reels, and TikToks with automated highlight detection and dynamic word-by-word animated captions. Completely watermark-free.**

[Features](#-key-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Deployment](#-deployment-to-render) • [API Reference](#-api-endpoints)

</div>

---

## 🌟 Key Features

- ✂️ **Automated Viral Highlight Detection**: Intelligent heuristic NLP engine analyzes transcript density, speech tempo, question-answer arcs, and viral hook keywords to isolate the most engaging moments without dead air.
- 📱 **9:16 Vertical Reframing**:
  - **Cinematic Blurred Background**: Soft-blurred background letterboxing prevents speaker faces or podcast guests from being cropped out.
  - **Smart Center Crop**: Full-screen vertical fill centered on high-action frames.
- ⚡ **Alex Hormozi / TikTok Word-by-Word Captions**:
  - Timed karaoke-style ASS subtitles where each word highlights dynamically as it is spoken.
  - High-impact bold typography (Montserrat / Arial Black) with thick black contrast outlines and drop shadows.
  - Multiple vibrant active-word highlight palettes (Neon Yellow, Electric Green, Cyan, Pink, Orange).
- 🚫 **100% Watermark Free**: Download pure MP4 videos ready for immediate distribution across TikTok, YouTube Shorts, and Instagram Reels.
- 📊 **Real-time Live Progress Bar & Logs**: Server-Sent Events (SSE) and HTTP polling provide transparent visibility into every step of the pipeline.
- 🎯 **Custom AI Focus Prompt**: Optional prompt box to specify clip criteria (e.g. *"Find the most exciting discussion about AI startups"*).

---

## 🏗 Architecture

```
YT-Clipper/
├── client/                     # Frontend (React 18, Vite, Tailwind CSS, Lucide)
│   ├── src/
│   │   ├── components/         # UrlInput, VideoPreview, ConfigPanel, ProgressTracker, ClipCard
│   │   ├── services/api.js     # Axios API & SSE client
│   │   ├── App.jsx             # Main interactive application
│   │   └── index.css           # Custom glassmorphic design system
├── server/                     # Backend API & Orchestrator (Node.js + Express)
│   ├── controllers/            # Video metadata, job creation & download handlers
│   ├── services/               # Background JobQueue & Python Subprocess Bridge
│   ├── utils/youtube.js        # YouTube URL parsing & oEmbed metadata
│   ├── python/                 # Microservice Video Engine
│   │   ├── transcript.py       # youtube-transcript-api + yt-dlp fallback
│   │   ├── highlight.py        # NLP scoring & non-overlapping window selection
│   │   ├── subtitle_gen.py     # Timed ASS word-level subtitle generator
│   │   ├── video_pipeline.py   # yt-dlp slicing & FFmpeg filter rendering
│   │   └── processor.py        # CLI orchestrator emitting real-time JSON events
│   └── server.js               # Express server (serves API + static built React client)
├── Dockerfile                  # Multi-runtime Docker container (Node + Python + FFmpeg + fonts)
├── render.yaml                 # 1-click deployment configuration for Render
└── requirements.txt            # Python dependencies (yt-dlp, youtube-transcript-api, moviepy)
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **FFmpeg** installed and accessible in your system `PATH`:
  - **Windows**: `winget install Gyan.FFmpeg` or download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)
  - **macOS**: `brew install ffmpeg`
  - **Linux (Ubuntu/Debian)**: `sudo apt-get install ffmpeg`

### 2. Clone the Repository
```bash
git clone https://github.com/thakuramulyasingh16-gif/YT-Clipper.git
cd YT-Clipper
```

### 3. Install Dependencies

**Python Dependencies:**
```bash
pip install -r requirements.txt
```

**Node.js Dependencies (Root, Server & Client):**
```bash
npm run install:all
```

### 4. Configure Environment
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(Optional: Add `OPENAI_API_KEY` or `GEMINI_API_KEY` if you want AI-assisted prompt re-ranking. If omitted, the built-in heuristic NLP engine runs automatically with zero API costs!)*

### 5. Run the Application

To run both backend and frontend concurrently with hot-reloading:
```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🐳 Docker Setup

To build and run the entire application containerized:

```bash
# Build the Docker image
docker build -t yt-clipper .

# Run the container
docker run -p 10000:10000 yt-clipper
```

Open `http://localhost:10000` in your browser.

---

## ☁️ Deployment to Render

The repository is pre-configured with a `Dockerfile` and `render.yaml` blueprint for seamless deployment on [Render](https://render.com).

### Method 1: Blueprint Deploy (Recommended)
1. Fork or push this repository to your GitHub account (`https://github.com/thakuramulyasingh16-gif/YT-Clipper`).
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your `YT-Clipper` GitHub repository.
5. Render will automatically detect `render.yaml` and configure the Docker Web Service with FFmpeg and Python dependencies.
6. Click **Apply** to deploy.

### Method 2: Manual Web Service Deploy
1. In Render, select **New +** -> **Web Service**.
2. Connect your `YT-Clipper` repo.
3. Configure the settings:
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Region**: Choose closest to your audience (e.g. Oregon)
   - **Plan**: Starter or higher (recommended for video transcoding)
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
5. Click **Create Web Service**.

---

## 📡 API Endpoints

### `POST /api/video/metadata`
Fetches YouTube video title, duration, author, and HD thumbnail.
```json
{
  "url": "https://www.youtube.com/watch?v=UF8uR6Z6KLc"
}
```

### `POST /api/video/generate`
Queues a video clipping job.
```json
{
  "url": "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
  "numClips": 3,
  "clipDuration": 30,
  "prompt": "Find the most exciting discussion about technology",
  "aspectRatio": "9:16",
  "framing": "blur",
  "highlightColor": "yellow",
  "fontSize": 70
}
```

### `GET /api/jobs/:id`
Retrieves the real-time processing status, progress percentage, step logs, and completed clips.

### `GET /api/jobs/:id/stream`
Server-Sent Events (SSE) live connection broadcasting real-time progress events directly to the UI.

### `GET /api/clips/download/:filename`
Direct attachment download of the processed MP4 video file.

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).