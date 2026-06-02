import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function EmployeeProfile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name:user?.name||'', phone:user?.phone||'', designation:user?.designation||'' });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [changingPw, setChangingPw] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/users/${user.id}`, form);
      setUser(res.data); localStorage.setItem('worksyne_user', JSON.stringify(res.data));
      setEditing(false); toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) { toast.error('Passwords do not match'); return; }
    setChangingPw(true);
    try {
      await api.post('/auth/change-password', { currentPassword:pw.currentPassword, newPassword:pw.newPassword });
      toast.success('Password changed!'); setPw({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setChangingPw(false); }
  };

  const Card = ({ children, style={} }) => <div className="card" style={{ marginBottom:16, ...style }}>{children}</div>;
  const SectionTitle = ({ icon, title }) => (
    <h2 style={{ fontSize:14, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
      <span>{icon}</span>{title}
    </h2>
  );

  return (
    <div style={{ padding:16 }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:16 }}>My Profile</h1>

      {/* Avatar */}
      <Card style={{ textAlign:'center', padding:24 }}>
        <div style={{ width:72, height:72, borderRadius:20, background:'rgba(57,255,20,0.1)', border:'2px solid rgba(57,255,20,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#39ff14', fontWeight:800, fontSize:28, margin:'0 auto 12px' }}>
          {user?.name?.[0]}
        </div>
        <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:4 }}>{user?.name}</h2>
        <p style={{ color:'#9ca3af', fontSize:13 }}>{user?.designation}</p>
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:8 }}>
          <span className="badge-green">{user?.department}</span>
          <span className="badge-gray">{user?.employeeId}</span>
        </div>
      </Card>

      {/* Info */}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <SectionTitle icon="👤" title="Personal Info" />
          <button onClick={() => setEditing(!editing)} style={{ background:'none', border:'none', color:'#39ff14', cursor:'pointer', fontSize:13, fontWeight:600 }}>{editing ? 'Cancel' : 'Edit'}</button>
        </div>
        {editing ? (
          <div>
            {[['name','Full Name'],['phone','Phone Number'],['designation','Designation']].map(([k,ph]) => (
              <input key={k} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]:e.target.value }))} className="input" placeholder={ph} style={{ marginBottom:10 }} />
            ))}
            <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{ width:'100%', marginTop:4 }}>
              {saving ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} /> : '💾 Save Changes'}
            </button>
          </div>
        ) : (
          <div>
            {[['✉️','Email',user?.email],['📞','Phone',user?.phone],['🏢','Department',user?.department],['🪪','Employee ID',user?.employeeId]].map(([icon,label,val]) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#0a0a0a', borderRadius:10, marginBottom:8 }}>
                <span style={{ fontSize:15 }}>{icon}</span>
                <div>
                  <p style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</p>
                  <p style={{ fontSize:13, color:'#fff', marginTop:1 }}>{val || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Password */}
      <Card>
        <SectionTitle icon="🔐" title="Change Password" />
        <form onSubmit={changePw}>
          {[['currentPassword','Current password'],['newPassword','New password'],['confirmPassword','Confirm new password']].map(([k,ph]) => (
            <input key={k} type="password" value={pw[k]} onChange={e => setPw(p => ({ ...p, [k]:e.target.value }))} className="input" placeholder={ph} required style={{ marginBottom:10, fontSize:13 }} />
          ))}
          <button type="submit" disabled={changingPw} className="btn-primary" style={{ width:'100%' }}>
            {changingPw ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} /> : 'Update Password'}
          </button>
        </form>
      </Card>

      {/* Logout */}
      <button onClick={() => { logout(); navigate('/login'); }} className="btn-danger" style={{ width:'100%' }}>
        🚪 Sign Out
      </button>
    </div>
  );
}
