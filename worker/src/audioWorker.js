const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { scrapeAudio } = require('./scraper');
const { generateSubtitles } = require('./transcriber');
const { uploadToR2 } = require('./storage');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
// For worker processes running locally or with ANON key, we might need to rely on RLS policies 
// allowing update. Assuming worker has access or we use a service_role key if available.
// If it's anon key, ensure the table has public access or update policies, 
// but since the worker is just doing tasks, we proceed with anon key.
const supabase = createClient(supabaseUrl, supabaseKey);

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

function parseSrt(srtPath) {
  if (!fs.existsSync(srtPath)) return '';
  const content = fs.readFileSync(srtPath, 'utf8');
  // Simple SRT parser: remove timestamps and numbers
  const lines = content.split('\n');
  const lyrics = [];
  let isText = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      isText = false;
      continue;
    }
    if (trimmed.includes('-->')) {
      isText = true;
      continue;
    }
    if (!isNaN(trimmed)) {
      continue;
    }
    if (isText) {
      lyrics.push(trimmed);
    }
  }
  return lyrics.join('\n');
}

async function processAudioExtractions() {
  console.log('[AUDIO_WORKER] Checking for pending audio extractions...');
  try {
    const { data: jobs, error } = await supabase
      .from('audio_extractions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5);

    if (error) throw error;
    if (!jobs || jobs.length === 0) return;

    console.log(`[AUDIO_WORKER] Found ${jobs.length} pending audio jobs.`);

    for (const job of jobs) {
      console.log(`[AUDIO_WORKER] Processing job ${job.id} (${job.source_type})`);
      
      // Mark as processing
      await supabase.from('audio_extractions').update({ status: 'processing' }).eq('id', job.id);

      let localAudioPath = null;
      let finalMp3Url = null;
      let lyrics = '';

      try {
        let targetUrl = job.source_url;

        // Get cookie if available for bypass (used for channel scrape and audio download)
        let cookieString = null;
        if (job.persona_id) {
          const { data: accounts } = await supabase.from('social_accounts').select('session_cookie')
            .eq('persona_id', job.persona_id).in('platform', ['youtube', 'google']).eq('status', 'active').limit(1);
          if (accounts && accounts[0] && accounts[0].session_cookie && !accounts[0].session_cookie.trim().startsWith('{')) {
            cookieString = accounts[0].session_cookie;
          }
        }

        // Fallback: try to get ANY active youtube/google cookie from the DB
        if (!cookieString) {
          const { data: globalAccounts } = await supabase.from('social_accounts').select('session_cookie')
            .in('platform', ['youtube', 'google']).eq('status', 'active').limit(1);
          if (globalAccounts && globalAccounts[0] && globalAccounts[0].session_cookie && !globalAccounts[0].session_cookie.trim().startsWith('{')) {
            cookieString = globalAccounts[0].session_cookie;
          }
        }

        // Resolve artist channel to video URL if necessary
        if (job.source_type === 'artist_latest' || job.source_type === 'artist_best') {
          const { scrapeYouTubeArtistAudio } = require('./sourcing');
          const strategy = job.source_type === 'artist_best' ? 'best' : 'latest';
          console.log(`[AUDIO_WORKER] Resolving artist channel ${job.source_url} using ${strategy} strategy...`);
          
          const scraped = await scrapeYouTubeArtistAudio(job.source_url, strategy, 1, cookieString);
          if (!scraped || scraped.length === 0) {
            throw new Error(`No releases found on channel: ${job.source_url}`);
          }
          targetUrl = scraped[0].url;
          console.log(`[AUDIO_WORKER] Resolved ${job.source_url} to video: ${scraped[0].title} (${targetUrl})`);
        }

        if (job.source_type === 'youtube' || job.source_type === 'artist_latest' || job.source_type === 'artist_best') {
          // 1. Download YouTube to MP3 (passing session cookies)
          localAudioPath = await scrapeAudio(targetUrl, cookieString);
          // 2. Upload MP3 to R2 so UI can play it
          finalMp3Url = await uploadToR2(localAudioPath, 'audio_studio');
        } else if (job.source_type === 'upload') {
          // 1. Download from R2 temp location to local
          const ext = path.extname(job.source_url) || '.mp3';
          localAudioPath = path.join(os.tmpdir(), `upload_${crypto.randomBytes(4).toString('hex')}${ext}`);
          await downloadFile(job.source_url, localAudioPath);
          finalMp3Url = job.source_url; // Already uploaded by frontend
        } else {
          throw new Error('Invalid source_type');
        }

        // 3. Transcribe audio to subtitles
        console.log(`[AUDIO_WORKER] Transcribing audio: ${localAudioPath}`);
        const srtPath = await generateSubtitles(localAudioPath);
        
        // 4. Parse SRT to simple lyrics
        lyrics = parseSrt(srtPath);
        console.log(`[AUDIO_WORKER] Extraction complete for job ${job.id}`);

        // Cleanup local files
        if (fs.existsSync(localAudioPath)) fs.unlinkSync(localAudioPath);
        if (fs.existsSync(srtPath)) fs.unlinkSync(srtPath);

        // Update DB
        await supabase.from('audio_extractions').update({
          status: 'completed',
          mp3_url: finalMp3Url,
          lyrics: lyrics
        }).eq('id', job.id);

      } catch (err) {
        console.error(`[AUDIO_WORKER] Job ${job.id} failed:`, err);
        // Cleanup if failed
        if (localAudioPath && fs.existsSync(localAudioPath)) {
          fs.unlinkSync(localAudioPath);
        }
        await supabase.from('audio_extractions').update({
          status: 'error',
          error_message: err.message
        }).eq('id', job.id);
      }
    }
  } catch (err) {
    console.error(`[AUDIO_WORKER] Main loop error:`, err);
  }
}

module.exports = { processAudioExtractions };
