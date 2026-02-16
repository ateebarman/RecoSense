const mongoose = require('mongoose');
require('dotenv').config();
const retrainManager = require('./recommender/retrainManager');

async function runHeavyRetrain() {
    try {
        console.log('--- RecoSense Heavy LightFM Retrain ---');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        console.log('Triggering Heavy Retrain (Python LightFM)...');
        const res = await retrainManager.startRetrain();
        
        if (res.started) {
            console.log(`Successfully started retrain process (PID: ${res.pid})`);
            console.log('Monitoring logs... Watch your backend terminal for [Retrain-Py-Out] messages.');
            
            // Monitor status in loop
            for (let i = 0; i < 60; i++) {
                const status = await retrainManager.getStatus();
                process.stdout.write(`\rStatus: ${status.status} | Time elapsed: ${i}s`);
                
                if (status.status === 'success') {
                    console.log('\n✅ Retrain completed successfully! Waiting for final sync...');
                    await new Promise(r => setTimeout(r, 5000));
                    break;
                }
                if (status.status === 'failed') {
                    console.error('\n❌ Retrain failed! Check the logs in backend/recommender/logs/ for details.');
                    await new Promise(r => setTimeout(r, 2000));
                    break;
                }
                await new Promise(r => setTimeout(r, 1000));
            }
        } else {
            console.warn('Could not start retrain:', res.reason);
        }

    } catch (error) {
        console.error('Heavy Retrain Trigger Script Failed:', error);
    } finally {
        console.log('Final safety wait (10s)...');
        await new Promise(r => setTimeout(r, 10000));
        await mongoose.disconnect();
        console.log('\nDisconnected.');
    }
}

runHeavyRetrain();
