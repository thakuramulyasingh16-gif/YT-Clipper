const { spawn } = require('child_process');
const path = require('path');
const jobQueue = require('./jobQueue');

function getPythonExecutable() {
  if (process.env.PYTHON_PATH) {
    return { cmd: process.env.PYTHON_PATH, args: [] };
  }
  if (process.platform === 'win32') {
    // Check if py launcher is available
    return { cmd: 'py', args: ['-3.12'] };
  }
  return { cmd: 'python3', args: [] };
}

function runClipperJob(jobId, params) {
  const {
    url,
    numClips = 3,
    clipDuration = 45,
    prompt = '',
    aspectRatio = '9:16',
    framing = 'blur',
    highlightColor = 'yellow',
    fontSize = 70
  } = params;

  const scriptPath = path.join(__dirname, '..', 'python', 'processor.py');
  const outputDir = path.join(__dirname, '..', 'storage', 'clips');

  const { cmd, args: baseArgs } = getPythonExecutable();
  const scriptArgs = [
    scriptPath,
    '--job_id', jobId,
    '--url', url,
    '--num_clips', String(numClips),
    '--duration', String(clipDuration),
    '--prompt', prompt || '',
    '--aspect_ratio', aspectRatio,
    '--framing', framing,
    '--highlight_color', highlightColor,
    '--font_size', String(fontSize),
    '--output_dir', outputDir
  ];

  const fullArgs = [...baseArgs, ...scriptArgs];

  jobQueue.updateJob(jobId, {
    status: 'processing',
    step: 'Starting Engine',
    message: 'Spawning video processing pipeline...',
    progress: 5
  });

  jobQueue.addLog(jobId, `Executing: ${cmd} ${fullArgs.join(' ')}`);

  const pyProcess = spawn(cmd, fullArgs, {
    cwd: path.join(__dirname, '..', 'python'),
    env: { ...process.env }
  });

  pyProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('__EVENT__')) {
        try {
          const eventJson = JSON.parse(line.replace('__EVENT__', ''));
          handleEvent(jobId, eventJson);
        } catch (e) {
          jobQueue.addLog(jobId, line);
        }
      } else {
        jobQueue.addLog(jobId, line);
      }
    }
  });

  pyProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text) {
      jobQueue.addLog(jobId, `[stderr] ${text}`);
    }
  });

  pyProcess.on('error', (err) => {
    jobQueue.updateJob(jobId, {
      status: 'failed',
      error: `Failed to spawn Python process: ${err.message}`,
      step: 'Process Error'
    });
  });

  pyProcess.on('close', (code) => {
    const job = jobQueue.getJob(jobId);
    if (code === 0) {
      if (job && job.status !== 'completed') {
        jobQueue.updateJob(jobId, {
          status: 'completed',
          progress: 100,
          step: 'Finished',
          message: 'Video processing complete!'
        });
      }
    } else {
      if (job && job.status !== 'failed') {
        jobQueue.updateJob(jobId, {
          status: 'failed',
          error: `Processing process exited with status code ${code}`,
          step: 'Failed'
        });
      }
    }
  });
}

function handleEvent(jobId, event) {
  switch (event.type) {
    case 'progress':
      jobQueue.updateJob(jobId, {
        progress: event.progress,
        step: event.step,
        message: event.message
      });
      jobQueue.addLog(jobId, `${event.step}: ${event.message}`);
      break;

    case 'clip_completed': {
      const currentJob = jobQueue.getJob(jobId);
      const updatedClips = [...(currentJob.clips || []), event.clip];
      jobQueue.updateJob(jobId, {
        clips: updatedClips,
        progress: event.progress || currentJob.progress
      });
      jobQueue.addLog(jobId, `Finished clip: "${event.clip.title}"`);
      break;
    }

    case 'complete':
      jobQueue.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        step: 'Finished',
        message: event.message,
        clips: event.clips
      });
      jobQueue.addLog(jobId, 'All clips successfully generated and saved.');
      break;

    case 'error':
      jobQueue.updateJob(jobId, {
        status: 'failed',
        error: event.error,
        step: 'Error Encountered'
      });
      jobQueue.addLog(jobId, `[ERROR] ${event.error}`);
      break;

    default:
      break;
  }
}

module.exports = {
  runClipperJob
};
