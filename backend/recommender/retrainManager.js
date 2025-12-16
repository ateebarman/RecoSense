const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const STATUS_FILE = path.join(__dirname, 'retrain_status.json');
const LOG_DIR = path.join(__dirname, 'logs');
const RECS_FILE = path.join(__dirname, '..', 'data', 'lightfm_recs.json');
const COUNTER_FILE = path.join(__dirname, 'retrain_counters.json');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function readStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to read retrain status:', e);
  }
  return { status: 'idle' };
}

function writeStatus(s) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(s, null, 2));
  } catch (e) {
    console.error('Failed to write retrain status:', e);
  }
}

function readCounters() {
  try {
    if (fs.existsSync(COUNTER_FILE)) return JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to read counters:', e);
  }
  return { pending: 0, likes: 0, reviews: 0 };
}

function writeCounters(c) {
  try {
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(c, null, 2));
  } catch (e) {
    console.error('Failed to write counters:', e);
  }
}

async function startRetrain() {
  const cur = readStatus();
  if (cur.status === 'running') return { started: false, reason: 'already_running', status: cur };

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outLog = path.join(LOG_DIR, `retrain-${ts}.out.log`);
  const errLog = path.join(LOG_DIR, `retrain-${ts}.err.log`);

  writeStatus({ status: 'running', pid: null, started_at: new Date().toISOString(), outLog, errLog });

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
  writeStatus({ status: 'running', pid: py.pid, started_at: new Date().toISOString(), outLog, errLog });

  py.on('exit', (code) => {
    const finished_at = new Date().toISOString();
    const status = code === 0 ? 'success' : 'failed';
    const msg = `exit:${code}`;
    writeStatus({ status, pid: null, started_at: readStatus().started_at || null, finished_at, msg, outLog, errLog });
  });
  py.on('error', (err) => {
    const finished_at = new Date().toISOString();
    writeStatus({ status: 'failed', pid: null, started_at: readStatus().started_at || null, finished_at, msg: String(err), outLog, errLog });
  });

  return { started: true, pid: py.pid };
}

async function startModelRun() {
  // lightweight run that avoids training heavy models - runs inference/generation only
  const cur = readStatus();
  if (cur.status === 'running') return { started: false, reason: 'already_running', status: cur };

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outLog = path.join(LOG_DIR, `modelrun-${ts}.out.log`);
  const errLog = path.join(LOG_DIR, `modelrun-${ts}.err.log`);

  // Prefer a fast Node.js-based infer-only recompute (no heavy Python dependency)
  try {
    writeStatus({ status: 'running', pid: null, started_at: new Date().toISOString(), outLog, errLog, mode: 'infer' });
    await runInferInNode(outLog, errLog);
    writeStatus({ status: 'success', pid: null, started_at: readStatus().started_at || null, finished_at: new Date().toISOString(), msg: 'ok', outLog, errLog, mode: 'infer' });
    writeCounters({ pending: 0, likes: 0, reviews: 0 });
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

function incrementCounter(type, amount = 1, threshold = null) {
  const c = readCounters();
  c.pending = (c.pending || 0) + amount;
  if (type === 'like') c.likes = (c.likes || 0) + amount;
  if (type === 'review') c.reviews = (c.reviews || 0) + amount;
  writeCounters(c);
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
  const REVIEWS_FILE = path.join(__dirname, '..', 'data', 'filtered_smartphone_reviews.json');
  const META_FILE = path.join(__dirname, '..', 'data', 'filtered_smartphone_metadata.json');
  if (!fs.existsSync(REVIEWS_FILE)) throw new Error('Reviews file not found');
  let reviewsRaw = fs.readFileSync(REVIEWS_FILE, 'utf8');
  let reviews = [];
  try { reviews = JSON.parse(reviewsRaw); } catch (e) {
    // try jsonlines
    reviews = reviewsRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
  }
  // Build interactions
  const interactions = [];
  for (const r of reviews) {
    if (!r.user_id || !r.asin) continue;
    const rating = (r.overall || r.rating || 1.0);
    interactions.push({ user_id: String(r.user_id), asin: String(r.asin), rating: Number(rating) });
  }
  // include likes from users in DB
  const User = require('../models/userModel');
  const users = await User.find({}, { user_id: 1, likedProducts: 1 }).lean().exec();
  for (const u of users) {
    const uid = String(u.user_id);
    for (const a of (u.likedProducts || [])) interactions.push({ user_id: uid, asin: String(a), rating: 4.0 });
  }
  // compute popularity
  const counts = {};
  for (const it of interactions) counts[it.asin] = (counts[it.asin] || 0) + 1;
  const popular = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([asin, c]) => asin);

  // metadata
  let meta = {};
  try {
    if (fs.existsSync(META_FILE)) {
      const md = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
      for (const r of md) {
        const key = String(r.parent_asin || r.asin);
        meta[key] = { title: r.title, price: r.price, category: r.main_category, images: r.images || [] };
      }
    }
  } catch (e) { /* ignore */ }

  // per-user recs
  const userIds = Array.from(new Set(interactions.map(i => i.user_id)));
  const recs = {};
  const N = 20;
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
    recs[u] = out;
  }
  fs.writeFileSync(RECS_FILE, JSON.stringify(recs, null, 2), 'utf8');
  // write some diagnostic output
  try { fs.appendFileSync(outLog, `Node infer completed: Wrote ${Object.keys(recs).length} users\n`); } catch (e) {}
}

module.exports = { startRetrain, startModelRun, getStatus, cleanRecs, incrementCounter, getCounters, resetCounters };
