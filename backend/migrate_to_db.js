const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Recommendation = require('./models/recommendationModel');
const SystemConfig = require('./models/systemConfigModel');

const RECS_FILE = path.join(__dirname, 'data', 'lightfm_recs.json');
const STATUS_FILE = path.join(__dirname, 'recommender', 'retrain_status.json');
const COUNTER_FILE = path.join(__dirname, 'recommender', 'retrain_counters.json');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for migration...');

        // 1. Migrate Status & Counters
        let status = { status: 'idle' };
        if (fs.existsSync(STATUS_FILE)) {
            status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
        }
        
        let counters = { pending: 0, likes: 0, reviews: 0 };
        if (fs.existsSync(COUNTER_FILE)) {
            counters = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'));
        }

        console.log('Migrating System Config (Status & Counters)...');
        await SystemConfig.findOneAndUpdate(
            { config_id: 'global_config' },
            {
                engine_status: status.status || 'idle',
                engine_mode: status.mode || 'infer',
                last_pid: status.pid,
                last_run_at: status.started_at,
                last_finished_at: status.finished_at,
                last_msg: status.msg,
                outLog: status.outLog,
                errLog: status.errLog,
                pending_interactions: counters.pending || 0,
                likes_count: counters.likes || 0,
                reviews_count: counters.reviews || 0
            },
            { upsert: true }
        );

        // 2. Migrate Recommendations
        if (fs.existsSync(RECS_FILE)) {
            const recsData = JSON.parse(fs.readFileSync(RECS_FILE, 'utf8'));
            const userIds = Object.keys(recsData);
            console.log(`Migrating recommendations for ${userIds.length} users...`);
            
            let count = 0;
            for (const uid of userIds) {
                await Recommendation.findOneAndUpdate(
                    { user_id: uid },
                    { recommendations: recsData[uid] },
                    { upsert: true }
                );
                count++;
                if (count % 100 === 0) console.log(`Progress: ${count}/${userIds.length}...`);
            }
            console.log(`Successfully migrated ${count} users.`);
        } else {
            console.log('No existing recommendations file found to migrate.');
        }

        console.log('Migration Complete!');
    } catch (error) {
        console.error('Migration Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
