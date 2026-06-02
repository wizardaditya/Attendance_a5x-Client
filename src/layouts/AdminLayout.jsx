import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/admin/attendance', label: 'Attendance', icon: '📅' },
  { to: '/admin/tasks', label: 'Tasks', icon: '📋' },
  { to: '/admin/employees', label: 'Employees', icon: '👥' },
  { to: '/admin/qr', label: 'QR Manager', icon: '📱' },
  { to: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

function LiveTime() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span style={{ color:'#6b7280', fontSize:13, fontVariantNumeric:'tabular-nums' }}>{t.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</span>;
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  const sidebarW = collapsed ? 64 : 220;

  const SidebarContent = ({ mobile = false }) => (
    <div style={{
      display:'flex', flexDirection:'column', height:'100%',
      background:'#0d0d0d', borderRight:'1px solid #1a1a1a',
      width: mobile ? 240 : sidebarW, transition:'width 0.25s',
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 14px', borderBottom:'1px solid #1a1a1a', overflow:'hidden' }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'rgba(57,255,20,0.1)', border:'1px solid rgba(57,255,20,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>⚡</div>
        {(!collapsed || mobile) && (
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:'#fff', lineHeight:1 }}>WORK<span style={{ color:'#39ff14' }}>SYNE</span></div>
            <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>A5X Industries</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => mobile && setMobileOpen(false)}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding: collapsed && !mobile ? '10px 0' : '10px 12px',
              justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
              borderRadius:10, marginBottom:2, textDecoration:'none', fontSize:13, fontWeight:500,
              color: isActive ? '#39ff14' : '#6b7280',
              background: isActive ? 'rgba(57,255,20,0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(57,255,20,0.2)' : '1px solid transparent',
              transition:'all 0.15s',
            })}
          >
            <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding:'10px 8px', borderTop:'1px solid #1a1a1a' }}>
        {(!collapsed || mobile) ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#111', borderRadius:10, border:'1px solid #1f1f1f' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(57,255,20,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#39ff14', fontWeight:700, fontSize:13, flexShrink:0 }}>
              {user?.name?.[0]}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize:10, color:'#6b7280' }}>{user?.role}</div>
            </div>
            <button onClick={handleLogout} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14 }} title="Logout">🚪</button>
          </div>
        ) : (
          <button onClick={handleLogout} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:18, width:'100%', padding:'8px 0' }}>🚪</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', height:'100vh', background:'#0a0a0a', overflow:'hidden' }}>
      {/* Desktop sidebar */}
      <div style={{ display:'flex', flexDirection:'column', flexShrink:0 }} className="desktop-sidebar">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:40 }} />
          <div style={{ position:'fixed', left:0, top:0, height:'100%', zIndex:50 }}>
            <SidebarContent mobile />
          </div>
        </>
      )}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Topbar */}
        <header style={{ height:52, background:'#0d0d0d', borderBottom:'1px solid #1a1a1a', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(!mobileOpen); }}
              style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:18 }}>☰</button>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13 }}>🕐</span>
              <LiveTime />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(57,255,20,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#39ff14', fontWeight:700, fontSize:13 }}>
              {user?.name?.[0]}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, overflowY:'auto', padding:24 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
