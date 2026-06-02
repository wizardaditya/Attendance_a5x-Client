import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import socket from '../../lib/socket';
import toast from 'react-hot-toast';

export default function AdminQR() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ location:'', department:'' });
  const [creating, setCreating] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [settings, setSettings] = useState(null);

  const loadQRs = useCallback(() => {
    setLoading(true);
    api.get('/qr').then(r => setQrCodes(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadQRs();
    api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {});
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {});

    // Listen for auto QR events
    socket.connect();
    socket.on('qr:auto-generated',   () => { loadQRs(); toast.success('Auto QR generated!', { icon:'📱' }); });
    socket.on('qr:auto-deactivated', (d) => { loadQRs(); toast(`Auto ${d.type} QR deactivated`, { icon:'🔕' }); });
    return () => {
      socket.off('qr:auto-generated');
      socket.off('qr:auto-deactivated');
    };
  }, [loadQRs]);

  // Compute next auto QR windows from settings
  const getScheduleInfo = () => {
    if (!settings) return null;
    const { startTime = '09:00', endTime = '18:00', gracePeriod = 30 } = settings;
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const checkinOpen  = `${String(sH).padStart(2,'0')}:${String(Math.max(0, sM - 10)).padStart(2,'0')}`;
    const checkinClose = (() => { const m = sH*60+sM+gracePeriod+15; return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; })();
    const checkoutOpen  = (() => { const m = eH*60+eM-10; return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; })();
    const checkoutClose = (() => { const m = eH*60+eM+30; return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; })();
    return { checkinOpen, checkinClose, checkoutOpen, checkoutClose };
  };

  const schedule = getScheduleInfo();

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
      setQrCodes(prev => prev.map(q => (q._id||q.id) === id ? res.data : q));
      toast.success('QR regenerated!');
    } catch { toast.error('Failed'); }
  };

  const invalidate = async (id) => {
    if (!window.confirm('Deactivate this QR code? It will become inactive but stay in the list.')) return;
    try {
      const res = await api.delete(`/qr/${id}`);
      setQrCodes(prev => prev.map(q => (q._id||q.id) === id ? { ...q, isActive: false } : q));
      toast.success('QR deactivated');
    } catch { toast.error('Failed'); }
  };

  const deleteQR = async (id) => {
    if (!window.confirm('Permanently delete this QR code? This cannot be undone.')) return;
    try {
      await api.delete(`/qr/${id}/permanent`);
      setQrCodes(prev => prev.filter(q => (q._id||q.id) !== id));
      toast.success('QR deleted permanently');
    } catch { toast.error('Failed to delete'); }
  };

  const downloadQR = (qr) => {
    const a = document.createElement('a');
    a.href = qr.qrDataUrl;
    a.download = `worksyne-qr-${qr.location.replace(/\s+/g,'-')}-${qr.type||'manual'}.png`;
    a.click();
  };

  // Separate auto and manual QRs
  const autoQRs   = qrCodes.filter(q => q.isAuto);
  const manualQRs = qrCodes.filter(q => !q.isAuto);

  const typeColor = (type) => type === 'CHECKIN' ? '#39ff14' : type === 'CHECKOUT' ? '#3b82f6' : '#9ca3af';
  const typeBg    = (type) => type === 'CHECKIN' ? 'rgba(57,255,20,0.1)' : type === 'CHECKOUT' ? 'rgba(59,130,246,0.1)' : 'rgba(156,163,175,0.1)';

  const QRCard = ({ qr }) => {
    const id = qr._id || qr.id;
    return (
      <div className="card" style={{ border: qr.isActive ? `1px solid ${typeColor(qr.type)}33` : '1px solid rgba(239,68,68,0.2)', opacity: qr.isActive ? 1 : 0.6 }}>
        {/* Type badge */}
        {qr.isAuto && (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
            <span style={{ background: typeBg(qr.type), color: typeColor(qr.type), fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, border:`1px solid ${typeColor(qr.type)}44` }}>
              {qr.type === 'CHECKIN' ? '🟢 AUTO CHECK-IN' : '🔵 AUTO CHECK-OUT'}
            </span>
            <span style={{ fontSize:10, color:'#6b7280' }}>Auto-scheduled</span>
          </div>
        )}
        {/* QR Image */}
        <div style={{ background:'#fff', borderRadius:12, padding:12, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {qr.qrDataUrl
            ? <img src={qr.qrDataUrl} alt="QR" style={{ width:180, height:180, objectFit:'contain' }} />
            : <div style={{ width:180, height:180, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:13 }}>No image</div>
          }
        </div>
        {/* Info */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <h3 style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{qr.location}</h3>
            <span className={qr.isActive ? 'badge-green' : 'badge-red'}>{qr.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <p style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>📍 {qr.department || 'All Departments'}</p>
          <p style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>⏰ Expires: {new Date(qr.expiresAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
          <p style={{ fontSize:12, color:'#6b7280' }}>Scans: <span style={{ color: typeColor(qr.type), fontWeight:600 }}>{qr.scanCount}</span></p>
        </div>
        {/* Actions */}
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          <button onClick={() => downloadQR(qr)} className="btn-secondary" style={{ flex:1, fontSize:12, padding:'8px 10px' }}>⬇ Download</button>
          {!qr.isAuto && qr.isActive && (
            <button onClick={() => regenerate(id)} className="btn-secondary" style={{ fontSize:12, padding:'8px 10px' }} title="Regenerate token">🔄</button>
          )}
          {qr.isActive && (
            <button onClick={() => invalidate(id)} style={{ fontSize:12, padding:'8px 10px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', color:'#fbbf24', borderRadius:12, cursor:'pointer', fontWeight:600 }} title="Deactivate (keep record)">
              ⏸ Inactive
            </button>
          )}
          {!qr.isActive && (
            <button onClick={() => regenerate(id)} className="btn-secondary" style={{ fontSize:12, padding:'8px 10px' }} title="Reactivate with new token">
              ▶ Activate
            </button>
          )}
          <button onClick={() => deleteQR(id)} className="btn-danger" style={{ fontSize:12, padding:'8px 10px' }} title="Delete permanently">
            🗑
          </button>
        </div>
        <div style={{ background:'#0a0a0a', borderRadius:8, padding:8 }}>
          <p style={{ fontSize:10, color:'#4b5563', wordBreak:'break-all' }}>{qr.url}</p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>QR Code Manager</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>Automated and manual attendance QR codes</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:13, padding:'10px 18px' }}>+ Manual QR</button>
      </div>

      {/* Auto Schedule Info */}
      {schedule && (
        <div className="card" style={{ marginBottom:20, background:'rgba(57,255,20,0.03)', border:'1px solid rgba(57,255,20,0.15)' }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            ⏰ Auto QR Schedule
            <span style={{ fontSize:11, color:'#6b7280', fontWeight:400 }}>(from Settings)</span>
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ background:'rgba(57,255,20,0.05)', border:'1px solid rgba(57,255,20,0.2)', borderRadius:8, padding:12 }}>
              <p style={{ fontSize:11, color:'#39ff14', fontWeight:700, marginBottom:6 }}>🟢 CHECK-IN QR</p>
              <p style={{ fontSize:13, color:'#fff' }}>Generates at <strong>{schedule.checkinOpen}</strong></p>
              <p style={{ fontSize:13, color:'#fff' }}>Expires at <strong>{schedule.checkinClose}</strong></p>
            </div>
            <div style={{ background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, padding:12 }}>
              <p style={{ fontSize:11, color:'#3b82f6', fontWeight:700, marginBottom:6 }}>🔵 CHECK-OUT QR</p>
              <p style={{ fontSize:13, color:'#fff' }}>Generates at <strong>{schedule.checkoutOpen}</strong></p>
              <p style={{ fontSize:13, color:'#fff' }}>Expires at <strong>{schedule.checkoutClose}</strong></p>
            </div>
          </div>
          <p style={{ fontSize:11, color:'#6b7280', marginTop:10 }}>
            ℹ️ Change timings in Settings page. QRs auto-generate and deactivate daily.
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:420 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>Generate Manual QR Code</h2>
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

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {[1,2,3].map(i => <div key={i} className="card" style={{ height:360 }} />)}
        </div>
      ) : (
        <>
          {/* Auto QRs */}
          {autoQRs.length > 0 && (
            <>
              <h2 style={{ fontSize:14, fontWeight:700, color:'#9ca3af', marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>Auto-Generated</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginBottom:24 }}>
                {autoQRs.map(qr => <QRCard key={qr._id || qr.id} qr={qr} />)}
              </div>
            </>
          )}

          {/* Manual QRs */}
          {manualQRs.length > 0 && (
            <>
              <h2 style={{ fontSize:14, fontWeight:700, color:'#9ca3af', marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>Manual QRs</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                {manualQRs.map(qr => <QRCard key={qr._id || qr.id} qr={qr} />)}
              </div>
            </>
          )}

          {qrCodes.length === 0 && (
            <div className="card" style={{ textAlign:'center', padding:64 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📱</div>
              <p style={{ color:'#9ca3af', fontWeight:600 }}>No QR codes yet</p>
              <p style={{ color:'#6b7280', fontSize:13, marginTop:4 }}>Auto QRs will appear at scheduled times, or generate one manually.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
