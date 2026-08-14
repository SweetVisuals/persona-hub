const { Camoufox } = require('camoufox-js');
const { spawn } = require('child_process');
const fs = require('fs');
const { getRandomProxy } = require('./proxyHelper');

/**
 * Searches Pinterest for a given query and extracts the top Pin URLs authentically using a synced session cookie.
 * @param {string} query - The search term (e.g. "city aesthetic")
 * @param {string} cookieString - The session cookie from the database
 * @param {number} limit - Number of pins to extract
 * @returns {Promise<string[]>} Array of high-res image source URLs
 */
async function scrapePinterestSearch(query, cookieString, limit = 20) {
  console.log(`[SOURCING] Booting authenticated headless browser for Pinterest search: "${query}"`);
  const browserArgs = { headless: true };
  const browser = await Camoufox(browserArgs);
  const page = await browser.newPage();
  const context = page.context();
  
  if (cookieString) {
    console.log(`[SOURCING] Injecting synced session cookies into browser...`);
    let cookies = [];
    try {
      const parsed = JSON.parse(cookieString);
      if (Array.isArray(parsed)) {
        cookies = parsed.map(c => ({
          name: String(c.name).trim(),
          value: String(c.value).trim(),
          url: 'https://www.pinterest.com'
        }));
      }
    } catch (e) {
      cookies = cookieString.split(';').map(c => {
        const idx = c.indexOf('=');
        if (idx === -1) return null;
        const name = c.substring(0, idx).trim();
        const value = c.substring(idx + 1).trim();
        return {
          name,
          value,
          url: 'https://www.pinterest.com'
        };
      }).filter(c => c && c.name && c.value);
    }
    
    for (const c of cookies) {
      try {
          await context.addCookies([c]);
      } catch(err) {
          console.error(`[SOURCING ERROR] Failed to inject cookie ${c.name}:`, err.message);
      }
    }
  }


  const results = [];
  
  try {
    const encodedQuery = encodeURIComponent(query);
    await page.goto(`https://www.pinterest.com/search/pins/?q=${encodedQuery}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Scroll deep to load more pins (pagination)
    for (let i = 0; i < 15; i++) {
        await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
    }
    
    // Extract image URLs and titles - targeting standard Pinterest grid images
    const extractedPins = await page.$$eval('img', imgs => {
      const results = [];
      imgs.forEach(img => {
        if (img.src && img.src.includes('pinimg.com')) {
          results.push({ url: img.src, title: img.alt || 'pinterest_image' });
        }
      });
      return results;
    });
    
    if (extractedPins.length === 0) {
      await page.screenshot({ path: 'pinterest_debug.png' });
      console.log('[SOURCING] No images found. Saved debug screenshot to pinterest_debug.png');
    }
    
    // De-duplicate by URL
    const seenUrls = new Set();
    const uniquePins = [];
    for (const pin of extractedPins) {
      if (!seenUrls.has(pin.url)) {
        seenUrls.add(pin.url);
        uniquePins.push(pin);
      }
    }
    
    // For Pinterest, upgrade the resolution path to 'originals' for the absolute highest quality.
    for (const pin of uniquePins) {
      if (pin.url.includes('75x75') || pin.url.includes('136x136') || pin.url.includes('avatars') || pin.url.includes('profile')) continue;
      results.push({
        url: pin.url.replace(/\/\d+x(\d+)?\//, '/originals/'),
        title: pin.title
      });
    }
    
    const finalResults = results.slice(0, limit);
    console.log(`[SOURCING] Scraped ${finalResults.length} high-res images for query "${query}"`);
    return finalResults;
  } catch (error) {
    console.error(`[SOURCING ERROR] Failed to scrape Pinterest for "${query}":`, error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function scrapeYouTubeSearch(query, limit = 1, extractMode = 'latest', cookieString = null) {
  const proxy = await getRandomProxy();
  return new Promise((resolve, reject) => {
    const finalQuery = query;
    console.log(`[SOURCING] Starting yt-dlp search for YouTube: "${finalQuery}"`);
    
    let ytsearchStr = `ytsearch${limit}:${finalQuery}`;
    if (extractMode === 'popular') {
        // yt-dlp doesn't natively support sorting search by views easily, but we can pass ytsearch parameters
        // Actually, yt-dlp ytsearch doesn't sort by views easily without extra arguments.
        // We will just use standard ytsearch for popular for now, as ytsearch defaults to relevance which is close.
    } else if (extractMode === 'latest') {
        // Fallback to standard ytsearch instead of ytsearchdate because ytsearchdate 
        // often returns zero results for specific username/brand queries like 'maniraesworld'
        ytsearchStr = `ytsearch${limit}:${finalQuery}`;
    }

    const args = [
      ytsearchStr,
      '--dump-json',
      '--no-playlist',
      '--extractor-args', 'youtube:player-client=android,web'
    ];
    if (proxy) args.push('--proxy', proxy);
    
    let tmpCookieFile = null;
    if (cookieString) {
      try {
        const crypto = require('crypto');
        const os = require('os');
        const path = require('path');
        const fs = require('fs');
        tmpCookieFile = path.join(os.tmpdir(), `ytsearch_cookies_${crypto.randomBytes(8).toString('hex')}.txt`);
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
        fs.writeFileSync(tmpCookieFile, netscapeCookies);
        args.push('--cookies', tmpCookieFile);
      } catch(e) {}
    }

    const ytDlpPath = require('youtube-dl-exec/src/constants').YOUTUBE_DL_PATH;
    const ytDlp = spawn(ytDlpPath, args);

    let output = '';
    ytDlp.stdout.on('data', (data) => { output += data.toString(); });
    ytDlp.stderr.on('data', (data) => { 
        console.error(`[yt-dlp stderr] ${data.toString().trim()}`); 
    });
    ytDlp.on('error', (err) => {
        console.error(`[yt-dlp spawn error]`, err);
    });
    
    ytDlp.on('close', (code) => {
      console.log(`[SOURCING] yt-dlp process exited with code ${code}`);
      const results = [];
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.webpage_url || parsed.original_url) {
            results.push({ url: parsed.webpage_url || parsed.original_url, title: parsed.title || 'youtube_video' });
          }
        } catch(e) {}
      }
      const seenUrls = new Set();
      const uniqueResults = [];
      for (const res of results) {
        if (!seenUrls.has(res.url)) {
          seenUrls.add(res.url);
          uniqueResults.push(res);
        }
      }
      console.log(`[SOURCING] Scraped ${uniqueResults.length} videos from YouTube for "${finalQuery}"`);
      if (tmpCookieFile && require('fs').existsSync(tmpCookieFile)) {
        require('fs').unlinkSync(tmpCookieFile);
      }
      resolve(uniqueResults.slice(0, limit));
    });
  });
}

async function scrapeTikTokSearch(query, cookieString, limit = 1, extractMode = 'latest') {
  console.log(`[SOURCING] Booting authenticated headless browser for TikTok search: "${query}"`);
  const proxy = await getRandomProxy();
  const browserArgs = { headless: true };
  if (proxy) {
    browserArgs.proxy = { server: proxy };
    console.log(`[SOURCING] Using proxy for TikTok: ${proxy.split('@').pop()}`);
  }
  const browser = await Camoufox(browserArgs);
  const page = await browser.newPage();
  
  // Bandwidth Optimization: Block media and fonts since we only need metadata/URLs
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (['image', 'media', 'font'].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });
  
  const context = page.context();
  
  if (cookieString) {
    console.log(`[SOURCING] Injecting synced session cookies into browser...`);
    let cookies = [];
    try {
      const parsed = JSON.parse(cookieString);
      if (Array.isArray(parsed)) {
        cookies = parsed.map(c => ({
          name: String(c.name).trim(),
          value: String(c.value).trim(),
          url: 'https://www.tiktok.com'
        }));
      }
    } catch (e) {
      cookies = cookieString.split(';').map(c => {
        const idx = c.indexOf('=');
        if (idx === -1) return null;
        return { name: c.substring(0, idx).trim(), value: c.substring(idx + 1).trim(), url: 'https://www.tiktok.com' };
      }).filter(c => c && c.name && c.value);
    }
    for (const c of cookies) {
      try { await context.addCookies([c]); } catch(err) {}
    }
  }


  
  // Block heavy assets to prevent OOM crashes on small servers
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        route.abort();
    } else {
        route.continue();
    }
  });

  const results = [];
  
  try {
    const encodedQuery = encodeURIComponent(query);
    await page.goto(`https://www.tiktok.com/search/video?q=${encodedQuery}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // wait for videos to appear
    for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
        await page.waitForTimeout(1500);
    }
    
    const extractedVideos = await page.$$eval('a', anchors => {
      const results = [];
      anchors.forEach(a => {
        if (a.href && a.href.includes('/video/')) {
          results.push({ url: a.href, title: a.innerText || 'tiktok_video' });
        }
      });
      return results;
    });
    
    const seenUrls = new Set();
    const uniqueVideos = [];
    for (const video of extractedVideos) {
      const cleanUrl = video.url.split('?')[0]; // remove tracking params
      if (!seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);
        uniqueVideos.push({ url: cleanUrl, title: video.title.replace(/\n/g, ' ') });
      }
    }
    
    const finalResults = uniqueVideos.slice(0, limit);
    console.log(`[SOURCING] Scraped ${finalResults.length} videos for query "${query}"`);
    return finalResults;
  } catch (error) {
    console.error(`[SOURCING ERROR] Failed to scrape TikTok for "${query}":`, error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function scrapeYouTubeChannel(channelUrl, limit = 5, extractMode = 'latest', cookieString = null) {
  const proxy = await getRandomProxy();
  return new Promise((resolve, reject) => {
    let finalUrl = channelUrl;
    // Don't append /videos if the user already provided a specific tab or if we just want to let yt-dlp handle it
    // Artist channels often do not have a /videos tab.
    if (!finalUrl.includes('/videos') && !finalUrl.includes('?')) {
       // We won't force append /videos. We'll just let yt-dlp scrape the main page which includes recent uploads/releases.
    }
    console.log(`[SOURCING] Starting yt-dlp channel scrape for YouTube: "${finalUrl}"`);
    
    const args = [
      finalUrl,
      '--flat-playlist',
      '--dump-json',
      '--playlist-end', limit.toString(),
      '--extractor-args', 'youtube:player-client=android,web'
    ];
    if (proxy) args.push('--proxy', proxy);
    
    let tmpCookieFile = null;
    if (cookieString) {
      try {
        const crypto = require('crypto');
        const os = require('os');
        const path = require('path');
        const fs = require('fs');
        tmpCookieFile = path.join(os.tmpdir(), `ytchannel_cookies_${crypto.randomBytes(8).toString('hex')}.txt`);
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
        fs.writeFileSync(tmpCookieFile, netscapeCookies);
        args.push('--cookies', tmpCookieFile);
      } catch(e) {}
    }

    const ytDlpPath = require('youtube-dl-exec/src/constants').YOUTUBE_DL_PATH;
    const ytDlp = spawn(ytDlpPath, args);

    let output = '';
    ytDlp.stdout.on('data', (data) => { output += data.toString(); });
    ytDlp.stderr.on('data', (data) => { console.error(`[yt-dlp stderr] ${data.toString().trim()}`); });
    
    ytDlp.on('close', (code) => {
      console.log(`[SOURCING] yt-dlp process exited with code ${code}`);
      const results = [];
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.url || parsed.webpage_url || parsed.original_url) {
             const vUrl = parsed.url || parsed.webpage_url || parsed.original_url;
             results.push({ url: vUrl, title: parsed.title || 'youtube_audio' });
          }
        } catch(e) {}
      }
      console.log(`[SOURCING] Scraped ${results.length} audios from YouTube channel "${channelUrl}"`);
      if (tmpCookieFile && require('fs').existsSync(tmpCookieFile)) {
        require('fs').unlinkSync(tmpCookieFile);
      }
      resolve(results.slice(0, limit));
    });
  });
}

