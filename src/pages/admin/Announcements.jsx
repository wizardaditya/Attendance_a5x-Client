import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Helper: get current local datetime string for datetime-local input
  const nowLocalStr = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    title: '', body: '', targetDept: '', pinned: false,
    priority: 'GENERAL', publishAt: '', expiresAt: '',
  });
  const [creating, setCreating] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get('/announcements').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
    api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  // ── fix: empty string → null for optional date fields
  const create = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      const payload = {
        ...form,
        publishAt: form.publishAt || null,
        expiresAt: form.expiresAt || null,
      };
      const res = await api.post('/announcements', payload);
      setItems(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ title: '', body: '', targetDept: '', pinned: false, priority: 'GENERAL', publishAt: nowLocalStr(), expiresAt: '' });
      toast.success('Announcement posted!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  const del = async (ann) => {
    if (!window.confirm('Delete this announcement?')) return;
    // use _id if id is not present
    const id = ann._id || ann.id;
    try {
      await api.delete(`/announcements/${id}`);
      setItems(prev => prev.filter(a => (a._id || a.id) !== id));
      toast.success('Deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const priorityColor = { URGENT: '#f87171', HIGH: '#fb923c', GENERAL: '#39ff14' };
  const priorityLabel = { URGENT: '🔴 Urgent', HIGH: '🟠 High', GENERAL: '🟢 General' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Announcements</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Broadcast messages to your team</p>
        </div>
        <button onClick={() => {
          setForm({ title: '', body: '', targetDept: '', pinned: false, priority: 'GENERAL', publishAt: nowLocalStr(), expiresAt: '' });
          setShowCreate(true);
        }} className="btn-primary" style={{ fontSize: 13, padding: '10px 18px' }}>
          + New Announcement
        </button>
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card-glow" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>New Announcement</h2>
            <form onSubmit={create}>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="input" placeholder="Title *" required
                style={{ marginBottom: 12 }}
              />
              <textarea
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                className="input" placeholder="Message body *" required
                style={{ marginBottom: 12, minHeight: 100, resize: 'vertical' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <select value={form.targetDept} onChange={e => setForm(p => ({ ...p, targetDept: e.target.value }))} className="input">
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="input">
                  <option value="GENERAL">🟢 General</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="URGENT">🔴 Urgent</option>
                </select>
              </div>

              {/* Start Date */}
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                📅 Start Date &amp; Time <span style={{ color: '#4b5563' }}>(when it becomes visible)</span>
              </label>
              <input
                type="datetime-local"
                value={form.publishAt}
                onChange={e => setForm(p => ({ ...p, publishAt: e.target.value }))}
                className="input"
                style={{ marginBottom: 12 }}
              />

              {/* End / Expiry Date */}
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                ⏳ End Date &amp; Time <span style={{ color: '#4b5563' }}>(when it auto-hides — optional)</span>
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                className="input"
                style={{ marginBottom: 16 }}
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
                <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))}
                  style={{ accentColor: '#39ff14', width: 16, height: 16 }} />
                <span style={{ fontSize: 13, color: '#d1d5db' }}>📌 Pin this announcement (stays at top)</span>
              </label>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={creating} className="btn-primary" style={{ flex: 1 }}>
                  {creating
                    ? <span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    : '📢 Post'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── List ── */}
      <div>
        {loading
          ? [1, 2, 3].map(i => <div key={i} className="card" style={{ height: 100, marginBottom: 12 }} />)
          : items.length === 0
            ? (
              <div className="card" style={{ textAlign: 'center', padding: 64 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📢</div>
                <p style={{ color: '#9ca3af' }}>No announcements yet</p>
              </div>
            )
            : items.map(ann => {
              const annId = ann._id || ann.id;
              const pc = priorityColor[ann.priority] || '#39ff14';
              const pl = priorityLabel[ann.priority] || ann.priority;
              return (
                <div key={annId} className="card" style={{ marginBottom: 12, border: ann.pinned ? '1px solid rgba(245,230,66,0.3)' : '1px solid #1f1f1f' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        {ann.pinned && <span style={{ color: '#f5e642' }}>📌</span>}
                        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{ann.title}</h3>
                        {ann.targetDept && <span className="badge-gray">{ann.targetDept}</span>}
                        <span style={{ fontSize: 11, fontWeight: 600, color: pc, background: `${pc}18`, border: `1px solid ${pc}44`, padding: '2px 8px', borderRadius: 999 }}>
                          {pl}
                        </span>
                      </div>
                      <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.5 }}>{ann.body}</p>
                      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
                        <span>
                          📅 Start: {new Date(ann.publishAt || ann.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {ann.expiresAt && (
                          <span style={{ color: '#f87171' }}>
                            ⏳ Ends: {new Date(ann.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <span>👁 {ann.readBy?.length || 0} read</span>
                      </div>
                    </div>
                    <button
                      onClick={() => del(ann)}
                      title="Delete announcement"
                      style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 18, flexShrink: 0, padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
