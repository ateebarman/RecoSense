const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema({
    config_id: { type: String, default: 'global_config', unique: true },
    // Engine Counters
    pending_interactions: { type: Number, default: 0 },
    likes_count: { type: Number, default: 0 },
    reviews_count: { type: Number, default: 0 },
    // Engine Status
    engine_status: { type: String, default: 'idle' }, // 'idle', 'running', 'success', 'failed'
    engine_mode: { type: String, default: 'infer' }, // 'infer', 'train'
    last_run_at: Date,
    last_finished_at: Date,
    last_msg: String,
    last_pid: Number,
    outLog: String,
    errLog: String
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
