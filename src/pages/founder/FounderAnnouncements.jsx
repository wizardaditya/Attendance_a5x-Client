import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import socket from '../../lib/socket';

const PRIORITY_COLORS = {
  URGENT: { text: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
  HIGH:   { text: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)'  },
  GENERAL:{ text: '#39ff14', bg: 'rgba(57,255,20,0.08)', border: 'rgba(57,255,20,0.25)'  },
};

export default function FounderAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [form,          setForm]          = useState({ title:'', body:'', priority:'GENERAL', targetDept:'', pinned:false });
  const [departments,   setDepartments]   = useState([]);
  const [saving,        setSaving]        = useState(false);

  const load = () => {
    api.get('/announcements').then(r => setAnnouncements(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {});
    socket.connect();
    socket.on('announcement:new', load);
    return () => socket.off('announcement:new', load);
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/announcements', form);
      setShowCreate(false);
      setForm({ title:'', body:'', priority:'GENERAL', targetDept:'', pinned:false });
      load();
      toast.success('Announcement sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => (a._id || a.id) !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Announcements</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>{announcements.length} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:700,
          background:'#f5e642', color:'#000', border:'none', cursor:'pointer',
        }}>+ New Announcement</button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>New Announcement</h2>
              <button onClick={() => setShowCreate(false)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:20 }}>✕</button>
            </div>
            <form onSubmit={create}>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title:e.target.value }))}
                className="input" placeholder="Title *" required style={{ marginBottom:12 }}
              />
              <textarea
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body:e.target.value }))}
                className="input" placeholder="Message *" required
                style={{ marginBottom:12, minHeight:100, resize:'vertical' }}
              />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority:e.target.value }))} className="input">
                  <option value="GENERAL">📢 General</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="URGENT">🔴 Urgent</option>
                </select>
                <select value={form.targetDept} onChange={e => setForm(p => ({ ...p, targetDept:e.target.value }))} className="input">
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#9ca3af', marginBottom:18, cursor:'pointer' }}>
                <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned:e.target.checked }))} />
                📌 Pin this announcement
              </label>
              <div style={{ display:'flex', gap:12 }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, background:'#f5e642', color:'#000' }}>
                  {saving ? '...' : '📢 Send'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        [1,2,3].map(i => <div key={i} className="card" style={{ height:100, marginBottom:12 }} />)
      ) : announcements.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:56 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📢</div>
          <p style={{ color:'#9ca3af', fontSize:14 }}>No announcements yet</p>
          <p style={{ color:'#6b7280', fontSize:12, marginTop:6 }}>Create one to notify your team</p>
        </div>
      ) : announcements.map(ann => {
        const aid = ann._id || ann.id;
        const c   = PRIORITY_COLORS[ann.priority] || PRIORITY_COLORS.GENERAL;
        return (
          <div key={aid} className="card" style={{
            marginBottom:12,
            borderLeft:`3px solid ${c.text}`,
            opacity: 1,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                  {ann.pinned && <span style={{ fontSize:14 }}>📌</span>}
                  <h3 style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{ann.title}</h3>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, background:c.bg, color:c.text, border:`1px solid ${c.border}` }}>
                    {ann.priority}
                  </span>
                  {ann.targetDept && (
                    <span style={{ fontSize:10, color:'#6b7280', background:'#1a1a1a', padding:'2px 8px', borderRadius:999, border:'1px solid #2a2a2a' }}>
                      🏢 {ann.targetDept}
                    </span>
                  )}
                </div>
                <p style={{ fontSize:13, color:'#9ca3af', lineHeight:1.6, whiteSpace:'pre-line' }}>{ann.body}</p>
              </div>
              <button onClick={() => del(aid)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:16, flexShrink:0, marginLeft:12, padding:4 }}
                title="Delete">🗑</button>
            </div>
            <div style={{ display:'flex', gap:16, fontSize:11, color:'#4b5563', marginTop:8 }}>
              <span>📅 {new Date(ann.createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
              {ann.readBy?.length > 0 && <span>👁 {ann.readBy.length} read</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
