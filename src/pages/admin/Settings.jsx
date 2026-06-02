import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [office, setOffice] = useState({ officeName:'A5X Industries', address:'Mumbai, Maharashtra, India', startTime:'09:00', endTime:'18:00', gracePeriod:30, timezone:'Asia/Kolkata', workDays:'Mon-Sat' });
  const [pw, setPw] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load settings from DB on mount
  useEffect(() => {
    api.get('/settings')
      .then(r => {
        const s = r.data;
        setOffice({
          officeName:  s.officeName  || 'A5X Industries',
          address:     s.address     || 'Mumbai, Maharashtra, India',
          startTime:   s.startTime   || '09:00',
          endTime:     s.endTime     || '18:00',
          gracePeriod: s.gracePeriod ?? 30,
          timezone:    s.timezone    || 'Asia/Kolkata',
          workDays:    s.workDays    || 'Mon-Sat',
        });
      })
      .catch(() => toast.error('Could not load settings'))
      .finally(() => setLoadingSettings(false));
  }, []);

  const saveOffice = async () => {
    setSaving(true);
    try {
      await api.post('/settings', office);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pw.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword:pw.currentPassword, newPassword:pw.newPassword });
      toast.success('Password changed!');
      setPw({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const Section = ({ icon, title, children }) => (
    <div className="card" style={{ marginBottom:20 }}>
      <h2 style={{ fontSize:15, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
        <span>{icon}</span>{title}
      </h2>
      {children}
    </div>
  );

  if (loadingSettings) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
      <div style={{ color:'#6b7280' }}>Loading settings...</div>
    </div>
  );

  return (
    <div style={{ maxWidth:640 }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Settings</h1>
      <p style={{ fontSize:13, color:'#6b7280', marginBottom:24 }}>Configure your WorkSyne instance</p>

      <Section icon="🏢" title="Office Configuration">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Office Name</label>
            <input value={office.officeName} onChange={e => setOffice(p => ({ ...p, officeName:e.target.value }))} className="input" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Timezone</label>
            <select value={office.timezone} onChange={e => setOffice(p => ({ ...p, timezone:e.target.value }))} className="input">
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Work Start</label>
            <input type="time" value={office.startTime} onChange={e => setOffice(p => ({ ...p, startTime:e.target.value }))} className="input" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Work End</label>
            <input type="time" value={office.endTime} onChange={e => setOffice(p => ({ ...p, endTime:e.target.value }))} className="input" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Grace Period (min)</label>
            <input type="number" min="0" max="120" value={office.gracePeriod} onChange={e => setOffice(p => ({ ...p, gracePeriod:Number(e.target.value) }))} className="input" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Work Days</label>
            <select value={office.workDays} onChange={e => setOffice(p => ({ ...p, workDays:e.target.value }))} className="input">
              <option value="Mon-Fri">Monday – Friday</option>
              <option value="Mon-Sat">Monday – Saturday</option>
              <option value="Mon-Sun">Monday – Sunday</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Office Address</label>
          <textarea
            value={office.address}
            onChange={e => setOffice(p => ({ ...p, address: e.target.value }))}
            className="input"
            placeholder="Office address"
            rows={2}
            style={{ resize:'vertical', minHeight:44 }}
          />
        </div>

        {/* Preview - late arrival threshold */}
        <div style={{ background:'rgba(57,255,20,0.05)', border:'1px solid rgba(57,255,20,0.15)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#9ca3af' }}>
          ⏰ Employees checking in after <span style={{ color:'#39ff14', fontWeight:600 }}>
            {(() => {
              const [h, m] = office.startTime.split(':').map(Number);
              const total = h * 60 + m + Number(office.gracePeriod);
              const hh = Math.floor(total / 60) % 24;
              const mm = total % 60;
              return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
            })()}
          </span> will be marked as <span style={{ color:'#f5e642', fontWeight:600 }}>LATE</span>
        </div>

        <button onClick={saveOffice} disabled={saving} className="btn-primary" style={{ fontSize:13 }}>
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </Section>

      <Section icon="🔐" title="Change Password">
        <form onSubmit={changePw}>
          {[['currentPassword','Current password'],['newPassword','New password'],['confirmPassword','Confirm new password']].map(([k,ph]) => (
            <input key={k} type="password" value={pw[k]} onChange={e => setPw(p => ({ ...p, [k]:e.target.value }))} className="input" placeholder={ph} required style={{ marginBottom:12 }} />
          ))}
          <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize:13 }}>
            {saving ? 'Updating...' : '🔐 Update Password'}
          </button>
        </form>
      </Section>

      <Section icon="ℹ️" title="System Info">
        {[
          ['App Name','WorkSyne'],
          ['Company', office.officeName],
          ['Version','1.0.0'],
          ['Work Hours', `${office.startTime} – ${office.endTime}`],
          ['Late After', `${office.gracePeriod} min grace period`],
          ['Auth','JWT (7 day tokens)'],
        ].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:10 }}>
            <span style={{ color:'#6b7280' }}>{k}</span>
            <span style={{ color:'#39ff14', fontWeight:500 }}>{v}</span>
          </div>
        ))}
      </Section>

      <Section icon="🧹" title="Database Cleanup">
        <p style={{ fontSize:13, color:'#9ca3af', marginBottom:16 }}>
          Remove all inactive/deleted users from MongoDB Atlas and clean up their orphaned attendance records.
          This keeps the database lean and fast.
        </p>
        <button
          onClick={async () => {
            if (!window.confirm('Permanently remove all inactive users and their data from the database?')) return;
            try {
              const res = await api.delete('/users/cleanup/inactive');
              toast.success(`Cleanup done: ${res.data.usersDeleted} users, ${res.data.attendanceOrphansDeleted} attendance records removed`);
            } catch (err) {
              toast.error(err.response?.data?.error || 'Cleanup failed');
            }
          }}
          className="btn-danger"
          style={{ fontSize:13 }}
        >
          🧹 Clean Up Inactive Users
        </button>
      </Section>
    </div>
  );
}