async function scrapeYouTubeArtistAudio(channelUrl, strategy = 'latest', limit = 1, cookieString = null) {
  const proxy = await getRandomProxy();
  return new Promise((resolve, reject) => {
    let finalUrl = channelUrl;
    if (!finalUrl.includes('/videos') && !finalUrl.includes('/releases') && !finalUrl.includes('?')) {
      finalUrl = finalUrl.replace(/\/$/, '') + '/releases';
    }
    console.log(`[SOURCING] Starting yt-dlp artist audio scrape for YouTube: "${finalUrl}"`);
    
    const args = [
      finalUrl,
      '--dump-json',
      '--extractor-args', 'youtube:player-client=android,web'
    ];
    
    if (strategy === 'latest') {
      args.push('--playlist-end', limit.toString());
      args.push('--flat-playlist');
    } else if (strategy === 'best') {
      args.push('--playlist-end', '20');
      // Remove flat-playlist to get full metadata including view_count for sorting
    }
    
    let tmpCookieFile = null;
    if (cookieString) {
      try {
        const crypto = require('crypto');
        const os = require('os');
        const path = require('path');
        const fs = require('fs');
        tmpCookieFile = path.join(os.tmpdir(), `ytartist_cookies_${crypto.randomBytes(8).toString('hex')}.txt`);
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
        fs.writeFileSync(tmpCookieFile, netscapeCookies);
        args.push('--cookies', tmpCookieFile);
      } catch(e) {}
    }

    const ytDlpPath = require('youtube-dl-exec/src/constants').YOUTUBE_DL_PATH;
    
    const runYtDlp = (useProxy) => {
      const currentArgs = [...args];
      if (useProxy && proxy) currentArgs.push('--proxy', proxy);
      
      const ytDlp = spawn(ytDlpPath, currentArgs);
      let output = '';
      let errOutput = '';
      
      ytDlp.stdout.on('data', (data) => { output += data.toString(); });
      ytDlp.stderr.on('data', (data) => { errOutput += data.toString(); console.error(`[yt-dlp stderr] ${data.toString().trim()}`); });
      
      ytDlp.on('close', (code) => {
        console.log(`[SOURCING] yt-dlp process exited with code ${code}`);
        
        if (code !== 0 && useProxy && proxy && (errOutput.includes('proxy') || errOutput.includes('ConnectTimeoutError'))) {
          console.warn(`[SOURCING] Proxy failed for artist audio scrape. Retrying without proxy...`);
          return runYtDlp(false);
        }
        
        let results = [];
        const lines = output.trim().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.url || parsed.webpage_url || parsed.original_url) {
               const vUrl = parsed.url || parsed.webpage_url || parsed.original_url;
               results.push({ url: vUrl, title: parsed.title || 'youtube_audio', view_count: parsed.view_count || 0 });
            }
          } catch(e) {}
        }
        
        if (strategy === 'best') {
          results.sort((a, b) => b.view_count - a.view_count);
        }
        
        results = results.map(r => ({ url: r.url, title: r.title }));
        
        const seenUrls = new Set();
        const uniqueResults = [];
        for (const res of results) {
          if (!seenUrls.has(res.url)) {
            seenUrls.add(res.url);
            uniqueResults.push(res);
          }
        }
        
        console.log(`[SOURCING] Scraped ${uniqueResults.length} audios from artist channel "${finalUrl}"`);
        if (tmpCookieFile && require('fs').existsSync(tmpCookieFile)) {
          require('fs').unlinkSync(tmpCookieFile);
        }
        resolve(uniqueResults.slice(0, limit));
      });
    };
    
    runYtDlp(true);
  });
}

module.exports = { scrapePinterestSearch, scrapeYouTubeSearch, scrapeTikTokSearch, scrapeYouTubeChannel, scrapeYouTubeArtistAudio };
