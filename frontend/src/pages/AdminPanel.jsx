import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getAdminStats, triggerManualRetrain, retrainStatus, reRunModel } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user_id, isAdmin } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);
  const [message, setMessage] = useState('');
  const [jobStatus, setJobStatus] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await getAdminStats(user_id);
        setStats(res.data);
        const s = await retrainStatus();
        setJobStatus(s.data || s);
      } catch (err) {
        console.error('Failed to fetch admin stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, user_id, navigate]);

  const handleAction = async (type) => {
    const isRerun = type === 'rerun';
    const confirmMsg = isRerun
      ? 'Trigger a quick re-run? This will update recommendations based on existing models.'
      : 'Trigger a full retrain? This will perform deep learning on all data (slower).';

    if (window.confirm(confirmMsg)) {
      try {
        setIsRetraining(true);
        setMessage(isRerun ? 'Re-run started...' : 'Retraining started...');

        const res = isRerun ? await reRunModel(user_id) : await triggerManualRetrain(user_id);
        setMessage(res.data.message);

        const interval = setInterval(async () => {
          const s = await retrainStatus();
          const data = s.data || s;
          setJobStatus(data);
          if (data.status === 'idle' || data.status === 'success' || data.status === 'done' || data.error) {
            clearInterval(interval);
            setIsRetraining(false);
            const updatedStats = await getAdminStats(user_id);
            setStats(updatedStats.data);
          }
        }, 3000);
      } catch (err) {
        setMessage(`Action failed: ${err.message}`);
        setIsRetraining(false);
      }
    }
  };

  if (loading) return <div className="page-container">Loading Dashboard...</div>;
  if (!isAdmin) return null;

  return (
    <div className="page-container admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Console</h1>
          <p>System monitoring and recommendation engine control</p>
        </div>
        <div className="admin-user-badge">
          <span>Logged in as: <strong>{user_id}</strong></span>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products">📦</div>
          <div className="stat-info">
            <h3>Products</h3>
            <p className="stat-number">{stats?.products?.toLocaleString() ?? '0'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon users">👤</div>
          <div className="stat-info">
            <h3>Users</h3>
            <p className="stat-number">{stats?.users?.toLocaleString() ?? '0'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon reviews">💬</div>
          <div className="stat-info">
            <h3>Reviews</h3>
            <p className="stat-number">{stats?.reviews?.toLocaleString() ?? '0'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon revenue">💰</div>
          <div className="stat-info">
            <h3>Revenue</h3>
            <p className="stat-number">${(stats?.revenue ?? 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="admin-content-layout">
        <section className="admin-actions-section">
          <div className="glass-card action-card">
            <h3>Recommender Control Center</h3>

            <div className="action-item">
              <div className="action-text">
                <h4>⚡ Quick Re-run</h4>
                <p>Fast re-generation of recommendations using current models. Use this to reflect new likes/reviews instantly.</p>
              </div>
              <button
                className="btn-secondary"
                onClick={() => handleAction('rerun')}
                disabled={isRetraining}
              >
                {isRetraining ? 'Processing...' : 'Re-run Model'}
              </button>
            </div>

            <div className="action-divider"></div>

            <div className="action-item">
              <div className="action-text">
                <h4>🚀 Full Retrain</h4>
                <p>Deep learning training on the entire dataset. Processes new patterns but takes longer.</p>
              </div>
              <button
                className="btn-primary"
                onClick={() => handleAction('retrain')}
                disabled={isRetraining}
              >
                {isRetraining ? 'Training...' : 'Run Full Retrain'}
              </button>
            </div>

            {message && <div className={`status-bubble ${isRetraining ? 'info' : 'success'}`}>{message}</div>}

            <div className="job-status-panel">
              <h4>Engine Status</h4>
              <div className="status-indicator">
                <span className={`status-dot ${jobStatus?.status === 'running' ? 'active' : ''}`}></span>
                <span>Status: <strong>{jobStatus?.status || 'Idle'}</strong> {jobStatus?.mode === 'infer' && '(Quick Mode)'}</span>
              </div>
              {jobStatus?.last_run && (
                <p className="last-run">Last Run: {new Date(jobStatus.last_run).toLocaleString()}</p>
              )}
              {jobStatus?.error && <p className="error-text">Last Error: {jobStatus.error}</p>}
            </div>
          </div>
        </section>

        <aside className="admin-details-aside">
          <div className="glass-card settings-preview">
            <h3>Model Parameters</h3>
            <ul className="settings-list">
              <li>
                <span>Auto-Run Threshold</span>
                <strong>{(stats?.modelStats?.threshold ?? 10)} Reviews</strong>
              </li>
              <li>
                <span>Optimization</span>
                <strong>Hybrid (CPU)</strong>
              </li>
            </ul>
          </div>

          <div className="glass-card pipeline-status">
            <h3>Interaction Pipeline</h3>
            <p className="pipeline-desc">Remaining till next auto-run:</p>
            <div className="pipeline-visual">
              <div className="pipeline-counter">
                <span className="current">{stats?.modelStats?.pending ?? 0}</span>
                <span className="divider">/</span>
                <span className="total">{stats?.modelStats?.threshold ?? 10}</span>
              </div>
              <div className="pipeline-progress-bar">
                <div
                  className="pipeline-progress-fill"
                  style={{ width: `${Math.min(100, ((stats?.modelStats?.pending ?? 0) / (stats?.modelStats?.threshold ?? 10)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <ul className="settings-list mini">
              <li><span>Likes in batch</span> <strong>{stats?.counters?.likes ?? 0}</strong></li>
              <li><span>Reviews in batch</span> <strong>{stats?.counters?.reviews ?? 0}</strong></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminPanel;
