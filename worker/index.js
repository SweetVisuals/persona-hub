require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const { verifyAccountCookie, postVideo } = require('./src/poster');
const { scrapeVideo } = require('./src/scraper');
const { uploadToR2, deleteFromR2 } = require('./src/storage');
const { scrapePinterestSearch, scrapeYouTubeSearch, scrapeTikTokSearch, scrapeYouTubeChannel } = require('./src/sourcing');
const { scrapeAudio } = require('./src/scraper');
const { generateSubtitles } = require('./src/transcriber');
const { downloadImage } = require('./src/imageScraper');
const { processPendingLogins, processPendingOAuth } = require('./src/authWorker');
const { processAudioExtractions } = require('./src/audioWorker');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function dbLog(personaId, level, message) {
  console.log(`[${level.toUpperCase()}] ${message}`);
  try {
    await supabase.from('logs').insert({
      persona_id: personaId,
      level: level,
      message: message
    });
  } catch(e) {
    console.error('Failed to write log to DB:', e.message);
  }
}

dbLog(null, 'info', 'Worker initializing Automation & Analytics Engine...');

// --- 0. Auth Worker Cron Job (Runs every 5 minutes to check for new logins) ---
cron.schedule('*/5 * * * *', async () => {
  try {
    await processPendingLogins();
    await processPendingOAuth();
  } catch (err) {
    console.error('Auth Worker Error:', err);
  }
});
processPendingLogins(); // Run once on startup
processPendingOAuth();

// --- 0.5 Audio Extraction Cron Job (Runs every minute) ---
cron.schedule('* * * * *', async () => {
  try {
    await processAudioExtractions();
  } catch (err) {
    console.error('Audio Worker Error:', err);
  }
});
processAudioExtractions(); // Run once on startup

// --- 1. Analytics Tracking Cron Job (Runs every 24 hours at midnight) ---
cron.schedule('0 0 * * *', async () => {
  dbLog(null, 'info', 'Running daily analytics scrape...');
  try {
    const { data: accounts, error } = await supabase.from('social_accounts').select('*').eq('status', 'active');
    if (error) throw error;

    for (const acc of accounts) {
      dbLog(acc.persona_id, 'info', `Checking account ${acc.username} on ${acc.platform}...`);
      const result = await verifyAccountCookie(acc.platform, acc.session_cookie);
      
      if (result.success) {
        await supabase.from('analytics_history').insert({
          social_account_id: acc.id,
          followers: result.followers,
          date: new Date().toISOString()
        });
        await supabase.from('social_accounts').update({ followers: result.followers }).eq('id', acc.id);
        dbLog(acc.persona_id, 'success', `Successfully logged ${result.followers} followers for ${acc.username}`);
      } else {
        dbLog(acc.persona_id, 'error', `Cookie expired for ${acc.username}. Updating status to error.`);
        await supabase.from('social_accounts').update({ status: 'error' }).eq('id', acc.id);
      }
    }
  } catch (err) {
    dbLog(null, 'error', `Error in analytics loop: ${err.message}`);
  }
});

async function getOrCreateFolder(name, parentId, personaId) {
  let query = supabase.from('files').select('id').eq('type', 'folder').eq('name', name);
  if (personaId) {
    query = query.eq('persona_id', personaId);
  } else {
    query = query.is('persona_id', null);
  }

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    query = query.is('parent_id', null);
  }
  
  const { data } = await query.single();
  if (data) return data.id;
  
  const { data: newFolder, error } = await supabase.from('files').insert({
    type: 'folder',
    name: name,
    persona_id: personaId,
    parent_id: parentId || null
  }).select('id').single();
  
  if (error) throw error;
  return newFolder.id;
}

