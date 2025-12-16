const express = require("express");
const {
  getRecommendations,
} = require("../controllers/recommendationController");

const router = express.Router();

router.get("/", getRecommendations);
const retrainManager = require('../recommender/retrainManager');
const requireAdmin = require('../middleware/requireAdmin');

router.post('/retrain', requireAdmin, async (req, res) => {
  try {
    const started = await retrainManager.startRetrain();
    if (started && started.started === false && started.reason === 'already_running') {
      return res.status(409).json({ message: 'Retrain already running' });
    }
    return res.status(202).json({ message: 'Retrain started' });
  } catch (e) {
    console.error('Retrain error:', e);
    return res.status(500).json({ message: 'Retrain failed to start' });
  }
});

router.get('/retrain/status', async (req, res) => {
  try {
    const st = await retrainManager.getStatus();
    return res.json(st);
  } catch (e) {
    console.error('Status error:', e);
    return res.status(500).json({ message: 'Failed to get retrain status' });
  }
});

router.post('/retrain/clean', requireAdmin, async (req, res) => {
  try {
    const result = await retrainManager.cleanRecs();
    return res.json(result);
  } catch (e) {
    console.error('Clean error:', e);
    return res.status(500).json({ message: 'Failed to clean recs' });
  }
});

// Lightweight model run (infer-only) - can be triggered manually by admins
router.post('/model/run', requireAdmin, async (req, res) => {
  try {
    const started = await retrainManager.startModelRun();
    if (started && started.started === false && started.reason === 'already_running') {
      return res.status(409).json({ message: 'Model run already running' });
    }
    return res.status(202).json({ message: 'Model run started' });
  } catch (e) {
    console.error('Model run error:', e);
    return res.status(500).json({ message: 'Model run failed to start' });
  }
});

router.get('/model/counters', requireAdmin, async (req, res) => {
  try {
    const c = retrainManager.getCounters();
    return res.json(c);
  } catch (e) {
    console.error('Counter status error:', e);
    return res.status(500).json({ message: 'Failed to get counters' });
  }
});

router.post('/model/counters/reset', requireAdmin, async (req, res) => {
  try {
    const c = retrainManager.resetCounters();
    return res.json(c);
  } catch (e) {
    console.error('Counter reset error:', e);
    return res.status(500).json({ message: 'Failed to reset counters' });
  }
});

module.exports = router;
