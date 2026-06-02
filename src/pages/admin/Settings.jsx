import { useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [office, setOffice] = useState({ officeName:'A5X Industries', address:'Mumbai, Maharashtra, India', startTime:'09:00', endTime:'18:00', gracePeriod:30, timezone:'Asia/Kolkata', workDays:'Mon-Sat' });
  const [pw, setPw] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [saving, setSaving] = useState(false);

  const saveOffice = () => toast.success('Settings saved!');

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) { toast.error('Passwords do not match'); return; }
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

  return (
    <div style={{ maxWidth:640 }}>
      <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Settings</h1>
      <p style={{ fontSize:13, color:'#6b7280', marginBottom:24 }}>Configure your WorkSyne instance</p>

      <Section icon="🏢" title="Office Configuration">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          {[['officeName','Office Name'],['timezone','Timezone']].map(([k,l]) => (
            <div key={k}>
              <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>{l}</label>
              {k === 'timezone'
                ? <select value={office[k]} onChange={e => setOffice(p => ({ ...p, [k]:e.target.value }))} className="input">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                : <input value={office[k]} onChange={e => setOffice(p => ({ ...p, [k]:e.target.value }))} className="input" />}
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          {[['startTime','Work Start','time'],['endTime','Work End','time'],['gracePeriod','Grace Period (min)','number'],['workDays','Work Days','select']].map(([k,l,t]) => (
            <div key={k}>
              <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>{l}</label>
              {t === 'select'
                ? <select value={office[k]} onChange={e => setOffice(p => ({ ...p, [k]:e.target.value }))} className="input">
                    <option value="Mon-Fri">Monday – Friday</option>
                    <option value="Mon-Sat">Monday – Saturday</option>
                  </select>
                : <input type={t} value={office[k]} onChange={e => setOffice(p => ({ ...p, [k]:e.target.value }))} className="input" />}
            </div>
          ))}
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Office Address</label>
          <input value={office.address} onChange={e => setOffice(p => ({ ...p, address:e.target.value }))} className="input" />
        </div>
        <button onClick={saveOffice} className="btn-primary" style={{ fontSize:13 }}>💾 Save Settings</button>
      </Section>

      <Section icon="🔐" title="Change Password">
        <form onSubmit={changePw}>
          {[['currentPassword','Current password'],['newPassword','New password'],['confirmPassword','Confirm new password']].map(([k,ph]) => (
            <input key={k} type="password" value={pw[k]} onChange={e => setPw(p => ({ ...p, [k]:e.target.value }))} className="input" placeholder={ph} required style={{ marginBottom:12 }} />
          ))}
          <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize:13 }}>
            {saving ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} /> : '🔐 Update Password'}
          </button>
        </form>
      </Section>

      <Section icon="ℹ️" title="System Info">
        {[['App Name','WorkSyne'],['Company','A5X Industries'],['Version','1.0.0'],['QR Refresh','Every 24 hours'],['Auth','JWT (7 day tokens)']].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:10 }}>
            <span style={{ color:'#6b7280' }}>{k}</span>
            <span style={{ color: k === 'Version' ? '#39ff14' : '#fff', fontWeight:500 }}>{v}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}
