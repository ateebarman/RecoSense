const mongoose = require('mongoose');
require('dotenv').config();
const retrainManager = require('./recommender/retrainManager');

async function simulate() {
    try {
        console.log('--- RecoSense Interaction Simulator ---');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const threshold = Number(process.env.MODEL_RUN_THRESHOLD || 10);
        console.log(`Target Threshold: ${threshold} interactions.`);

        // Reset counters first to be sure
        console.log('Resetting counters for clean test...');
        await retrainManager.resetCounters();

        console.log(`Pushing ${threshold} dummy interactions...`);
        for (let i = 1; i <= threshold; i++) {
            console.log(`Interaction #${i} triggered...`);
            // We use 'like' as it's the simplest trigger
            const current = await retrainManager.incrementCounter('like', 1);
            console.log(`Pending: ${current.pending}/${threshold}`);
            
            if (current.pending >= threshold) {
                console.log('!!! THRESHOLD REACHED !!!');
                console.log('The engine should now start automatically below:');
            }
            
            // Wait a tiny bit between hits
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('\nSimulation script finished sending interactions.');
        console.log('Monitoring engine progress...');
        
        for (let j = 0; j < 60; j++) {
            const status = await retrainManager.getStatus();
            process.stdout.write(`\rCurrent Status: ${status.status} [${j}s]`);
            if (status.status === 'success' || status.status === 'failed') {
                console.log(`\nEngine finished with status: ${status.status}`);
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error('Simulation Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected.');
    }
}

simulate();
