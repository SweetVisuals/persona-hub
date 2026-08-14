const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateAutonomousStrategies() {
    console.log('[STRATEGISER] Waking up autonomous strategy engine...');
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.warn('[STRATEGISER] GROQ_API_KEY not set. Cannot run autonomous strategiser.');
        return;
    }

    try {
        const { data: personas, error } = await supabase.from('personas').select('*');
        if (error) throw error;

        for (const persona of personas) {
            console.log(`[STRATEGISER] Analyzing persona: ${persona.name}...`);
            
            // 1. Fetch recent analytics & past strategies to give context to the LLM
            const { data: pastStrategies } = await supabase.from('strategies').select('*').eq('persona_id', persona.id).order('created_at', { ascending: false }).limit(5);
            
            const prompt = `
You are an expert social media strategist and viral content creator for an artist named "${persona.name}".
Your goal is to generate a new, highly engaging content strategy that can go viral.
Learn from mistakes and try new angles (e.g. relatable quotes, unreleased song teases, aesthetic vibes).

Generate 1 TikTok slideshow strategy and 1 YouTube Shorts lyric video strategy.
Return ONLY a valid JSON object in this exact format, with no markdown formatting or extra text:
{
  "tiktok": {
    "name": "Strategy Name",
    "song": "Artist - Song Name",
    "postTitle": "Catchy caption title",
    "postDesc": "Caption description",
    "slides": ["Slide 1 text", "Slide 2 text", "Slide 3 text"]
  },
  "youtube": {
    "name": "Strategy Name",
    "description": "Description template for YouTube"
  }
}
            `;

            // 2. Call Groq LLM
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-70b-versatile',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                console.error(`[STRATEGISER] Groq API Error for ${persona.name}:`, await response.text());
                continue;
            }

            const result = await response.json();
            let jsonStr = result.choices[0].message.content.trim();
            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
            
            try {
                const parsed = JSON.parse(jsonStr);

                // Insert TikTok Strategy
                if (parsed.tiktok) {
                    await supabase.from('strategies').insert({
                        persona_id: persona.id,
                        platform: 'tiktok',
                        name: parsed.tiktok.name,
                        settings: {
                            song: parsed.tiktok.song,
                            postTitle: parsed.tiktok.postTitle,
                            postDesc: parsed.tiktok.postDesc,
                            autoHashtags: true,
                            maxHashtags: 15,
                            type: 'slideshow',
                            fontSize: 48,
                            aspectRatio: persona.aspect_ratio || '9:16',
                            slideCount: parsed.tiktok.slides.length,
                            slides: parsed.tiktok.slides
                        }
                    });
                    console.log(`[STRATEGISER] Created new TikTok strategy: ${parsed.tiktok.name}`);
                }

                // Insert YouTube Strategy
                if (parsed.youtube) {
                    await supabase.from('strategies').insert({
                        persona_id: persona.id,
                        platform: 'youtube',
                        name: parsed.youtube.name,
                        settings: {
                            type: 'youtube_shorts',
                            clickbaitTitle: true,
                            description: parsed.youtube.description,
                            autoHashtags: true,
                            maxHashtags: 15,
                            audioSource: 'latest'
                        }
                    });
                    console.log(`[STRATEGISER] Created new YouTube strategy: ${parsed.youtube.name}`);
                }
            } catch (jsonErr) {
                console.error(`[STRATEGISER] Failed to parse LLM JSON output for ${persona.name}:`, jsonStr);
            }
            
            // Rate limit: Max 20 requests per minute. We use 15 seconds to stay VERY safe (4 requests/min).
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
        
        console.log('[STRATEGISER] Engine cycle complete.');
    } catch (err) {
        console.error('[STRATEGISER] Engine error:', err);
    }
}

module.exports = { generateAutonomousStrategies };
