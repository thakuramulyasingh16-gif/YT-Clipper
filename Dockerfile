# Multi-runtime Dockerfile for YT-Clipper (Node.js + Python 3 + FFmpeg + Subtitle Fonts)
FROM node:20-bookworm-slim

# Prevent interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies: Python, pip, FFmpeg, fonts, and certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    fonts-dejavu-core \
    fonts-liberation \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Verify ffmpeg and python installation
RUN ffmpeg -version && python3 --version
# Deno: JavaScript runtime yt-dlp needs to solve YouTube challenges
COPY --from=denoland/deno:bin /deno /usr/local/bin/deno
RUN deno --version

WORKDIR /app

# Install Python requirements
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy package files for dependency installation
COPY package.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install Node dependencies
RUN npm install --prefix server
RUN npm install --prefix client

# Copy application source code
COPY . .

# Build React client for production
RUN npm --prefix client run build

# Create storage and temp directories
RUN mkdir -p /app/server/storage/clips /app/server/temp

# Set environment
ENV NODE_ENV=production
ENV PORT=10000
ENV PYTHON_PATH=python3

EXPOSE 10000

# Start server (which serves API and static built client)
CMD ["node", "server/server.js"]
