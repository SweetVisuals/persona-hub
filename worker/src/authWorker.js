const { Camoufox } = require('camoufox-js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function dbLog(personaId, level, message) {
  console.log(`[AUTH ${level.toUpperCase()}] ${message}`);
  try {
    await supabase.from('logs').insert({ persona_id: personaId, level, message });
  } catch(e) { }
}

async function processPendingLogins() {
  const { data: accounts, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('status', 'pending_login');

  if (error || !accounts || accounts.length === 0) return;

  for (const acc of accounts) {
    dbLog(acc.persona_id, 'info', `Attempting headless login for ${acc.platform} account: ${acc.username}`);
    
    // In our UI, we temporarily saved the password in session_cookie during the pending_login phase
    let extractedPassword = acc.session_cookie;

    const password = extractedPassword;
    if (!password) {
      await supabase.from('social_accounts').update({ status: 'error' }).eq('id', acc.id);
      continue;
    }

    let browser;
    try {
      browser = await Camoufox({
        headless: true
      });
      const page = await browser.newPage();
      const context = page.context();

      let loginSuccess = false;
      let extractedHandle = null;

      if (acc.platform === 'tiktok') {
        // TikTok Headless Login
        await page.goto('https://www.tiktok.com/login/phone-or-email/email', { waitUntil: 'networkidle', timeout: 30000 });
        
        // Fill credentials
        await page.waitForSelector('input[name="username"]', { timeout: 10000 });
        await page.fill('input[name="username"]', acc.username);
        await page.fill('input[type="password"]', password);
        
        await page.waitForTimeout(1000);
        await page.click('button[type="submit"]');

        // Wait for successful login indicator (e.g. avatar or upload button)
        try {
          await page.waitForSelector('a[href*="/upload"]', { timeout: 30000 });
          loginSuccess = true;
          
          try {
            await page.goto('https://www.tiktok.com/profile', { waitUntil: 'networkidle' });
            const handleElement = await page.$('[data-e2e="user-title"]');
            if (handleElement) {
              extractedHandle = await handleElement.innerText();
              if (extractedHandle.startsWith('@')) extractedHandle = extractedHandle.substring(1);
            }
          } catch(err) {
            console.log("Could not extract TikTok handle", err);
          }
        } catch (e) {
          console.error("Login verification failed (possibly captcha).", e.message);
          const os = require('os');
          await page.screenshot({ path: require('path').join(os.tmpdir(), `tiktok_login_failed_${acc.id}.png`) });
        }

      } else if (acc.platform === 'pinterest') {
        // Pinterest Headless Login
        await page.goto('https://www.pinterest.com/login/', { waitUntil: 'networkidle', timeout: 30000 });
        
        await page.waitForSelector('input[name="id"]', { timeout: 10000 });
        await page.fill('input[name="id"]', acc.username);
        await page.fill('input[name="password"]', password);
        
        await page.waitForTimeout(1000);
        await page.click('button[type="submit"]');

        try {
          await page.waitForSelector('[data-test-id="header-profile"]', { timeout: 30000 });
          loginSuccess = true;
          
          try {
            await page.goto('https://www.pinterest.com/', { waitUntil: 'networkidle', timeout: 20000 });
            const profileLink = await page.$('a[href^="/"][href*="/_saved/"], a[href^="/"][href*="/boards/"]');
            if (profileLink) {
               const href = await profileLink.getAttribute('href');
               const parts = href.split('/').filter(Boolean);
               if (parts.length > 0) extractedHandle = parts[0];
            }
          } catch(err) {
            console.log("Could not extract Pinterest handle", err);
          }
        } catch (e) {
          console.error("Pinterest Login verification failed.", e.message);
        }
      } else {
        // Placeholder for other platforms
        dbLog(acc.persona_id, 'warn', `Headless login not fully implemented for ${acc.platform}. Marking as error.`);
      }

      if (loginSuccess) {
        const cookies = await context.cookies();
        const cookieStr = JSON.stringify(cookies);
        
        const updatePayload = { 
          status: 'active',
          session_cookie: cookieStr 
        };
        
        if (extractedHandle && extractedHandle.trim().length > 0) {
          updatePayload.username = extractedHandle.trim();
        }

        await supabase.from('social_accounts').update(updatePayload).eq('id', acc.id);
        
        dbLog(acc.persona_id, 'success', `Successfully logged into ${acc.platform} and saved session cookies.`);
      } else {
        await supabase.from('social_accounts').update({ status: 'captcha_required' }).eq('id', acc.id);
        dbLog(acc.persona_id, 'error', `Failed to login to ${acc.platform}. Captcha might be required.`);
      }
    } catch (err) {
      dbLog(acc.persona_id, 'error', `Exception during login to ${acc.platform}: ${err.message}`);
      await supabase.from('social_accounts').update({ status: 'error' }).eq('id', acc.id);
    } finally {
      if (browser) await browser.close();
    }
  }
}


async function processPendingOAuth() {
  const { data: accounts, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('status', 'pending_oauth');

  if (error || !accounts || accounts.length === 0) return;

  for (const acc of accounts) {
    dbLog(acc.persona_id, 'info', `Attempting OAuth token exchange for ${acc.platform}`);
    try {
      const payload = JSON.parse(acc.session_cookie);
      const code = payload.code;

      if (!code) throw new Error("No OAuth code provided");

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          code: code,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: 'postmessage',
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(`Google OAuth Error: ${tokenData.error_description || tokenData.error}`);
      }

      await supabase.from('social_accounts').update({
        status: 'active',
        session_cookie: JSON.stringify(tokenData)
      }).eq('id', acc.id);

      dbLog(acc.persona_id, 'success', `Successfully connected ${acc.platform} via OAuth.`);
    } catch (err) {
      dbLog(acc.persona_id, 'error', `OAuth exchange failed for ${acc.platform}: ${err.message}`);
      await supabase.from('social_accounts').update({ status: 'error' }).eq('id', acc.id);
    }
  }
}

module.exports = { processPendingLogins, processPendingOAuth };
