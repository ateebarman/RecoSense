import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { retrain, retrainStatus, retrainClean, runModel, getModelCounters, resetModelCounters } from '../services/api';

export default function AdminPanel() {
  const { user_id } = useUser();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const trigger = async () => {
    setLoading(true);
    try {
      await retrain(user_id);
      const s = await retrainStatus();
      setStatus(s);
    } catch (e) { setStatus({ error: String(e) }); }
    setLoading(false);
  };
  const clean = async () => {
    setLoading(true);
    try { const r = await retrainClean(user_id); setStatus(r); } catch (e) { setStatus({ error: String(e) }); }
    setLoading(false);
  };
  const run = async () => {
    setLoading(true);
    try { await runModel(user_id); setStatus(await retrainStatus()); } catch (e) { setStatus({ error: String(e) }); }
    setLoading(false);
  };
  const getCounters = async () => {
    setLoading(true);
    try { const r = await getModelCounters(user_id); setStatus(r.data || r); } catch (e) { setStatus({ error: String(e) }); }
    setLoading(false);
  };
  const resetCounters = async () => {
    setLoading(true);
    try { const r = await resetModelCounters(user_id); setStatus(r.data || r); } catch (e) { setStatus({ error: String(e) }); }
    setLoading(false);
  };
  const refresh = async () => { setLoading(true); try { setStatus(await retrainStatus()); } catch (e) { setStatus({ error: String(e) }); } setLoading(false); };
  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Panel</h2>
      <p>User: {user_id}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={trigger} disabled={loading}>Trigger Retrain</button>
        <button onClick={clean} disabled={loading}>Clean Rec File</button>
        <button onClick={run} disabled={loading}>Run Model (Infer-Only)</button>
        <button onClick={getCounters} disabled={loading}>Get Model Counters</button>
        <button onClick={resetCounters} disabled={loading}>Reset Counters</button>
        <button onClick={refresh} disabled={loading}>Refresh Status</button>
      </div>
      <pre style={{ marginTop: 12, padding: 12 }}>{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
}
