const { pool } = require('./db');
const { fork } = require('child_process');
const path = require('path');
const Parser = require('rss-parser');

const parser = new Parser({ customFields: { item: ['yt:videoId'] } });

function startEngine() {
    console.log('⚙️ Orchestration Engine started. Polling every 15 seconds...');

    setInterval(async () => {
        try {
            const workflowResult = await pool.query('SELECT * FROM workflows WHERE active = true');
            const workflows = workflowResult.rows;

            for (const workflow of workflows) {
                const triggerConfig = workflow.trigger_config ? JSON.parse(workflow.trigger_config) : {};
                const actionConfig = workflow.action_config ? JSON.parse(workflow.action_config) : {};

                let shouldExecute = false;
                let triggerPayload = {};

                try {
                    // 1. Evaluate Trigger Condition
                    if (workflow.trigger_type === 'trigger_youtube_rss') {
                        const TOP_PODCASTS = [
                            { name: 'Huberman Lab', channel_id: 'UC2D2CMWXMOVWx7giW1n3LIg', keywords: ['protocol', 'dopamine', 'neuroscience', 'brain'] },
                            { name: 'Diary of a CEO', channel_id: 'UCGq-a57w-aPwyi3pIPzRJauA', keywords: ['business', 'success', 'mindset', 'discipline'] },
                            { name: 'Impact Theory', channel_id: 'UCnYMOamNKLGVlJgRUbamveA', keywords: ['transformation', 'neuroscience', 'mindset', 'success'] },
                            { name: 'Jay Shetty On Purpose', channel_id: 'UCbV60AGIHKz3YOZ4Q8Zr5GA', keywords: ['purpose', 'positive', 'love', 'mental health', 'wisdom'] },
                            { name: 'School of Greatness', channel_id: 'UCKsP3v2JeT2hWI_HzkxWiMA', keywords: ['greatness', 'inspire', 'uplifting', 'success', 'habit'] },
                            { name: 'TED', channel_id: 'UCAuUUnT6oDeKwE6v1NGQxug', keywords: ['education', 'inspire', 'future', 'innovation', 'positive'] },
                            { name: 'Ali Abdaal', channel_id: 'UCOOae5nYA7VqaXzerajD0lg', keywords: ['productivity', 'study', 'habits', 'success', 'learning'] },
                            { name: 'Mel Robbins', channel_id: 'UCk2U-Oqn7RXf-ydPqfSxG5g', keywords: ['motivation', 'confidence', 'anxiety', 'mindset', 'positive'] },
                            { name: 'Simon Sinek', channel_id: 'UCp0RWM4ip4RBYDbb2k6C25Q', keywords: ['leadership', 'business', 'inspire', 'why', 'team'] },
                            { name: 'GaryVee', channel_id: 'UCctXZhXmG-kf3t66bYzp3A8', keywords: ['business', 'hustle', 'discipline', 'entrepreneur', 'positivity'] },
                        ];

                        // Loop through ALL top podcasts looking for a viral hit
                        for (const pod of TOP_PODCASTS) {
                            try {
                                const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${pod.channel_id}`;
                                const feed = await parser.parseURL(rssUrl);

                                // Check recent items in this feed
                                for (const item of feed.items.slice(0, 3)) {
                                    const titleLower = (item.title || '').toLowerCase();
                                    const matches = pod.keywords.some(kw => titleLower.includes(kw));

                                    if (matches) {
                                        const videoUrl = item.link || `https://www.youtube.com/watch?v=${item['yt:videoId']}`;

                                        // Make sure we haven't already processed this very video for THIS workflow
                                        const alreadyProcessedResult = await pool.query(`
                                            SELECT id FROM execution_logs 
                                            WHERE workflow_id = $1 AND output LIKE $2
                                        `, [workflow.id, `%${videoUrl}%`]);

                                        if (alreadyProcessedResult.rows.length === 0) {
                                            shouldExecute = true;
                                            triggerPayload = {
                                                url: videoUrl,
                                                title: item.title,
                                                podcastName: pod.name,
                                                publishedAt: item.pubDate
                                            };
                                            break; // Found one! Stop looking in this workflow tick, execute it immediately.
                                        }
                                    }
                                }
                                if (shouldExecute) break; // Break outer loop if we found a video to process
                            } catch (e) {
                                console.error(`[Engine] Failed to scan podcast ${pod.name}:`, e.message);
                            }
                        }
                    }
                    else if (workflow.trigger_type === 'mock_random') {
                        shouldExecute = Math.random() < 0.1; // 10% chance
                    }
                    else if (workflow.trigger_type === 'always') {
                        shouldExecute = true;
                    }

                    // 2. Execute Action via child_process.fork
                    if (shouldExecute) {
                        console.log(`\n[Engine] ⚡ Trigger met for Workflow #${workflow.id} '${workflow.title}'... Forking execution.`);
                        console.log(`[Engine] Payload:`, triggerPayload);

                        const workerPath = path.join(__dirname, 'workers', 'runner.js');

                        // Pass the generic Action Type, Action Config, and dynamic Trigger Payload
                        const worker = fork(workerPath, [
                            workflow.action_type,
                            JSON.stringify(actionConfig),
                            JSON.stringify(triggerPayload)
                        ]);

                        worker.on('message', async (msg) => {
                            if (msg.type === 'SUCCESS') {
                                console.log(`[Engine] ✅ Action succeeded for Workflow #${workflow.id}`);
                                // Store triggerPayload URL in output so we know not to run it again
                                await logExecution(workflow.id, 'success', { ...msg.data, trigger_url: triggerPayload.url });
                            } else if (msg.type === 'ERROR') {
                                console.error(`[Engine] ❌ Action failed for Workflow #${workflow.id}:`, msg.error);
                                await logExecution(workflow.id, 'failed', { error: msg.error, trigger_url: triggerPayload.url });
                            }
                        });

                        worker.on('error', (err) => console.error(`[Engine] 💥 Fork error Workflow #${workflow.id}:`, err));

                        await pool.query("UPDATE workflows SET last_run = NOW() WHERE id = $1", [workflow.id]);
                    }
                } catch (err) {
                    console.error(`[Engine] Error evaluating workflow #${workflow.id}: ${err.message}`);
                }
            }
        } catch (dbErr) {
            console.error('[Engine] DB Polling error:', dbErr.message);
        }
    }, 15000); // Poll every 15 seconds
}

async function logExecution(workflowId, status, output) {
    try {
        await pool.query(`
            INSERT INTO execution_logs (workflow_id, status, output)
            VALUES ($1, $2, $3)
        `, [workflowId, status, JSON.stringify(output || {})]);
    } catch (err) {
        console.error('[Engine] Failed to log execution:', err.message);
    }
}

module.exports = { startEngine };
