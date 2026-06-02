import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title:'', body:'', targetDept:'', pinned:false, publishAt:'', expiresAt:'' });
  const [creating, setCreating] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get('/announcements').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
    api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const create = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      const res = await api.post('/announcements', form);
      setItems(prev => [res.data, ...prev]);
      setShowCreate(false); setForm({ title:'', body:'', targetDept:'', pinned:false, publishAt:'', expiresAt:'' });
      toast.success('Announcement posted!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcements/${id}`); setItems(prev => prev.filter(a => a.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Announcements</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>Broadcast messages to your team</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:13, padding:'10px 18px' }}>+ New Announcement</button>
      </div>

      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>New Announcement</h2>
            <form onSubmit={create}>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))} className="input" placeholder="Title *" required style={{ marginBottom:12 }} />
              <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body:e.target.value }))} className="input" placeholder="Message body *" required style={{ marginBottom:12, minHeight:100, resize:'vertical' }} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <select value={form.targetDept} onChange={e => setForm(p => ({ ...p, targetDept:e.target.value }))} className="input">
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="datetime-local" value={form.publishAt} onChange={e => setForm(p => ({ ...p, publishAt:e.target.value }))} className="input" />
              </div>
              <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt:e.target.value }))} className="input" placeholder="Expires at" style={{ marginBottom:12 }} />
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:20 }}>
                <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned:e.target.checked }))} style={{ accentColor:'#39ff14', width:16, height:16 }} />
                <span style={{ fontSize:13, color:'#d1d5db' }}>📌 Pin this announcement</span>
              </label>
              <div style={{ display:'flex', gap:12 }}>
                <button type="submit" disabled={creating} className="btn-primary" style={{ flex:1 }}>
                  {creating ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} /> : '📢 Post'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div>
        {loading ? [1,2,3].map(i => <div key={i} className="card" style={{ height:100, marginBottom:12 }} />) :
         items.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:64 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📢</div>
            <p style={{ color:'#9ca3af' }}>No announcements yet</p>
          </div>
        ) : items.map(ann => (
          <div key={ann.id} className="card" style={{ marginBottom:12, border: ann.pinned ? '1px solid rgba(245,230,66,0.3)' : '1px solid #1f1f1f' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                  {ann.pinned && <span style={{ color:'#f5e642' }}>📌</span>}
                  <h3 style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{ann.title}</h3>
                  {ann.targetDept && <span className="badge-gray">{ann.targetDept}</span>}
                </div>
                <p style={{ color:'#9ca3af', fontSize:13, lineHeight:1.5 }}>{ann.body}</p>
                <div style={{ display:'flex', gap:16, marginTop:10, fontSize:11, color:'#6b7280' }}>
                  <span>{new Date(ann.publishAt || ann.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                  <span>👁 {ann.readBy?.length || 0} read</span>
                  {ann.expiresAt && <span>Expires: {new Date(ann.expiresAt).toLocaleDateString('en-IN')}</span>}
                </div>
              </div>
              <button onClick={() => del(ann.id)} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:16, flexShrink:0 }}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