// --- 2. Autonomous Sourcing Engine ---
async function runAutonomousSourcing() {
  dbLog(null, 'info', 'Waking up Autonomous Sourcing Engine...');
  try {
    const { data: sources, error } = await supabase.from('scraping_sources').select('*, personas(name)');
    if (error) throw error;
    
    let foundAny = false;
    for (const source of sources) {
      if (['pinterest', 'youtube', 'tiktok', 'youtube_music'].includes(source.platform) && source.url) {
        
        // --- FREQUENCY CHECK LOGIC ---
        if (source.frequency === 'on_demand') continue;
        
        if (source.last_run_at) {
          const lastRun = new Date(source.last_run_at).getTime();
          const now = Date.now();
          const elapsed = now - lastRun;
          
          if (source.frequency === 'hourly' && elapsed < 60 * 60 * 1000) continue;
          if (source.frequency === 'daily' && elapsed < 24 * 60 * 60 * 1000) continue;
          if (source.frequency === '5min' && elapsed < 5 * 60 * 1000) continue;
          // extract_all runs every loop (2 mins) until limit reached
        }
        
        // For extract_all, ensure we don't exceed 250 files per query
        if (source.frequency === 'extract_all') {
          const { count } = await supabase.from('files').select('*', { count: 'exact', head: true })
            .eq('source_url', source.url); // Count of files originating from this source
          if (count >= 250) {
             continue; // Cap reached
          }
        }

        foundAny = true;
        
        // Map youtube_music to youtube for cookies
        const cookiePlatform = source.platform === 'youtube_music' ? 'youtube' : source.platform;

        // Try to get a valid cookie if platform requires it (for global sources, we'll try to find any active account)
        let cookieString = null;
        let matchedAccount = null;
        
        let platformFilters = [cookiePlatform];
        if (cookiePlatform === 'youtube') platformFilters = ['youtube', 'google'];
        
        if (source.persona_id) {
          const { data: accounts } = await supabase
            .from('social_accounts')
            .select('id, session_cookie')
            .eq('persona_id', source.persona_id)
            .in('platform', platformFilters)
            .eq('status', 'active')
            .limit(1);
          const account = accounts && accounts[0] ? accounts[0] : null;
          if (account) {
             cookieString = account.session_cookie;
             matchedAccount = account;
          }
        } else {
          // If global, try to get ANY active cookie for the platform just to bypass blocks if needed
          const { data: accounts } = await supabase
            .from('social_accounts')
            .select('id, session_cookie')
            .in('platform', platformFilters)
            .eq('status', 'active')
            .limit(1);
          const account = accounts && accounts[0] ? accounts[0] : null;
          if (account) {
             cookieString = account.session_cookie;
             matchedAccount = account;
          }
        }
        
        // Don't use OAuth tokens for scraping
        if (cookieString && cookieString.trim().startsWith('{')) {
          cookieString = null;
        }

        if (!cookieString) {
           dbLog(source.persona_id, 'info', `No active ${cookiePlatform} account linked (or OAuth token found). Attempting anonymous scrape for "${source.url}"`);
        }
        
        dbLog(source.persona_id, 'info', `Sourcing new content for query: "${source.url}"`);
        
        let scrapedUrls = [];
        const extractMode = source.extract_mode || 'latest';
        
        if (source.platform === 'pinterest') {
          scrapedUrls = await scrapePinterestSearch(source.url, cookieString, 150);
        } else if (source.platform === 'youtube') {
          // If the user inputs a channel URL under regular youtube, treat it as channel scrape
          if (source.url.includes('/channel/') || source.url.includes('/@') || source.url.startsWith('@')) {
             scrapedUrls = await scrapeYouTubeChannel(source.url, 15, extractMode, cookieString);
          } else {
             scrapedUrls = await scrapeYouTubeSearch(source.url, 15, extractMode, cookieString);
          }
        } else if (source.platform === 'tiktok') {
          scrapedUrls = await scrapeTikTokSearch(source.url, cookieString, 15, extractMode);
        } else if (source.platform === 'youtube_music') {
          if (source.url.includes('/channel/') || source.url.includes('/@') || source.url.startsWith('@')) {
            scrapedUrls = await scrapeYouTubeChannel(source.url, 15, extractMode, cookieString);
          } else {
            scrapedUrls = await scrapeYouTubeSearch(source.url, 15, extractMode, cookieString);
          }
        }
        
        if (scrapedUrls.length > 0) {
            dbLog(source.persona_id, 'info', `Found ${scrapedUrls.length} media items. Processing and organizing...`);
            
            const rootFolderName = source.personas ? source.personas.name : 'Global Sourcing';
            const rootId = await getOrCreateFolder(rootFolderName, null, source.persona_id);
            const platformName = source.platform === 'youtube_music' ? 'Youtube_music' : source.platform.charAt(0).toUpperCase() + source.platform.slice(1);
            const platformId = await getOrCreateFolder(platformName, rootId, source.persona_id);
            
            let queryId = platformId; // Default for non-video

            if (source.platform === 'youtube' || source.platform === 'tiktok') {
              let targetFolderId = platformId;
              if (source.url.toLowerCase().includes('#shorts')) {
                targetFolderId = await getOrCreateFolder('Shorts', platformId, source.persona_id);
              }
              queryId = targetFolderId; // For videos, don't nest under query
            } else {
              queryId = await getOrCreateFolder(source.url, platformId, source.persona_id);
            }
            
            let addedCount = 0;
            for (const item of scrapedUrls) {
              const itemUrl = item.url;
              const safeTitle = (item.title && item.title.trim().length > 0 && item.title !== 'pinterest_image')
                ? item.title.replace(/[^a-z0-9]/gi, '_').substring(0, 40).toLowerCase() 
                : source.platform;
              
              const { data: existing } = await supabase.from('files').select('id').eq('source_url', itemUrl).single();
              if (existing) continue;
              
              try {
                  let localPath;
                  let r2Folder;
                  let ext;
                  let srtR2Url = null;
                  
                  if (source.platform === 'pinterest') {
                    localPath = await downloadImage(itemUrl, cookieString);
                    r2Folder = 'images';
                    ext = 'jpg';
                  } else if (source.platform === 'youtube_music' || (source.platform === 'youtube' && (source.url.includes('/channel/') || source.url.includes('/@') || source.url.startsWith('@')))) {
                    localPath = await scrapeAudio(itemUrl, cookieString);
                    r2Folder = 'music';
                    ext = 'mp3';
                    
                    // Transcribe original music right after downloading
                    try {
                       const srtPath = await generateSubtitles(localPath);
                       srtR2Url = await uploadToR2(srtPath, 'music/subtitles');
                       fs.unlinkSync(srtPath);
                    } catch(err) {
                       console.error(`Transcription failed for ${itemUrl}:`, err);
                    }
                  } else {
                    localPath = await scrapeVideo(itemUrl, cookieString);
                    r2Folder = 'raw_footage';
                    ext = 'mp4';
                  }
                  
                  const r2Url = await uploadToR2(localPath, r2Folder);
                  const sizeInBytes = fs.statSync(localPath).size;
                  const fileSizeMB = sizeInBytes > 1024 * 1024 
                    ? (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB' 
                    : (sizeInBytes / 1024).toFixed(2) + ' KB';
                  
                  await supabase.from('files').insert({
                    type: 'file',
                    name: `${safeTitle}_${Date.now()}.${ext}`,
                    persona_id: source.persona_id,
                    parent_id: queryId,
                    size: fileSizeMB,
                    url: r2Url,
                    source_url: itemUrl,
                    metadata: { search_query: source.url, srt_url: srtR2Url }
                  });
                  
                  fs.unlinkSync(localPath);
                  addedCount++;
              } catch(e) {
                  console.error(`Failed to process ${source.platform} item ${itemUrl}:`, e.message);
              }
            }
            dbLog(source.persona_id, 'success', `Organized ${addedCount} new items into /${rootFolderName}/${platformName}/${source.url}`);
        } else {
            dbLog(source.persona_id, 'info', `No items returned for "${source.url}". Cookies might be expired or search failed.`);
            if (matchedAccount && matchedAccount.id && source.platform !== 'youtube' && source.platform !== 'youtube_music') {
               await supabase.from('social_accounts').update({ status: 'error' }).eq('id', matchedAccount.id);
            }
        }
        
        // Update last_run_at
        await supabase.from('scraping_sources').update({ last_run_at: new Date().toISOString() }).eq('id', source.id);
      }
    }
    
    if (!foundAny) {
       dbLog(null, 'info', 'No active sourcing pipelines found in database.');
    }
    
    dbLog(null, 'info', 'Autonomous Sourcing Engine cycle complete.');
  } catch (err) {
    dbLog(null, 'error', `Sourcing engine error: ${err.message}`);
  }
}

cron.schedule('*/2 * * * *', runAutonomousSourcing);

// Run once on startup so we don't have to wait 4 hours!
setTimeout(runAutonomousSourcing, 5000);

// --- 3. Generator Engine (Builds Slideshows & Videos based on Strategies) ---
const EditorEngine = require('./src/editor');
const { processVideo } = require('./src/videoProcessor');
const { spawn } = require('child_process');

function shuffleArray(array) {
  let curId = array.length;
  while (0 !== curId) {
    let randId = Math.floor(Math.random() * curId);
    curId -= 1;
    let tmp = array[curId];
    array[curId] = array[randId];
    array[randId] = tmp;
  }
  return array;
}

async function runGeneratorEngine() {
  dbLog(null, 'info', 'Waking up Generator Engine...');
  try {
    const { data: strategies, error } = await supabase.from('strategies').select('*, personas(*)');
    if (error) throw error;

    for (const strategy of strategies) {
      if (strategy.settings && strategy.settings.type === 'slideshow') {
        const persona = strategy.personas;
        dbLog(persona.id, 'info', `Running strategy: "${strategy.name}"...`);

        // Get pinterest files
        const { data: files } = await supabase
          .from('files')
          .select('id, url')
          .eq('persona_id', persona.id)
          .not('source_url', 'is', null);

        const slideCount = strategy.settings.slides ? strategy.settings.slides.length : 0;
        if (!files || files.length < slideCount || slideCount === 0) {
          dbLog(persona.id, 'warn', `Not enough images to fulfill strategy: "${strategy.name}"`);
          continue;
        }

        // Try to find a unique sequence
        let uniqueSequenceFound = false;
        let selectedFiles = [];
        let sequenceIds = [];

        for (let attempt = 0; attempt < 20; attempt++) {
          const shuffled = shuffleArray([...files]);
          selectedFiles = shuffled.slice(0, slideCount);
          sequenceIds = selectedFiles.map(f => f.id);

          const { data: existingSeq } = await supabase
            .from('generated_sequences')
            .select('id')
            .eq('persona_id', persona.id)
            .eq('strategy_id', strategy.id)
            .contains('image_sequence', sequenceIds)
            .single();

          if (!existingSeq) {
            uniqueSequenceFound = true;
            break;
          }
        }

        if (!uniqueSequenceFound) {
          dbLog(persona.id, 'warn', `Could not find a unique un-used sequence for "${strategy.name}". Skipped.`);
          continue;
        }

        dbLog(persona.id, 'info', `Baking ${slideCount} slides using unique sequence...`);
        
        const editor = new EditorEngine(persona, strategy);
        const imageUrls = selectedFiles.map(f => f.url);
        
        try {
          // 1. Bake
          const localPaths = await editor.generateTikTokSlideshow(imageUrls);
          
          // 2. Upload
          const uploadedUrls = [];
          for (let i = 0; i < localPaths.length; i++) {
            const r2Url = await uploadToR2(localPaths[i], 'slides');
            uploadedUrls.push(r2Url);
            fs.unlinkSync(localPaths[i]); // Cleanup
          }
          
          // 3. Create .slide file in File Browser
          const rootFolderId = await getOrCreateFolder(persona.name, null, persona.id);
          const slidesFolderId = await getOrCreateFolder('Slideshows', rootFolderId, persona.id);
          
          const title = strategy.settings.postTitle || strategy.name;
          let description = strategy.settings.postDesc || '';
          
          if (strategy.settings.autoHashtags) {
            const numHashtags = strategy.settings.maxHashtags || 15;
            const hashtagPool = ['#viral', '#fyp', '#aesthetic', '#foryou', '#trending', '#explore', '#photography', '#art', '#style', '#vibes', '#love', '#mood', '#inspiration', '#creative', '#edit', '#cinematic', '#nature', '#city', '#luxury', '#night'];
            const shuffledTags = shuffleArray([...hashtagPool]).slice(0, numHashtags);
            if (shuffledTags.length > 0) {
              description += '\n\n' + shuffledTags.join(' ');
            }
          }

          await supabase.from('files').insert({
            type: 'file',
            name: `${strategy.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.slide`,
            persona_id: persona.id,
            parent_id: slidesFolderId,
            size: 'Slide Deck',
            metadata: {
              type: 'slideshow',
              strategy_id: strategy.id,
              aspectRatio: strategy.settings?.aspectRatio || persona.aspect_ratio || '9:16',
              title: title,
              description: description,
              song: strategy.settings.song || 'Original Sound',
              slides: uploadedUrls
            }
          });

          // 4. Log Sequence
          await supabase.from('generated_sequences').insert({
            persona_id: persona.id,
            strategy_id: strategy.id,
            image_sequence: sequenceIds
          });
          
          // 4b. Auto-schedule Posting if an active TikTok account exists
          const { data: accounts } = await supabase.from('social_accounts').select('id, platform').eq('persona_id', persona.id).eq('status', 'active');
          if (accounts && accounts.length > 0) {
             const tiktokAcc = accounts.find(a => a.platform === 'tiktok');
             if (tiktokAcc) {
                // Determine a random posting time within the next 4 hours
                const scheduleTime = new Date(Date.now() + Math.random() * (4 * 60 * 60 * 1000)).toISOString();
                
                await supabase.from('automation_tasks').insert({
                   persona_id: persona.id,
                   social_account_id: tiktokAcc.id,
                   platform: 'tiktok',
                   content: uploadedUrls[0], // Note: For slides, we should ideally compile to mp4 or post multiple. For now passing first image.
                   type: 'post_video',
                   status: 'scheduled',
                   scheduled_for: scheduleTime
                });
                dbLog(persona.id, 'info', `Auto-scheduled post for slide deck to TikTok at ${scheduleTime}`);
             }
          }

          // 5. Cleanup original images from R2 and Supabase
          for (const file of selectedFiles) {
            await deleteFromR2(file.url);
            await supabase.from('files').delete().eq('id', file.id);
          }
          
          dbLog(persona.id, 'success', `Generated .slide file for "${strategy.name}" in File Browser! Cleared ${selectedFiles.length} original images to save storage.`);
        } catch (e) {
          dbLog(persona.id, 'error', `Failed to generate slideshow for "${strategy.name}": ${e.message}`);
        }
      } else if (strategy.settings && (strategy.settings.type === 'video' || strategy.settings.type === 'shorts' || strategy.settings.type === 'reels')) {
        const persona = strategy.personas;
        dbLog(persona.id, 'info', `Running Video Strategy: "${strategy.name}"...`);

        // Get random raw footage
        const { data: videoFiles } = await supabase
          .from('files')
          .select('id, url')
          .eq('persona_id', persona.id)
          .like('name', '%.mp4');

        // Get random music
        const { data: audioFiles } = await supabase
          .from('files')
          .select('id, url')
          .eq('persona_id', persona.id)
          .like('name', '%.mp3');

        if (!videoFiles || videoFiles.length === 0 || !audioFiles || audioFiles.length === 0) {
          dbLog(persona.id, 'warn', `Missing video or music for strategy: "${strategy.name}"`);
          continue;
        }

        const bgVideo = shuffleArray([...videoFiles])[0];
        const music = shuffleArray([...audioFiles])[0];

        dbLog(persona.id, 'info', `Selected background video and original music. Assembling...`);

        try {
           const outPath = path.join('/tmp', `edit_${Date.now()}.mp4`);
           const audioChunkPath = path.join('/tmp', `audio_chunk_${Date.now()}.mp3`);
           
           // Step 1: Download and crop random 15-second chunk of music
           const startOffset = Math.floor(Math.random() * 30); // Random offset up to 30s
           await new Promise((resolve, reject) => {
              const ff = spawn('ffmpeg', ['-i', music.url, '-ss', startOffset.toString(), '-t', '15', '-c', 'copy', audioChunkPath]);
              ff.on('close', (code) => code === 0 ? resolve() : reject(new Error('Audio trim failed')));
           });

           // Step 2: Transcribe 15s chunk
           let srtPath = null;
           try {
              srtPath = await generateSubtitles(audioChunkPath);
           } catch(e) {
              console.error('Transcription failed', e);
           }

           // Step 3: Process video (merge bg, audio, srt)
           const targetAspect = strategy.settings?.aspectRatio || persona.aspect_ratio || '9:16';
           await processVideo(bgVideo.url, outPath, audioChunkPath, srtPath, targetAspect);

           // Step 4: Upload final video
           const finalUrl = await uploadToR2(outPath, 'edits');

           // Create .mp4 file in File Browser
           const rootFolderId = await getOrCreateFolder(persona.name, null, persona.id);
           const editsFolderId = await getOrCreateFolder('Edits', rootFolderId, persona.id);

           const title = strategy.settings.postTitle || strategy.name;
           let description = strategy.settings.postDesc || '';
           if (strategy.settings.autoHashtags) {
             const hashtagPool = ['#viral', '#fyp', '#aesthetic', '#foryou', '#trending', '#explore', '#creative', '#edit', '#cinematic'];
             description += '\n\n' + shuffleArray([...hashtagPool]).slice(0, 10).join(' ');
           }

           await supabase.from('files').insert({
             type: 'file',
             name: `${strategy.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.mp4`,
             persona_id: persona.id,
             parent_id: editsFolderId,
             size: (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2) + ' MB',
             url: finalUrl,
             metadata: {
               type: 'video',
               strategy_id: strategy.id,
               aspectRatio: targetAspect,
               title: title,
               description: description
             }
           });

           // Auto-schedule Posting to TikTok
           const { data: vidAccounts } = await supabase.from('social_accounts').select('id, platform').eq('persona_id', persona.id).eq('status', 'active');
           if (vidAccounts && vidAccounts.length > 0) {
              const tiktokAcc = vidAccounts.find(a => a.platform === 'tiktok');
              if (tiktokAcc) {
                 // Schedule randomly in next 2 hours
                 const scheduleTime = new Date(Date.now() + Math.random() * (2 * 60 * 60 * 1000)).toISOString();
                 
                 await supabase.from('automation_tasks').insert({
                    persona_id: persona.id,
                    social_account_id: tiktokAcc.id,
                    platform: 'tiktok',
                    content: finalUrl,
                    type: 'post_video',
                    status: 'scheduled',
                    scheduled_for: scheduleTime
                 });
                 dbLog(persona.id, 'info', `Auto-scheduled video post to TikTok at ${scheduleTime}`);
              }
           }

           // Cleanup
           if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
           if (fs.existsSync(audioChunkPath)) fs.unlinkSync(audioChunkPath);
           if (srtPath && fs.existsSync(srtPath)) fs.unlinkSync(srtPath);
           
           dbLog(persona.id, 'success', `Generated final video edit for "${strategy.name}" in File Browser!`);
        } catch(e) {
           dbLog(persona.id, 'error', `Failed to generate video for "${strategy.name}": ${e.message}`);
        }
      } else if (strategy.settings && strategy.settings.type === 'lyrics') {
        const persona = strategy.personas;
        dbLog(persona.id, 'info', `Running Lyrics Strategy: "${strategy.name}"...`);
        // TODO: Implement lyric video generation from verified lyrics
      }
    }
  } catch (err) {
    dbLog(null, 'error', `Generator engine error: ${err.message}`);
  }
}

cron.schedule('*/5 * * * *', runGeneratorEngine);
setTimeout(runGeneratorEngine, 10000);

const https = require('https');

async function downloadFileFromUrl(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// --- 4. Main Worker Loop (Polling for new posting tasks) ---
async function startWorkerLoop() {
  dbLog(null, 'info', 'Started polling loop for automation tasks...');
  
  setInterval(async () => {
    try {
      const now = new Date().toISOString();
      const { data: tasks, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_for', now)
        .limit(1);

      if (error) throw error;

      if (tasks && tasks.length > 0) {
        const task = tasks[0];
        
        // Mark as processing
        await supabase.from('automation_tasks').update({ status: 'processing' }).eq('id', task.id);
        
        if (task.platform === 'scrape') {
           dbLog(task.persona_id, 'info', `Found scrape task: ${task.content}`);
           
           try {
             // 1. Scrape video
             const localPath = await scrapeVideo(task.content);
             dbLog(task.persona_id, 'info', `Video scraped locally: ${localPath}`);
             
             // 2. Upload to R2
             dbLog(task.persona_id, 'info', `Uploading to Cloudflare R2...`);
             const r2Url = await uploadToR2(localPath, 'raw_footage');
             
             // 3. Save to Supabase files table
             const fileSizeMB = (fs.statSync(localPath).size / (1024 * 1024)).toFixed(2) + ' MB';
             
             await supabase.from('files').insert({
               type: 'file',
               name: `scraped_${Date.now()}.mp4`,
               persona_id: task.persona_id,
               size: fileSizeMB,
               url: r2Url
             });
             
             // Cleanup local
             fs.unlinkSync(localPath);
             
             dbLog(task.persona_id, 'success', `Scraped and saved to File Browser! URL: ${r2Url}`);
             await supabase.from('automation_tasks').update({ status: 'sent' }).eq('id', task.id);
           } catch(e) {
             dbLog(task.persona_id, 'error', `Scrape failed: ${e.message}`);
             await supabase.from('automation_tasks').update({ status: 'error' }).eq('id', task.id);
           }
        } else {
           // Standard posting
           dbLog(task.persona_id, 'info', `Found scheduled task for ${task.platform}`);
           
           try {
             // Fetch Account details to get cookie
             const { data: accountData } = await supabase.from('social_accounts').select('session_cookie, username').eq('id', task.social_account_id).single();
             if (!accountData || !accountData.session_cookie) {
               throw new Error(`Account missing or no session cookie found for account id ${task.social_account_id}`);
             }

             // Download the video locally
             dbLog(task.persona_id, 'info', `Downloading video from R2 for posting...`);
             const os = require('os');
             const localVideoPath = require('path').join(os.tmpdir(), `post_${Date.now()}.mp4`);
             await downloadFileFromUrl(task.content, localVideoPath);

             // Call poster
             const description = `Posted via Persona Hub!`; // Add custom logic for parsing task description if available
             const result = await postVideo(task.platform, accountData.session_cookie, localVideoPath, description);

             if (result.success) {
               dbLog(task.persona_id, 'success', `Successfully posted video to ${task.platform}!`);
               await supabase.from('automation_tasks').update({ status: 'sent' }).eq('id', task.id);
             } else {
               throw new Error(result.error || "Unknown posting error");
             }

             // Cleanup
             if (fs.existsSync(localVideoPath)) fs.unlinkSync(localVideoPath);

           } catch(err) {
             dbLog(task.persona_id, 'error', `Posting task failed: ${err.message}`);
             await supabase.from('automation_tasks').update({ status: 'error' }).eq('id', task.id);
           }
        }
      }
    } catch (err) {
      dbLog(null, 'error', `Polling error: ${err.message}`);
    }
  }, 10000); // 10 seconds
}

startWorkerLoop();
dbLog(null, 'info', 'Worker startup complete. Waiting for jobs.');
