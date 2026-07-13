const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

/**
 * Downloads an image from a URL to a local temporary file.
 * @param {string} url - The URL of the image
 * @returns {Promise<string>} The local file path
 */
function downloadImage(url, cookieString = null) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const ext = path.extname(parsedUrl.pathname) || '.jpg';
      const os = require('os');
      const filename = `scraped_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
      const localPath = path.join(os.tmpdir(), filename);

      const file = fs.createWriteStream(localPath);
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.pinterest.com/'
        }
      };
      
      if (cookieString) {
        let cookieHeader = cookieString;
        try {
            const parsed = JSON.parse(cookieString);
            cookieHeader = parsed.map(c => `${c.name}=${c.value}`).join('; ');
        } catch(e) {}
        options.headers['Cookie'] = cookieHeader;
      }

      https.get(url, options, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          file.close();
          fs.unlink(localPath, () => {});
          return reject(new Error(`Failed to get image, status code: ${response.statusCode}`));
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close(() => resolve(localPath));
        });
      }).on('error', (err) => {
        fs.unlink(localPath, () => {});
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { downloadImage };
