import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function FounderSettings() {
  const { user, setUser, logout } = useAuth();

  const [editProfile,   setEditProfile]   = useState(false);
  const [profileForm,   setProfileForm]   = useState({ name: user?.name || '', phone: user?.phone || '', designation: user?.designation || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw,         setPw]         = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showCon,    setShowCon]    = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch(`/users/${user._id || user.id}`, profileForm);
      setUser(res.data);
      localStorage.setItem('worksyne_user', JSON.stringify(res.data));
      setEditProfile(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (pw.newPassword !== pw.confirmPassword) return toast.error('Passwords do not match');
    setChangingPw(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pw.currentPassword,
        newPassword:     pw.newPassword,
      });
      toast.success('Password changed successfully!');
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setChangingPw(false);
    }
  };

  const pwStrength = pw.newPassword.length < 6 ? { w: '20%', c: '#f87171', l: 'Too short' }
    : pw.newPassword.length < 10 ? { w: '55%', c: '#f5e642', l: 'Moderate' }
    : { w: '100%', c: '#39ff14', l: 'Strong ✓' };

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Settings</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>Manage your profile and account</p>

      {/* ── Profile Card ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1f1f1f' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(245,230,66,0.1)', border: '2px solid rgba(245,230,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5e642', fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
            {user?.name?.[0]}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{user?.name}</p>
            <p style={{ fontSize: 12, color: '#f5e642' }}>FOUNDER · {user?.designation}</p>
            <p style={{ fontSize: 11, color: '#6b7280' }}>{user?.employeeId}</p>
          </div>
        </div>

        {!editProfile ? (
          <div>
            {[['✉️','Email',user?.email],['📞','Phone',user?.phone||'—'],['🏷️','Designation',user?.designation||'—']].map(([icon,label,val]) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#0a0a0a', borderRadius:10, marginBottom:8 }}>
                <span style={{ fontSize:15 }}>{icon}</span>
                <div>
                  <p style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</p>
                  <p style={{ fontSize:13, color:'#fff', marginTop:2 }}>{val}</p>
                </div>
              </div>
            ))}
            <button onClick={() => { setEditProfile(true); setProfileForm({ name:user?.name||'', phone:user?.phone||'', designation:user?.designation||'' }); }}
              className="btn-primary" style={{ marginTop:8, width:'100%', background:'rgba(245,230,66,0.1)', color:'#f5e642', border:'1px solid rgba(245,230,66,0.3)' }}>
              ✏️ Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={saveProfile}>
            <label style={{ display:'block', fontSize:11, color:'#9ca3af', marginBottom:5 }}>Full Name</label>
            <input
              value={profileForm.name}
              onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
              className="input" placeholder="Full name" required style={{ marginBottom:12 }}
            />
            <label style={{ display:'block', fontSize:11, color:'#9ca3af', marginBottom:5 }}>Phone Number</label>
            <input
              value={profileForm.phone}
              onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
              className="input" placeholder="Phone number" style={{ marginBottom:12 }}
            />
            <label style={{ display:'block', fontSize:11, color:'#9ca3af', marginBottom:5 }}>Designation</label>
            <input
              value={profileForm.designation}
              onChange={e => setProfileForm(p => ({ ...p, designation: e.target.value }))}
              className="input" placeholder="e.g. Co-Founder" style={{ marginBottom:18 }}
            />
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" disabled={savingProfile} className="btn-primary" style={{ flex:1 }}>
                {savingProfile ? '...' : '💾 Save'}
              </button>
              <button type="button" onClick={() => setEditProfile(false)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* ── Password Card ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:4 }}>🔐 Change Password</h2>
        <p style={{ fontSize:12, color:'#6b7280', marginBottom:18 }}>Must be at least 6 characters</p>
        <form onSubmit={changePassword}>

          {/* Current password */}
          <div style={{ position:'relative', marginBottom:10 }}>
            <input
              type={showCur ? 'text' : 'password'}
              value={pw.currentPassword}
              onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))}
              className="input" placeholder="Current password" required style={{ paddingRight:40 }}
            />
            <button type="button" onClick={() => setShowCur(v => !v)}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14 }}>
              {showCur ? '🙈' : '👁'}
            </button>
          </div>

          {/* New password */}
          <div style={{ position:'relative', marginBottom:10 }}>
            <input
              type={showNew ? 'text' : 'password'}
              value={pw.newPassword}
              onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))}
              className="input" placeholder="New password" required style={{ paddingRight:40 }}
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14 }}>
              {showNew ? '🙈' : '👁'}
            </button>
          </div>

          {/* Confirm password */}
          <div style={{ position:'relative', marginBottom:10 }}>
            <input
              type={showCon ? 'text' : 'password'}
              value={pw.confirmPassword}
              onChange={e => setPw(p => ({ ...p, confirmPassword: e.target.value }))}
              className="input" placeholder="Confirm new password" required style={{ paddingRight:40 }}
            />
            <button type="button" onClick={() => setShowCon(v => !v)}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14 }}>
              {showCon ? '🙈' : '👁'}
            </button>
          </div>

          {pw.newPassword && (
            <div style={{ marginBottom:14 }}>
              <div style={{ height:3, background:'#1a1a1a', borderRadius:999, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:999, transition:'width 0.3s', width:pwStrength.w, background:pwStrength.c }} />
              </div>
              <p style={{ fontSize:10, color:'#6b7280', marginTop:4 }}>{pwStrength.l}</p>
            </div>
          )}

          <button type="submit" disabled={changingPw} className="btn-primary" style={{ width:'100%' }}>
            {changingPw ? '...' : '🔒 Update Password'}
          </button>
        </form>
      </div>

      {/* ── Sign Out ── */}
      <div className="card" style={{ border:'1px solid rgba(239,68,68,0.2)' }}>
        <h2 style={{ fontSize:14, fontWeight:700, color:'#f87171', marginBottom:12 }}>⚠️ Sign Out</h2>
        <p style={{ fontSize:12, color:'#6b7280', marginBottom:14 }}>You'll need to log in again to access your account.</p>
        <button onClick={() => { logout(); window.location.href = '/login'; }}
          style={{ width:'100%', padding:'10px', borderRadius:10, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontWeight:600, fontSize:13, cursor:'pointer' }}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
