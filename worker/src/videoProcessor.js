const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
}

async function processVideo(inputPath, outputPath, audioPath = null, srtPath = null, aspectRatio = '9:16', trimOptions = null) {
  let duration = 0;
  if (trimOptions) {
    try {
      duration = await getVideoDuration(inputPath);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  return new Promise((resolve, reject) => {
    console.log(`[VIDEO PROCESSOR] Processing ${inputPath} with audio ${audioPath} and ratio ${aspectRatio}...`);
    
    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file not found: ${inputPath}`));
    }

    // Ensure output directory exists
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    let cropOption = 'ih*(9/16):ih';
    let scaleOption = '1080:1920';

    if (aspectRatio === '3:4') {
      cropOption = 'ih*(3/4):ih';
      scaleOption = '1080:1440';
    } else if (aspectRatio === '1:1') {
      cropOption = 'ih:ih';
      scaleOption = '1080:1080';
    } else if (aspectRatio === '4:5') {
      cropOption = 'ih*(4/5):ih';
      scaleOption = '1080:1350';
    } else if (aspectRatio === '16:9') {
      cropOption = 'iw:iw*(9/16)';
      scaleOption = '1920:1080';
    }

    const filters = [
      {
        filter: 'crop',
        options: cropOption
      },
      {
        filter: 'scale',
        options: scaleOption
      }
    ];

    if (srtPath && fs.existsSync(srtPath)) {
      filters.push({
        filter: 'subtitles',
        options: `filename='${srtPath.replace(/\\/g, '/')}':force_style='FontName=TikTok Sans,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=60'`
      });
    }

    let command = ffmpeg(inputPath);
    
    if (trimOptions) {
      const startTime = duration * (trimOptions.startPercent || 0);
      const endTrim = duration * (trimOptions.endPercent || 0);
      const effectiveDuration = duration - startTime - endTrim;
      command = command.seekInput(startTime).duration(effectiveDuration);
    }

    if (audioPath && fs.existsSync(audioPath)) {
      command = command.input(audioPath);
    }

    command
      .videoFilters(filters)
      .outputOptions(audioPath ? ['-c:v libx264', '-preset fast', '-c:a aac', '-map 0:v:0', '-map 1:a:0'] : ['-c:v libx264', '-preset fast'])
      .setDuration(15) // Limit to 15 seconds for short form
      .on('end', () => {
        console.log(`[VIDEO PROCESSOR] Successfully saved to ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`[VIDEO PROCESSOR] Error: ${err.message}`);
        reject(err);
      })
      .save(outputPath);
  });
}

module.exports = { processVideo, getVideoDuration };
