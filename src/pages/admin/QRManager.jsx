import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminQR() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ location:'', department:'' });
  const [creating, setCreating] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadQRs();
    api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const loadQRs = () => {
    setLoading(true);
    api.get('/qr').then(r => setQrCodes(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  const createQR = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      const res = await api.post('/qr/generate', form);
      setQrCodes(prev => [res.data, ...prev]);
      setShowCreate(false); setForm({ location:'', department:'' });
      toast.success('QR code generated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  const regenerate = async (id) => {
    try {
      const res = await api.post(`/qr/regenerate/${id}`);
      setQrCodes(prev => prev.map(q => q.id === id ? res.data : q));
      toast.success('QR regenerated!');
    } catch { toast.error('Failed'); }
  };

  const invalidate = async (id) => {
    if (!window.confirm('Invalidate this QR code?')) return;
    try {
      await api.delete(`/qr/${id}`);
      setQrCodes(prev => prev.map(q => q.id === id ? { ...q, isActive:false } : q));
      toast.success('QR invalidated');
    } catch { toast.error('Failed'); }
  };

  const downloadQR = (qr) => {
    const a = document.createElement('a');
    a.href = qr.qrDataUrl;
    a.download = `worksyne-qr-${qr.location.replace(/\s+/g,'-')}.png`;
    a.click();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>QR Code Manager</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>Generate and manage attendance QR codes</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:13, padding:'10px 18px' }}>+ Generate QR</button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:420 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>Generate New QR Code</h2>
            <form onSubmit={createQR}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Office Location / Zone</label>
                <input value={form.location} onChange={e => setForm(p => ({ ...p, location:e.target.value }))} className="input" placeholder="e.g. Main Office, Floor 2" required />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Department (optional)</label>
                <select value={form.department} onChange={e => setForm(p => ({ ...p, department:e.target.value }))} className="input">
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button type="submit" disabled={creating} className="btn-primary" style={{ flex:1 }}>
                  {creating ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} /> : '📱 Generate'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Grid */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {[1,2,3].map(i => <div key={i} className="card" style={{ height:360 }} />)}
        </div>
      ) : qrCodes.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:64 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📱</div>
          <p style={{ color:'#9ca3af', fontWeight:600 }}>No QR codes yet</p>
          <p style={{ color:'#6b7280', fontSize:13, marginTop:4 }}>Generate your first QR code to get started</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {qrCodes.map(qr => (
            <div key={qr.id} className="card" style={{ border: qr.isActive ? '1px solid rgba(57,255,20,0.2)' : '1px solid rgba(239,68,68,0.2)', opacity: qr.isActive ? 1 : 0.6 }}>
              {/* QR Image */}
              <div style={{ background:'#fff', borderRadius:12, padding:12, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img src={qr.qrDataUrl} alt="QR" style={{ width:180, height:180, objectFit:'contain' }} />
              </div>
              {/* Info */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <h3 style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{qr.location}</h3>
                  <span className={qr.isActive ? 'badge-green' : 'badge-red'}>{qr.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>📍 {qr.department || 'All Departments'}</p>
                <p style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>⏰ Expires: {new Date(qr.expiresAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                <p style={{ fontSize:12, color:'#6b7280' }}>Scans today: <span style={{ color:'#39ff14', fontWeight:600 }}>{qr.scanCount}</span></p>
              </div>
              {/* Actions */}
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <button onClick={() => downloadQR(qr)} className="btn-secondary" style={{ flex:1, fontSize:12, padding:'8px 12px' }}>⬇ Download</button>
                {qr.isActive && <button onClick={() => regenerate(qr.id)} className="btn-secondary" style={{ fontSize:12, padding:'8px 12px' }}>🔄</button>}
                <button onClick={() => invalidate(qr.id)} className="btn-danger" style={{ fontSize:12, padding:'8px 12px' }}>🗑</button>
              </div>
              {/* URL */}
              <div style={{ background:'#0a0a0a', borderRadius:8, padding:8 }}>
                <p style={{ fontSize:10, color:'#4b5563', wordBreak:'break-all' }}>{qr.url}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
