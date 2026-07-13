const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

/**
 * Downloads a video using yt-dlp.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<string>} - The local path to the downloaded .mp4 file.
 */
async function scrapeVideo(url, cookieString = null) {
  const fileId = crypto.randomBytes(8).toString('hex');
  const tmpDir = os.tmpdir();
  const outputPath = path.join(tmpDir, `video_${fileId}.%(ext)s`);

  console.log(`[SCRAPER] Starting yt-dlp download for ${url}`);
  
  const options = {
    output: outputPath,
    format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    noPlaylist: true,
    extractorArgs: 'youtube:player-client=android,web',
    ffmpegLocation: require('path').dirname(require('ffmpeg-ffprobe-static').ffmpegPath)
  };

  let cookieFilePath = null;
  if (cookieString) {
    try {
      cookieFilePath = path.join(tmpDir, `cookies_${fileId}.txt`);
      let parsed = [];
      if (cookieString.trim().startsWith('[')) {
        parsed = JSON.parse(cookieString);
      } else {
        const pairs = cookieString.split(';').map(s => s.trim()).filter(Boolean);
        parsed = pairs.map(p => {
          const [name, ...val] = p.split('=');
          return { name, value: val.join('='), domain: '.youtube.com' };
        });
      }
      let netscapeCookies = '# Netscape HTTP Cookie File\n';
      for (const c of parsed) {
        netscapeCookies += `${c.domain || '.youtube.com'}\tTRUE\t/\tTRUE\t${Math.floor(Date.now() / 1000) + 3600}\t${c.name}\t${c.value}\n`;
      }
      fs.writeFileSync(cookieFilePath, netscapeCookies);
      options.cookies = cookieFilePath;
      console.log(`[SCRAPER] Using authenticated cookies for yt-dlp`);
    } catch (err) {
      console.error('[SCRAPER] Failed to parse cookieString for yt-dlp:', err.message);
    }
  }

  try {
    await youtubedl(url, options);
    
    if (cookieFilePath && fs.existsSync(cookieFilePath)) {
      fs.unlinkSync(cookieFilePath);
    }
    
    // The actual file might have .mp4 or .webm extension
    const files = fs.readdirSync(tmpDir);
    const downloadedFile = files.find(f => f.startsWith(`video_${fileId}.`));
    if (!downloadedFile) throw new Error("Downloaded video file not found in temp directory");
    const actualPath = path.join(tmpDir, downloadedFile);
    console.log(`[SCRAPER] Download complete: ${actualPath}`);
    return actualPath;
  } catch (err) {
    if (cookieFilePath && fs.existsSync(cookieFilePath)) {
      fs.unlinkSync(cookieFilePath);
    }
    throw new Error(`yt-dlp failed: ${err.message}`);
  }
}

/**
 * Downloads audio using yt-dlp and extracts as mp3.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<string>} - The local path to the downloaded .mp3 file.
 */
async function scrapeAudio(url, cookieString = null) {
  const fileId = crypto.randomBytes(8).toString('hex');
  const tmpDir = os.tmpdir();
  const outputPath = path.join(tmpDir, `audio_${fileId}.%(ext)s`);

  console.log(`[SCRAPER] Starting yt-dlp audio download for ${url}`);
  
  const options = {
    output: outputPath,
    extractAudio: true,
    audioFormat: 'mp3',
    audioQuality: 0,
    noPlaylist: true,
    extractorArgs: 'youtube:player-client=android,web',
    ffmpegLocation: require('path').dirname(require('ffmpeg-ffprobe-static').ffmpegPath)
  };

  let cookieFilePath = null;
  if (cookieString) {
    try {
      cookieFilePath = path.join(tmpDir, `cookies_${fileId}.txt`);
      let parsed = [];
      if (cookieString.trim().startsWith('[')) {
        parsed = JSON.parse(cookieString);
      } else {
        const pairs = cookieString.split(';').map(s => s.trim()).filter(Boolean);
        parsed = pairs.map(p => {
          const [name, ...val] = p.split('=');
          return { name, value: val.join('='), domain: '.youtube.com' };
        });
      }
      let netscapeCookies = '# Netscape HTTP Cookie File\n';
      for (const c of parsed) {
        netscapeCookies += `${c.domain || '.youtube.com'}\tTRUE\t/\tTRUE\t${Math.floor(Date.now() / 1000) + 3600}\t${c.name}\t${c.value}\n`;
      }
      fs.writeFileSync(cookieFilePath, netscapeCookies);
      options.cookies = cookieFilePath;
      console.log(`[SCRAPER] Using authenticated cookies for yt-dlp audio`);
    } catch (err) {
      console.error('[SCRAPER] Failed to parse cookieString for yt-dlp:', err.message);
    }
  }

  try {
    await youtubedl(url, options);
    
    if (cookieFilePath && fs.existsSync(cookieFilePath)) {
      fs.unlinkSync(cookieFilePath);
    }
    
    const actualPath = path.join(tmpDir, `audio_${fileId}.mp3`);
    console.log(`[SCRAPER] Audio download complete: ${actualPath}`);
    return actualPath;
  } catch (err) {
    if (cookieFilePath && fs.existsSync(cookieFilePath)) {
      fs.unlinkSync(cookieFilePath);
    }
    throw new Error(`yt-dlp audio failed: ${err.message}`);
  }
}

module.exports = { scrapeVideo, scrapeAudio };
