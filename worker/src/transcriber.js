const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Transcribes audio using local Whisper model.
 * @param {string} audioPath - Path to the local audio/video file.
 * @returns {Promise<string>} - Path to the generated .srt file.
 */
async function generateSubtitles(audioPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(audioPath)) {
      return reject(new Error(`Audio file not found: ${audioPath}`));
    }
    
    const outputDir = path.dirname(audioPath);
    const audioName = path.basename(audioPath, path.extname(audioPath));
    const srtPath = path.join(outputDir, `${audioName}.srt`);

    console.log(`[TRANSCRIBER] Starting local Whisper transcription for ${audioName}...`);
    
    // Command: whisper audioPath --model tiny --output_format srt --output_dir outputDir
    const whisperProc = spawn('whisper', [
      audioPath,
      '--model', 'tiny', // use 'tiny' for fast CPU inference on VPS
      '--output_format', 'srt',
      '--output_dir', outputDir
    ]);

    whisperProc.stdout.on('data', (data) => {
      console.log(`[WHISPER] ${data.toString().trim()}`);
    });

    whisperProc.stderr.on('data', (data) => {
      console.error(`[WHISPER stderr] ${data.toString().trim()}`);
    });

    whisperProc.on('error', (err) => {
      console.error(`[WHISPER error] Failed to start Whisper:`, err);
    });

    whisperProc.on('close', (code) => {
      if (code === 0) {
        if (fs.existsSync(srtPath)) {
          console.log(`[TRANSCRIBER] Transcription complete: ${srtPath}`);
          resolve(srtPath);
        } else {
          // Whisper might output .srt with a slightly different name if there are special characters.
          const files = fs.readdirSync(outputDir);
          const srtFile = files.find(f => f.endsWith('.srt') && f.startsWith(audioName));
          if (srtFile) {
             resolve(path.join(outputDir, srtFile));
          } else {
             reject(new Error(`Whisper completed but SRT file was not found.`));
          }
        }
      } else {
        reject(new Error(`Whisper process exited with code ${code}`));
      }
    });
  });
}

module.exports = { generateSubtitles };
