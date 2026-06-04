import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import socket from '../lib/socket';

const TABS = [
  { to: '/employee',            label: 'Home',       icon: '🏠', end: true },
  { to: '/employee/tasks',      label: 'Tasks',      icon: '📋' },
  { to: '/employee/attendance', label: 'Attendance', icon: '📅' },
  { to: '/employee/profile',    label: 'Profile',    icon: '👤' },
  { to: '/employee/settings',   label: 'Settings',   icon: '⚙️' },
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  // ── Real-time notifications via Socket.io ──────────────────────────────────
  useEffect(() => {
    // New announcement
    const onAnnouncement = (ann) => {
      toast(
        (t) => (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: 280 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>📢</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 2 }}>
                {ann.title}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>
                {ann.body?.length > 80 ? ann.body.slice(0, 80) + '…' : ann.body}
              </div>
            </div>
          </div>
        ),
        {
          duration: 6000,
          style: {
            background: '#1a1a1a',
            border: '1px solid #39ff14',
            borderRadius: 14,
            padding: '12px 16px',
            color: '#fff',
          },
          icon: null,
        }
      );
    };

    // New task assigned
    const onTaskCreated = (task) => {
      // Only show if this user is assigned
      const isAssigned = task.assignedTo?.some(
        (id) => (typeof id === 'object' ? id._id : id)?.toString() === user?._id?.toString()
      );
      if (!isAssigned) return;

      toast(
        (t) => (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: 280 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 2 }}>
                New Task: {task.title}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>
                Priority: {task.priority} · Due: {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : 'No due date'}
              </div>
            </div>
          </div>
        ),
        {
          duration: 6000,
          style: {
            background: '#1a1a1a',
            border: '1px solid #39ff14',
            borderRadius: 14,
            padding: '12px 16px',
            color: '#fff',
          },
          icon: null,
        }
      );
    };

    socket.on('announcement:new', onAnnouncement);
    socket.on('task:created',     onTaskCreated);

    return () => {
      socket.off('announcement:new', onAnnouncement);
      socket.off('task:created',     onTaskCreated);
    };
  }, [user]);
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="emp-shell">
      {/* Header */}
      <header className="emp-header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'rgba(57,255,20,0.1)', border:'1px solid rgba(57,255,20,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>⚡</div>
          <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>WORK<span style={{ color:'#39ff14' }}>SYNE</span></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#fff', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name?.split(' ')[0]}</div>
            <div style={{ fontSize:10, color:'#6b7280' }}>{user?.department}</div>
          </div>
          <button onClick={handleLogout} title="Logout" style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14, padding:4 }}>🚪</button>
        </div>
      </header>

      {/* Page content */}
      <main className="emp-content">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="emp-nav">
        {TABS.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:2, padding:'8px 0', fontSize:10, fontWeight:500, textDecoration:'none',
            color: isActive ? '#39ff14' : '#6b7280',
            transition:'color 0.15s',
            minWidth:0,
          })}>
            <span style={{ fontSize:20 }}>{icon}</span>
            <span style={{ fontSize:10 }}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
