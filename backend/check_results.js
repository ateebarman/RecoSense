const mongoose = require('mongoose');
require('dotenv').config();
const Recommendation = require('./models/recommendationModel');
const SystemConfig = require('./models/systemConfigModel');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Recommendation.countDocuments();
        const config = await SystemConfig.findOne({ config_id: 'global_config' });
        
        console.log('--- RECOSENSE DB CHECK ---');
        console.log('Total Recommendation Profiles:', count);
        console.log('Current System Status:', config ? config.engine_status : 'N/A');
        console.log('Last Error/Msg:', config ? config.last_msg : 'N/A');
        console.log('Pending Interactions:', config ? config.pending_interactions : 'N/A');
        
        if (count > 0) {
            const sample = await Recommendation.findOne();
            console.log(`Sample User (${sample.user_id}) Recs:`, sample.recommendations.length);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
check();
