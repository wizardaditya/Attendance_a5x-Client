import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// ── Section wrapper defined OUTSIDE to prevent remount on state change ──────
function Section({ icon, title, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span>{icon}</span>{title}
      </h2>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const { user } = useAuth();

  const [office, setOffice] = useState({
    officeName:  'A5X Industries',
    address:     'Mumbai, Maharashtra, India',
    startTime:   '09:00',
    endTime:     '18:00',
    gracePeriod: 30,
    timezone:    'Asia/Kolkata',
    workDays:    'Mon-Sat',
  });
  const [savingOffice,    setSavingOffice]    = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Password — separate state, not shared with office saving
  const [pw,         setPw]         = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showCon,    setShowCon]    = useState(false);

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
    setSavingOffice(true);
    try {
      await api.post('/settings', office);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSavingOffice(false);
    }
  };

  const changePw = async (e) => {
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

  const pwStrength = pw.newPassword.length < 6 ? { w: '20%', c: '#f87171', l: 'Too short' }
    : pw.newPassword.length < 10 ? { w: '55%', c: '#f5e642', l: 'Moderate' }
    : { w: '100%', c: '#39ff14', l: 'Strong ✓' };

  const lateTime = (() => {
    const [h, m] = office.startTime.split(':').map(Number);
    const total  = h * 60 + m + Number(office.gracePeriod);
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  })();

  if (loadingSettings) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ color: '#6b7280' }}>Loading settings...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Settings</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Configure your WorkSyne instance</p>

      {/* ── Office Configuration ── */}
      <Section icon="🏢" title="Office Configuration">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Office Name</label>
            <input
              value={office.officeName}
              onChange={e => setOffice(p => ({ ...p, officeName: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Timezone</label>
            <select value={office.timezone} onChange={e => setOffice(p => ({ ...p, timezone: e.target.value }))} className="input">
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Work Start</label>
            <input type="time" value={office.startTime} onChange={e => setOffice(p => ({ ...p, startTime: e.target.value }))} className="input" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Work End</label>
            <input type="time" value={office.endTime} onChange={e => setOffice(p => ({ ...p, endTime: e.target.value }))} className="input" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Grace Period (min)</label>
            <input
              type="number" min="0" max="120"
              value={office.gracePeriod}
              onChange={e => setOffice(p => ({ ...p, gracePeriod: Number(e.target.value) }))}
              className="input"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Work Days</label>
            <select value={office.workDays} onChange={e => setOffice(p => ({ ...p, workDays: e.target.value }))} className="input">
              <option value="Mon-Fri">Monday – Friday</option>
              <option value="Mon-Sat">Monday – Saturday</option>
              <option value="Mon-Sun">Monday – Sunday</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Office Address</label>
          <textarea
            value={office.address}
            onChange={e => setOffice(p => ({ ...p, address: e.target.value }))}
            className="input" placeholder="Office address" rows={2}
            style={{ resize: 'vertical', minHeight: 44 }}
          />
        </div>

        <div style={{ background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#9ca3af' }}>
          ⏰ Employees checking in after <span style={{ color: '#39ff14', fontWeight: 600 }}>{lateTime}</span> will be marked as <span style={{ color: '#f5e642', fontWeight: 600 }}>LATE</span>
        </div>

        <button onClick={saveOffice} disabled={savingOffice} className="btn-primary" style={{ fontSize: 13 }}>
          {savingOffice ? 'Saving...' : '💾 Save Settings'}
        </button>
      </Section>

      {/* ── Change Password ── */}
      <Section icon="🔐" title="Change Password">
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Minimum 6 characters</p>
        <form onSubmit={changePw}>

          {/* Current password */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              type={showCur ? 'text' : 'password'}
              value={pw.currentPassword}
              onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))}
              className="input" placeholder="Current password" required
              style={{ paddingRight: 42 }}
            />
            <button type="button" onClick={() => setShowCur(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 15 }}>
              {showCur ? '🙈' : '👁'}
            </button>
          </div>

          {/* New password */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              type={showNew ? 'text' : 'password'}
              value={pw.newPassword}
              onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))}
              className="input" placeholder="New password" required
              style={{ paddingRight: 42 }}
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 15 }}>
              {showNew ? '🙈' : '👁'}
            </button>
          </div>

          {/* Confirm password */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              type={showCon ? 'text' : 'password'}
              value={pw.confirmPassword}
              onChange={e => setPw(p => ({ ...p, confirmPassword: e.target.value }))}
              className="input" placeholder="Confirm new password" required
              style={{ paddingRight: 42 }}
            />
            <button type="button" onClick={() => setShowCon(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 15 }}>
              {showCon ? '🙈' : '👁'}
            </button>
          </div>

          {pw.newPassword && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 3, background: '#1a1a1a', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, transition: 'width 0.3s', width: pwStrength.w, background: pwStrength.c }} />
              </div>
              <p style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>{pwStrength.l}</p>
            </div>
          )}

          <button type="submit" disabled={changingPw} className="btn-primary" style={{ fontSize: 13 }}>
            {changingPw ? 'Updating...' : '🔐 Update Password'}
          </button>
        </form>
      </Section>

      {/* ── System Info ── */}
      <Section icon="ℹ️" title="System Info">
        {[
          ['App Name',   'WorkSyne'],
          ['Company',    office.officeName],
          ['Admin',      user?.name || '—'],
          ['Version',    '1.0.0'],
          ['Work Hours', `${office.startTime} – ${office.endTime}`],
          ['Late After', `${office.gracePeriod} min grace period`],
          ['Auth',       'JWT (7 day tokens)'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
            <span style={{ color: '#6b7280' }}>{k}</span>
            <span style={{ color: '#39ff14', fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </Section>

      {/* ── DB Cleanup ── */}
      <Section icon="🧹" title="Database Cleanup">
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
          Remove all inactive/deleted users from MongoDB Atlas and clean up their orphaned attendance records.
        </p>
        <button
          onClick={async () => {
            if (!window.confirm('Permanently remove all inactive users and their data?')) return;
            try {
              const res = await api.delete('/users/cleanup/inactive');
              toast.success(`Cleanup done: ${res.data.usersDeleted} users, ${res.data.attendanceOrphansDeleted} attendance records removed`);
            } catch (err) {
              toast.error(err.response?.data?.error || 'Cleanup failed');
            }
          }}
          className="btn-danger" style={{ fontSize: 13 }}
        >
          🧹 Clean Up Inactive Users
        </button>
      </Section>
    </div>
  );
}
