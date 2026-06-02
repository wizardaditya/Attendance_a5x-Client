import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin',               label: 'Dashboard',     icon: '🏠', end: true },
  { to: '/admin/attendance',    label: 'Attendance',     icon: '📅' },
  { to: '/admin/tasks',         label: 'Tasks',          icon: '📋' },
  { to: '/admin/teams',         label: 'Teams',          icon: '👥' },
  { to: '/admin/employees',     label: 'Employees',      icon: '🧑‍💼' },
  { to: '/admin/qr',            label: 'QR Manager',     icon: '📱' },
  { to: '/admin/announcements', label: 'Announcements',  icon: '📢' },
  { to: '/admin/settings',      label: 'Settings',       icon: '⚙️' },
];

function LiveTime() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span style={{ color:'#6b7280', fontSize:13, fontVariantNumeric:'tabular-nums' }}>
      {t.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
    </span>
  );
}

function SidebarNav({ collapsed, mobile, onClose, user, onLogout }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100%',
      width: mobile ? 240 : (collapsed ? 64 : 220),
      transition:'width 0.25s',
      background:'#0d0d0d',
      borderRight:'1px solid #1a1a1a',
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 12px', borderBottom:'1px solid #1a1a1a', overflow:'hidden', flexShrink:0 }}>
        <div style={{ width:32, height:32, borderRadius:9, background:'rgba(57,255,20,0.1)', border:'1px solid rgba(57,255,20,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16 }}>⚡</div>
        {(!collapsed || mobile) && (
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#fff', lineHeight:1 }}>WORK<span style={{ color:'#39ff14' }}>SYNE</span></div>
            <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>A5X Industries</div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex:1, padding:'8px 6px', overflowY:'auto' }}>
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => mobile && onClose?.()}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center',
              gap: collapsed && !mobile ? 0 : 10,
              padding: collapsed && !mobile ? '10px 0' : '9px 10px',
              justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
              borderRadius:10, marginBottom:2, textDecoration:'none',
              fontSize:13, fontWeight:500,
              color:      isActive ? '#39ff14' : '#6b7280',
              background: isActive ? 'rgba(57,255,20,0.1)' : 'transparent',
              border:     isActive ? '1px solid rgba(57,255,20,0.2)' : '1px solid transparent',
              transition:'all 0.15s',
            })}
          >
            <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
            {(!collapsed || mobile) && <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding:'8px 6px', borderTop:'1px solid #1a1a1a', flexShrink:0 }}>
        {(!collapsed || mobile) ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px', background:'#111', borderRadius:10, border:'1px solid #1f1f1f' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(57,255,20,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#39ff14', fontWeight:700, fontSize:12, flexShrink:0 }}>
              {user?.name?.[0]}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize:10, color:'#6b7280' }}>{user?.role}</div>
            </div>
            <button onClick={onLogout} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14, flexShrink:0 }} title="Logout">🚪</button>
          </div>
        ) : (
          <button onClick={onLogout} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:18, width:'100%', padding:'8px 0' }}>🚪</button>
        )}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth <= 768);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  return (
    <div className="admin-shell">

      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="admin-sidebar" style={{ width: collapsed ? 64 : 220 }}>
          <SidebarNav collapsed={collapsed} user={user} onLogout={handleLogout} />
        </div>
      )}

      {/* Mobile drawer + overlay */}
      {isMobile && mobileOpen && (
        <>
          <div
            className="sidebar-overlay open"
            onClick={() => setMobileOpen(false)}
          />
          <div className="sidebar-drawer">
            <SidebarNav mobile onClose={() => setMobileOpen(false)} user={user} onLogout={handleLogout} />
          </div>
        </>
      )}

      {/* Main area */}
      <div className="admin-main">

        {/* Topbar */}
        <header className="admin-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button
              onClick={() => isMobile ? setMobileOpen(o => !o) : setCollapsed(c => !c)}
              style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:20, lineHeight:1, padding:4 }}
              aria-label="Toggle menu"
            >☰</button>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:13 }}>🕐</span>
              <LiveTime />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Show name on tablet+ */}
            {!isMobile && (
              <span style={{ fontSize:12, color:'#9ca3af' }}>{user?.name}</span>
            )}
            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(57,255,20,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#39ff14', fontWeight:700, fontSize:13 }}>
              {user?.name?.[0]}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
