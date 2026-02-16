const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const Recommendation = require('../models/recommendationModel');
const SystemConfig = require('../models/systemConfigModel');

const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

async function readStatus() {
  try {
    const config = await SystemConfig.findOne({ config_id: 'global_config' });
    if (config) {
      return {
        status: config.engine_status,
        mode: config.engine_mode,
        pid: config.last_pid,
        started_at: config.last_run_at,
        finished_at: config.last_finished_at,
        msg: config.last_msg,
        outLog: config.outLog,
        errLog: config.errLog
      };
    }
  } catch (e) {
    console.error('Failed to read status from DB:', e);
  }
  return { status: 'idle' };
}

async function writeStatus(s) {
  try {
    await SystemConfig.findOneAndUpdate(
      { config_id: 'global_config' },
      {
        engine_status: s.status,
        engine_mode: s.mode || 'train',
        last_pid: s.pid,
        last_run_at: s.started_at,
        last_finished_at: s.finished_at,
        last_msg: s.msg,
        outLog: s.outLog,
        errLog: s.errLog
      },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error('Failed to write status to DB:', e);
  }
}

async function readCounters() {
  try {
    const config = await SystemConfig.findOne({ config_id: 'global_config' });
    if (config) {
      return {
        pending: config.pending_interactions || 0,
        likes: config.likes_count || 0,
        reviews: config.reviews_count || 0
      };
    }
  } catch (e) {
    console.error('Failed to read counters from DB:', e);
  }
  return { pending: 0, likes: 0, reviews: 0 };
}

async function writeCounters(c) {
  try {
    await SystemConfig.findOneAndUpdate(
      { config_id: 'global_config' },
      {
        pending_interactions: c.pending,
        likes_count: c.likes,
        reviews_count: c.reviews
      },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.error('Failed to write counters to DB:', e);
  }
}

async function startRetrain() {
  const cur = await readStatus();
  if (cur.status === 'running') return { started: false, reason: 'already_running', status: cur };

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outLog = path.join(LOG_DIR, `retrain-${ts}.out.log`);
  const errLog = path.join(LOG_DIR, `retrain-${ts}.err.log`);

  await writeStatus({ status: 'running', pid: null, started_at: new Date(), outLog, errLog, mode: 'train' });

  // Prefer configured PYTHON_EXECUTABLE, else try local .venv, else fall back to 'python'
  let pythonExec = process.env.PYTHON_EXECUTABLE || null;
  if (!pythonExec) {
    // Prefer repo-root .venv first (two levels up from recommender dir), then backend .venv, then system python
    const repoVenv = path.join(__dirname, '..', '..', '.venv');
    const backendVenv = path.join(__dirname, '..', '.venv');
    const candidates = [
      path.join(repoVenv, 'Scripts', 'python.exe'),
      path.join(repoVenv, 'bin', 'python'),
      path.join(backendVenv, 'Scripts', 'python.exe'),
      path.join(backendVenv, 'bin', 'python'),
      'python'
    ];
    for (const c of candidates) {
      try { if (fs.existsSync(c)) { pythonExec = c; break; } } catch (e) {}
    }
    if (!pythonExec) pythonExec = 'python';
  }
  // write diagnostic info
  try { fs.writeFileSync(outLog, `PYTHON_EXEC=${pythonExec}\n`); } catch (e) {}

  let py;
  try {
    py = spawn(pythonExec, [path.join(__dirname, 'train_lightfm.py')], { cwd: path.join(__dirname, '..'), detached: false, env: process.env });
  } catch (err) {
    const finished_at = new Date().toISOString();
    writeStatus({ status: 'failed', pid: null, started_at: readStatus().started_at || null, finished_at, msg: String(err), outLog, errLog });
    return { started: false, status: 'failed', msg: String(err) };
  }

  const outStream = fs.createWriteStream(outLog, { flags: 'a' });
  const errStream = fs.createWriteStream(errLog, { flags: 'a' });
  if (py.stdout) py.stdout.pipe(outStream);
  if (py.stderr) py.stderr.pipe(errStream);

  // update status immediately and return (fire-and-forget)
  writeStatus({ 
    status: 'running', 
    pid: py.pid, 
    started_at: new Date(), 
    outLog, 
    errLog,
    mode: 'train'
  });
  console.log(`[RetrainManager] Started Python retrain process (PID: ${py.pid})`);
  console.log(`[RetrainManager] Logs writing to: ${outLog}`);

  py.stdout.on('data', (data) => console.log(`[Retrain-Py-Out]: ${data.toString().trim()}`));
  py.stderr.on('data', (data) => console.error(`[Retrain-Py-Err]: ${data.toString().trim()}`));

  py.on('exit', async (code) => {
    console.log(`[RetrainManager] Python process exited with code ${code}`);
    const finished_at = new Date();
    const status = code === 0 ? 'success' : 'failed';
    const msg = `exit:${code}`;
    const curStatus = await readStatus();
    await writeStatus({ 
      status, 
      pid: null, 
      started_at: curStatus.started_at, 
      finished_at, 
      msg, 
      outLog, 
      errLog,
      mode: 'train'
    });
    
    // If success, sync file to DB
    if (code === 0) {
        syncFileToDb(outLog);
    }
  });
  py.on('error', async (err) => {
    console.error(`[RetrainManager] Python process error:`, err);
    const finished_at = new Date();
    const curStatus = await readStatus();
    await writeStatus({ 
      status: 'failed', 
      pid: null, 
      started_at: curStatus.started_at, 
      finished_at, 
      msg: String(err), 
      outLog, 
      errLog,
      mode: 'train'
    });
  });

  return { started: true, pid: py.pid };
}

async function syncFileToDb(outLog) {
    try {
        const RECS_FILE = path.join(__dirname, '..', 'data', 'lightfm_recs.json');
        if (!fs.existsSync(RECS_FILE)) return;
        const data = JSON.parse(fs.readFileSync(RECS_FILE, 'utf8'));
        const userIds = Object.keys(data);
        console.log(`[RetrainManager] Syncing ${userIds.length} users from file to DB...`);
        
        for (const uid of userIds) {
            await Recommendation.findOneAndUpdate(
                { user_id: uid },
                { recommendations: data[uid] },
                { upsert: true }
            );
        }
        if (outLog) fs.appendFileSync(outLog, `Synced ${userIds.length} users to DB\n`);
    } catch (e) {
        console.error('Failed to sync recs file to DB:', e);
    }
}

async function startModelRun() {
  // lightweight run that avoids training heavy models - runs inference/generation only
  const cur = await readStatus();
  if (cur.status === 'running') return { started: false, reason: 'already_running', status: cur };

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outLog = path.join(LOG_DIR, `modelrun-${ts}.out.log`);
  const errLog = path.join(LOG_DIR, `modelrun-${ts}.err.log`);

  // Prefer a fast Node.js-based infer-only recompute (no heavy Python dependency)
  try {
    await writeStatus({ status: 'running', pid: null, started_at: new Date(), outLog, errLog, mode: 'infer' });
    console.log('[RetrainManager] Starting Quick Re-run (Node.js mode)...');
    await runInferInNode(outLog, errLog);
    console.log('[RetrainManager] Quick Re-run completed successfully.');
    const curStatus = await readStatus();
    await writeStatus({ status: 'success', pid: null, started_at: curStatus.started_at, finished_at: new Date(), msg: 'ok', outLog, errLog, mode: 'infer' });
    await writeCounters({ pending: 0, likes: 0, reviews: 0 });
    return { started: true };
  } catch (err) {
    const finished_at = new Date().toISOString();
    writeStatus({ status: 'failed', pid: null, started_at: readStatus().started_at || null, finished_at, msg: String(err), outLog, errLog, mode: 'infer' });
    // fallback: try spawn python as last resort
    let pythonExec = process.env.PYTHON_EXECUTABLE || null;
    if (!pythonExec) {
      const repoVenv = path.join(__dirname, '..', '..', '.venv');
      const backendVenv = path.join(__dirname, '..', '.venv');
      const candidates = [
        path.join(repoVenv, 'Scripts', 'python.exe'),
        path.join(repoVenv, 'bin', 'python'),
        path.join(backendVenv, 'Scripts', 'python.exe'),
        path.join(backendVenv, 'bin', 'python'),
        'python'
      ];
      for (const c of candidates) {
        try { if (fs.existsSync(c)) { pythonExec = c; break; } } catch (e) {}
      }
      if (!pythonExec) pythonExec = 'python';
    }
    try {
      const py = spawn(pythonExec, [path.join(__dirname, 'train_lightfm.py'), '--infer-only'], { cwd: path.join(__dirname, '..'), detached: false, env: process.env });
      const outStream = fs.createWriteStream(outLog, { flags: 'a' });
      const errStream = fs.createWriteStream(errLog, { flags: 'a' });
      if (py.stdout) py.stdout.pipe(outStream);
      if (py.stderr) py.stderr.pipe(errStream);
      writeStatus({ status: 'running', pid: py.pid, started_at: new Date().toISOString(), outLog, errLog, mode: 'infer' });
      py.on('exit', (code) => {
        const f = new Date().toISOString();
        const s = code === 0 ? 'success' : 'failed';
        writeStatus({ status: s, pid: null, started_at: readStatus().started_at || null, finished_at: f, msg: `exit:${code}`, outLog, errLog, mode: 'infer' });
        if (code === 0) writeCounters({ pending: 0, likes: 0, reviews: 0 });
      });
      py.on('error', (e) => {
        const f = new Date().toISOString();
        writeStatus({ status: 'failed', pid: null, started_at: readStatus().started_at || null, finished_at: f, msg: String(e), outLog, errLog, mode: 'infer' });
      });
      return { started: true, pid: py.pid };
    } catch (e) {
      return { started: false, status: 'failed', msg: String(e) };
    }
  }
}

async function incrementCounter(type, amount = 1, threshold = null) {
  const c = await readCounters();
  c.pending = (c.pending || 0) + amount;
  if (type === 'like') c.likes = (c.likes || 0) + amount;
  if (type === 'review') c.reviews = (c.reviews || 0) + amount;
  await writeCounters(c);
  const th = threshold || Number(process.env.MODEL_RUN_THRESHOLD || 10);
  if ((c.pending || 0) >= th) {
    // trigger a model run (non-training) and reset counters on success
    startModelRun().catch((e) => console.error('Model run failed to start:', e));
  }
  return c;
}

function getCounters() { return readCounters(); }

function resetCounters() { writeCounters({ pending: 0, likes: 0, reviews: 0 }); return readCounters(); }

async function getStatus() {
  const s = readStatus();
  if (s.status === 'running' && s.pid) {
    try {
      process.kill(s.pid, 0);
      // process exists
      return s;
    } catch (e) {
      // process not found; mark as failed
      const finished_at = new Date().toISOString();
      const msg = 'process_not_found';
      const ns = { status: 'failed', pid: null, started_at: s.started_at || null, finished_at, msg, outLog: s.outLog, errLog: s.errLog };
      writeStatus(ns);
      return ns;
    }
  }
  return s;
}

async function cleanRecs(db) {
  // db is a mongoose connection or model; accept optional model access
  // Read rec file and remove users not present in users collection
  if (!fs.existsSync(RECS_FILE)) return { cleaned: 0, reason: 'no_file' };
  const raw = fs.readFileSync(RECS_FILE, 'utf-8');
  let obj = {};
  try { obj = JSON.parse(raw); } catch (e) { return { cleaned: 0, reason: 'invalid_json' }; }
  const userIds = Object.keys(obj || {});
  const User = require('../models/userModel');
  const existing = await User.find({ user_id: { $in: userIds } }).lean().exec();
  const keep = new Set(existing.map((u) => u.user_id));
  let removed = 0;
  for (const u of userIds) {
    if (!keep.has(u)) { delete obj[u]; removed++; }
  }
  if (removed > 0) fs.writeFileSync(RECS_FILE, JSON.stringify(obj, null, 2));
  return { cleaned: removed };
}

async function runInferInNode(outLog, errLog) {
  // This implements the fast popularity-based per-user recompute without Python.
  fs.writeFileSync(outLog, 'Starting runInferInNode...\n'); // DEBUG
  const REVIEWS_FILE = path.join(__dirname, '..', 'data', 'filtered_smartphone_reviews.json');
  const META_FILE = path.join(__dirname, '..', 'data', 'filtered_smartphone_metadata.json');
  if (!fs.existsSync(REVIEWS_FILE)) throw new Error('Reviews file not found');
  let reviewsRaw = fs.readFileSync(REVIEWS_FILE, 'utf8');
  fs.appendFileSync(outLog, 'Reviews read...\n'); // DEBUG
  let reviews = [];
  try { reviews = JSON.parse(reviewsRaw); } catch (e) {
    // try jsonlines
    reviews = reviewsRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
  }
  fs.appendFileSync(outLog, `Parsed ${reviews.length} reviews...\n`); // DEBUG
  // Build interactions
  const interactions = [];
  for (const r of reviews) {
    if (!r.user_id || !r.asin) continue;
    const rating = (r.overall || r.rating || 1.0);
    interactions.push({ user_id: String(r.user_id), asin: String(r.asin), rating: Number(rating) });
  }
  fs.appendFileSync(outLog, `Built ${interactions.length} interactions from file...\n`); // DEBUG

  // include likes from users in DB
  // include likes from users in DB
  const mongoose = require('mongoose');
  if (mongoose.connection && mongoose.connection.readyState === 1) {
      fs.appendFileSync(outLog, `Using existing Mongoose connection (state: ${mongoose.connection.readyState})...\n`);
      console.log('[RetrainManager] Using existing DB connection for user likes...');
      
      try {
          const db = mongoose.connection.db;
          // Use a shorter timeout since we are already connected
          const users = await Promise.race([
             db.collection('users').find({}, { projection: { user_id: 1, likedProducts: 1 } }).toArray(),
             new Promise((_, reject) => setTimeout(() => reject(new Error('MONGOOSE_QUERY_TIMEOUT')), 8000))
          ]);
          
          fs.appendFileSync(outLog, `Found ${users.length} users in DB...\n`);
          console.log(`[RetrainManager] Found ${users.length} users in DB.`);
          for (const u of users) {
              const uid = String(u.user_id);
              for (const a of (u.likedProducts || [])) interactions.push({ user_id: uid, asin: String(a), rating: 4.0 });
          }
      } catch (dbErr) {
          fs.appendFileSync(outLog, `DB Query failed: ${dbErr}\n`);
          console.error(`[RetrainManager] DB Query failed: ${dbErr}`);
      }
  } else {
      fs.appendFileSync(outLog, `Mongoose not connected (state: ${mongoose.connection ? mongoose.connection.readyState : 'null'}), skipping DB likes...\n`);
      console.warn('[RetrainManager] Mongoose not connected, skipping DB likes.');
  }
  // compute popularity
  const counts = {};
  for (const it of interactions) counts[it.asin] = (counts[it.asin] || 0) + 1;
  const popular = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([asin, c]) => asin);
  fs.appendFileSync(outLog, `computed popularity...\n`); // DEBUG

  // metadata
  let meta = {};
  try {
    if (fs.existsSync(META_FILE)) {
      const md = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
      for (const r of md) {
        const key = String(r.parent_asin || r.asin);
        meta[key] = {
          title: r.title,
          price: r.price,
          category: r.main_category,
          images: r.imageURLHighRes || r.images || []
        };
      }
    }
  } catch (e) { /* ignore */ }

  // per-user recs
  const userIds = Array.from(new Set(interactions.map(i => i.user_id)));
  const N = 20;
  fs.appendFileSync(outLog, `Saving recs for ${userIds.length} users to DB...\n`);
  
  for (const u of userIds) {
    const seen = new Set(interactions.filter(i => i.user_id === u).map(i => i.asin));
    const out = [];
    let rank = 1;
    for (const asin of popular) {
      if (seen.has(asin)) continue;
      const entry = { rank, asin, score: counts[asin] || 0 };
      if (meta[asin]) Object.assign(entry, meta[asin]);
      out.push(entry);
      rank += 1;
      if (rank > N) break;
    }
    
    // Save to DB
    await Recommendation.findOneAndUpdate(
        { user_id: u },
        { recommendations: out },
        { upsert: true }
    );
  }
  
  // also write file for backward compatibility/debugging
  // fs.writeFileSync(RECS_FILE, JSON.stringify(recs, null, 2), 'utf8');
  
  try { fs.appendFileSync(outLog, `Node infer completed: Synced ${userIds.length} users to DB\n`); } catch (e) {}
}

module.exports = { startRetrain, startModelRun, getStatus, cleanRecs, incrementCounter, getCounters, resetCounters };
