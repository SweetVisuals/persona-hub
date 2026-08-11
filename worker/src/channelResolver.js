const { spawn } = require('child_process');

/**
 * Resolves a YouTube channel URL to its display name using yt-dlp.
 * @param {string} channelUrl - e.g. 'https://www.youtube.com/@ArtistName' or 'https://www.youtube.com/channel/UC...'
 * @returns {Promise<string>} - The channel's display name
 */
async function resolveChannelName(channelUrl) {
  return new Promise((resolve, reject) => {
    const ytDlpPath = require('youtube-dl-exec/src/constants').YOUTUBE_DL_PATH;
    const args = [channelUrl, '--print', 'channel', '--playlist-items', '1', '--no-download'];
    const proc = spawn(ytDlpPath, args);
    let output = '';
    let errOutput = '';
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { errOutput += data.toString(); });
    proc.on('close', (code) => {
      const name = output.trim().split('\n')[0];
      if (name && name.length > 0) {
        resolve(name);
      } else {
        // Fallback: try to extract from URL
        const match = channelUrl.match(/@([^/]+)/);
        if (match) {
          resolve(match[1]);
        } else {
          reject(new Error(`Could not resolve channel name from ${channelUrl}`));
        }
      }
    });
  });
}

module.exports = { resolveChannelName };
