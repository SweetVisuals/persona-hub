const path = require('path');
const fs = require('fs');

/**
 * Transcribes audio using Groq Whisper API.
 * @param {string} audioPath - Path to the local audio/video file.
 * @returns {Promise<string>} - Path to the generated .srt file.
 */
async function generateSubtitles(audioPath) {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }
    
    const outputDir = path.dirname(audioPath);
    const audioName = path.basename(audioPath, path.extname(audioPath));
    const srtPath = path.join(outputDir, `${audioName}.srt`);

    console.log(`[TRANSCRIBER] Starting Groq Whisper transcription for ${audioName}...`);
    
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('[TRANSCRIBER] GROQ_API_KEY is not set.');
      throw new Error('GROQ_API_KEY is required for free API transcription.');
    }

    try {
      // Rate limit: Max 20 requests per minute. We use 15 seconds to stay VERY safe (4 requests/min).
      await new Promise(resolve => setTimeout(resolve, 15000));

      const { Blob } = require('buffer');
      const fileBuffer = fs.readFileSync(audioPath);
      const fileBlob = new Blob([fileBuffer]);
      
      const formData = new FormData();
      formData.append('file', fileBlob, path.basename(audioPath));
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'srt');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API Error: ${response.status} ${errText}`);
      }

      const srtText = await response.text();
      fs.writeFileSync(srtPath, srtText);
      console.log(`[TRANSCRIBER] Transcription complete: ${srtPath}`);
      return srtPath;
    } catch (err) {
      console.error(`[WHISPER error] Failed to transcribe with Groq:`, err.message || err);
      throw err;
    }
}

module.exports = { generateSubtitles };
