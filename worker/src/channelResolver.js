const { spawn } = require('child_process');
const { getRandomProxy } = require('./proxyHelper');

/**
 * Resolves a YouTube channel URL to its display name using yt-dlp.
 * @param {string} channelUrl - e.g. 'https://www.youtube.com/@ArtistName' or 'https://www.youtube.com/channel/UC...'
 * @returns {Promise<string>} - The channel's display name
 */
async function resolveChannelName(channelUrl) {
  const proxy = await getRandomProxy();
  return new Promise((resolve, reject) => {
    const ytDlpPath = require('youtube-dl-exec/src/constants').YOUTUBE_DL_PATH;
    
    const runYtDlp = (useProxy) => {
      const args = [channelUrl, '--print', 'channel', '--playlist-items', '1', '--no-download'];
      if (useProxy && proxy) args.push('--proxy', proxy);
      const proc = spawn(ytDlpPath, args);
      let output = '';
      let errOutput = '';
      proc.stdout.on('data', (data) => { output += data.toString(); });
      proc.stderr.on('data', (data) => { errOutput += data.toString(); });
      proc.on('close', (code) => {
        const name = output.trim().split('\n')[0];
        if (name && name.length > 0) {
          return resolve(name);
        }
        
        if (useProxy && proxy && (errOutput.includes('proxy') || errOutput.includes('ConnectTimeoutError'))) {
          console.warn(`[RESOLVER] Proxy failed for ${channelUrl}. Retrying without proxy...`);
          return runYtDlp(false);
        }

        // Fallback: try to extract from URL
        const match = channelUrl.match(/@([^/]+)/);
        if (match) {
          resolve(match[1]);
        } else {
          reject(new Error(`Could not resolve channel name from ${channelUrl}`));
        }
      });
    };
    
    runYtDlp(true);
  });
}

module.exports = { resolveChannelName };
