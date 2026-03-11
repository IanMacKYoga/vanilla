require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const actionType = process.argv[2];
const actionConfigStr = process.argv[3] || '{}';
const actionConfig = JSON.parse(actionConfigStr);
// The engine should also pass context to the runner (like the payload from the Trigger)
const triggerPayloadStr = process.argv[4] || '{}';
const triggerPayload = JSON.parse(triggerPayloadStr);

async function executeAction() {
    try {
        let result = {};

        switch (actionType) {

            // ══════════════════════════════════════════
            // ACTION: FULL DAILY AUTOPILOT (OPUS -> CLAUDE -> YOUTUBE)
            // ══════════════════════════════════════════
            case 'action_daily_autopilot':
                const sourceUrl = actionConfig.url || triggerPayload.url;
                const podcastContext = actionConfig.podcastName || triggerPayload.podcastName || 'General Podcast';
                if (!sourceUrl) throw new Error('No YouTube URL provided for Autopilot.');

                console.log(`\n[Autopilot] 🎬 STEP 1: Submitting to Opus Clip: ${sourceUrl}`);
                const submitRes = await axios.post('https://api.opus.pro/v1/clips', {
                    url: sourceUrl, max_clips: 3, max_duration: 30, format: 'vertical',
                    auto_captions: true, caption_style: 'bold_centered'
                }, { headers: { 'Authorization': `Bearer ${process.env.OPUS_CLIP_API_KEY}`, 'Content-Type': 'application/json' } });

                const jobId = submitRes.data.id || submitRes.data.job_id;
                console.log(`[Autopilot] ⏳ Opus Job ${jobId} submitted. Waiting for completion... (Takes ~10 mins)`);

                let clipData = null;
                while (!clipData) {
                    await new Promise(r => setTimeout(r, 60000));
                    try {
                        const check = await axios.get(`https://api.opus.pro/v1/clips/${jobId}`, {
                            headers: { 'Authorization': `Bearer ${process.env.OPUS_CLIP_API_KEY}` }
                        });
                        if (check.data.status === 'completed' && check.data.clips?.length > 0) {
                            clipData = check.data.clips.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0))[0];
                        } else if (check.data.status === 'failed') {
                            throw new Error('Opus Clip processing failed');
                        }
                    } catch (e) { console.error(`[Autopilot] Opus status check error, retrying...`); }
                }

                const finalClipUrl = clipData.download_url || clipData.url;
                const transcript = clipData.transcript || 'No transcript generated.';
                console.log(`[Autopilot] ✅ STEP 1 COMPLETE: Clip Extracted (Virality: ${clipData.virality_score})`);


                console.log(`\n[Autopilot] 🧠 STEP 2: Generating AI Metadata via Claude...`);
                const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
                const aiRes = await anthropic.messages.create({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 500,
                    system: 'You are a YouTube Shorts metadata expert. Respond ONLY with raw JSON: { "title": "", "description": "", "hashtags": "" }',
                    messages: [{ role: 'user', content: `Podcast: ${podcastContext}\nGenerate viral YouTube Shorts metadata strictly based on this transcript: ${transcript.slice(0, 3000)}` }]
                });

                const meta = JSON.parse(aiRes.content[0].text.trim());
                console.log(`[Autopilot] ✅ STEP 2 COMPLETE: Title Generated -> "${meta.title}"`);


                console.log(`\n[Autopilot] 🚀 STEP 3: Uploading to YouTube Shorts...`);
                const tempPath = path.join(__dirname, '..', `temp_upload_${Date.now()}.mp4`);
                const dlRes = await axios({ method: 'get', url: finalClipUrl, responseType: 'stream' });
                const writer = fs.createWriteStream(tempPath);
                dlRes.data.pipe(writer);
                await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });

                const oauth2 = new google.auth.OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET);
                oauth2.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
                const youtube = google.youtube({ version: 'v3', auth: oauth2 });

                const uploadRes = await youtube.videos.insert({
                    part: ['snippet', 'status'],
                    requestBody: {
                        snippet: {
                            title: meta.title.slice(0, 70), // YouTube Shorts exact limit
                            description: meta.description,
                            tags: (meta.hashtags || '').replace(/#/g, '').split(' ').filter(Boolean),
                            categoryId: '22',
                        },
                        status: { privacyStatus: 'public', madeForKids: false }
                    },
                    media: { body: fs.createReadStream(tempPath) }
                });

                fs.unlinkSync(tempPath);
                const publishedUrl = `https://youtube.com/shorts/${uploadRes.data.id}`;
                console.log(`[Autopilot] ✅ STEP 3 COMPLETE: Published to ${publishedUrl}`);

                result = {
                    status: 'PUBLISHED',
                    opus_job_id: jobId,
                    virality_score: clipData.virality_score,
                    generated_title: meta.title,
                    youtube_url: publishedUrl
                };
                break;

            // ══════════════════════════════════════════
            // MOCKS FOR TESTING
            // ══════════════════════════════════════════
            case 'mock_telegram':
                await new Promise(r => setTimeout(r, 1000));
                result = { message: `Simulated sending Telegram message to configured chat.` };
                break;

            case 'mock_web3_tx':
                await new Promise(r => setTimeout(r, 2000));
                result = { hash: '0xabc123...', status: 'confirmed', inputPayload: triggerPayload };
                break;

            default:
                throw new Error(`Unknown action type: ${actionType}`);
        }

        if (process.send) process.send({ type: 'SUCCESS', data: result });
        process.exit(0);

    } catch (error) {
        if (process.send) process.send({ type: 'ERROR', error: error.message });
        process.exit(1);
    }
}

executeAction();
