import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function EmployeeSettings() {
  const { user, setUser, logout } = useAuth();

  // Profile edit
  const [editProfile,   setEditProfile]   = useState(false);
  const [profileForm,   setProfileForm]   = useState({ name: user?.name || '', phone: user?.phone || '', designation: user?.designation || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [pw,         setPw]         = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [showPw,     setShowPw]     = useState({ cur: false, new: false, con: false });

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
      toast.error(err.response?.data?.error || 'Failed');
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
      toast.success('Password changed!');
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setChangingPw(false);
    }
  };

  const PwInput = ({ field, placeholder, showKey }) => (
    <div style={{ position: 'relative', marginBottom: 10 }}>
      <input
        type={showPw[showKey] ? 'text' : 'password'}
        value={pw[field]}
        onChange={e => setPw(p => ({ ...p, [field]: e.target.value }))}
        className="input"
        placeholder={placeholder}
        required
        style={{ paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShowPw(p => ({ ...p, [showKey]: !p[showKey] }))}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}
      >
        {showPw[showKey] ? '🙈' : '👁'}
      </button>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Settings</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Manage your profile and password</p>

      {/* Avatar */}
      <div className="card" style={{ textAlign: 'center', padding: 20, marginBottom: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(57,255,20,0.1)', border: '2px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39ff14', fontWeight: 800, fontSize: 26, margin: '0 auto 10px' }}>
          {user?.name?.[0]}
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{user?.name}</p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{user?.designation}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <span className="badge-green">{user?.department}</span>
          <span className="badge-gray">{user?.employeeId}</span>
        </div>
      </div>

      {/* Profile info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>👤 Personal Info</h2>
          {!editProfile && (
            <button
              onClick={() => setEditProfile(true)}
              style={{ background: 'none', border: 'none', color: '#39ff14', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {!editProfile ? (
          <div>
            {[['✉️','Email', user?.email], ['📞','Phone', user?.phone || '—'], ['🏢','Department', user?.department], ['🪪','Employee ID', user?.employeeId]].map(([icon, label, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0a0a0a', borderRadius: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 15 }}>{icon}</span>
                <div>
                  <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ fontSize: 13, color: '#fff', marginTop: 2 }}>{val || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={saveProfile}>
            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 5 }}>Full Name</label>
            <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="Full name" required style={{ marginBottom: 12 }} />

            <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 5 }}>Phone</label>
            <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="input" placeholder="Phone number" style={{ marginBottom: 18 }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={savingProfile} className="btn-primary" style={{ flex: 1 }}>
                {savingProfile ? '...' : '💾 Save'}
              </button>
              <button type="button" onClick={() => setEditProfile(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Password */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>🔐 Change Password</h2>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Minimum 6 characters</p>
        <form onSubmit={changePassword}>
          <PwInput field="currentPassword" placeholder="Current password" showKey="cur" />
          <PwInput field="newPassword"     placeholder="New password"     showKey="new" />
          <PwInput field="confirmPassword" placeholder="Confirm new password" showKey="con" />

          {pw.newPassword && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 3, background: '#1a1a1a', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999, transition: 'width 0.3s',
                  width: pw.newPassword.length < 6 ? '20%' : pw.newPassword.length < 10 ? '55%' : '100%',
                  background: pw.newPassword.length < 6 ? '#f87171' : pw.newPassword.length < 10 ? '#f5e642' : '#39ff14',
                }} />
              </div>
              <p style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                {pw.newPassword.length < 6 ? 'Too short' : pw.newPassword.length < 10 ? 'Moderate' : 'Strong ✓'}
              </p>
            </div>
          )}

          <button type="submit" disabled={changingPw} className="btn-primary" style={{ width: '100%' }}>
            {changingPw ? '...' : '🔒 Update Password'}
          </button>
        </form>
      </div>

      {/* Sign out */}
      <button
        onClick={() => { logout(); window.location.href = '/login'; }}
        style={{ width: '100%', padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
      >
        🚪 Sign Out
      </button>
    </div>
  );
}
