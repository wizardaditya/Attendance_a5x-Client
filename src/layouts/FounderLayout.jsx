import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/founder',            label: 'Overview',   icon: '📊', end: true },
  { to: '/founder/tasks',      label: 'My Tasks',   icon: '✅' },
  { to: '/founder/attendance', label: 'Attendance', icon: '📅' },
  { to: '/founder/employees',  label: 'Employees',  icon: '👥' },
];

function LiveTime() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span style={{ color:'#6b7280', fontSize:13, fontVariantNumeric:'tabular-nums' }}>{t.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</span>;
}

export default function FounderLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const h = () => { setIsMobile(window.innerWidth <= 768); if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  const SidebarContent = ({ mobile = false }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#0d0d0d', borderRight:'1px solid #1a1a1a', width: mobile ? 240 : 220 }}>
      {/* Logo */}
      <div style={{ padding:'14px 12px', borderBottom:'1px solid #1a1a1a', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:9, background:'rgba(245,230,66,0.1)', border:'1px solid rgba(245,230,66,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>⚡</div>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:'#fff', lineHeight:1 }}>WORK<span style={{ color:'#f5e642' }}>SYNE</span></div>
          <div style={{ fontSize:10, color:'#f5e642', marginTop:1, fontWeight:600 }}>FOUNDER</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => mobile && setMobileOpen(false)}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10, padding:'9px 10px',
              borderRadius:10, marginBottom:2, textDecoration:'none', fontSize:13, fontWeight:500,
              color:      isActive ? '#f5e642' : '#6b7280',
              background: isActive ? 'rgba(245,230,66,0.08)' : 'transparent',
              border:     isActive ? '1px solid rgba(245,230,66,0.2)' : '1px solid transparent',
              transition:'all 0.15s',
            })}
          >
            <span style={{ fontSize:16 }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding:'8px 6px', borderTop:'1px solid #1a1a1a' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px', background:'rgba(245,230,66,0.05)', borderRadius:10, border:'1px solid rgba(245,230,66,0.15)' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(245,230,66,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f5e642', fontWeight:700, fontSize:12, flexShrink:0 }}>
            {user?.name?.[0]}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize:10, color:'#f5e642' }}>FOUNDER</div>
          </div>
          <button onClick={handleLogout} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14 }}>🚪</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-shell" style={{ '--accent':'#f5e642' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{ flexShrink:0 }}>
          <SidebarContent />
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} className="sidebar-overlay open" />
          <div className="sidebar-drawer"><SidebarContent mobile /></div>
        </>
      )}

      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar" style={{ borderBottom:'1px solid rgba(245,230,66,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {isMobile && (
              <button onClick={() => setMobileOpen(o => !o)} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:20 }}>☰</button>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:13 }}>🕐</span>
              <LiveTime />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'#f5e642', background:'rgba(245,230,66,0.1)', border:'1px solid rgba(245,230,66,0.2)', padding:'3px 10px', borderRadius:999, fontWeight:600 }}>FOUNDER</span>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(245,230,66,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f5e642', fontWeight:700, fontSize:13 }}>
              {user?.name?.[0]}
            </div>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
