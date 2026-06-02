import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TABS = [
  { to: '/employee', label: 'Home', icon: '🏠', end: true },
  { to: '/employee/tasks', label: 'Tasks', icon: '📋' },
  { to: '/employee/attendance', label: 'Attendance', icon: '📅' },
  { to: '/employee/profile', label: 'Profile', icon: '👤' },
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', flexDirection:'column', maxWidth:480, margin:'0 auto', position:'relative' }}>
      {/* Header */}
      <header style={{ position:'sticky', top:0, zIndex:30, background:'rgba(13,13,13,0.95)', backdropFilter:'blur(10px)', borderBottom:'1px solid #1a1a1a', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'rgba(57,255,20,0.1)', border:'1px solid rgba(57,255,20,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚡</div>
          <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>WORK<span style={{ color:'#39ff14' }}>SYNE</span></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#fff' }}>{user?.name?.split(' ')[0]}</div>
            <div style={{ fontSize:10, color:'#6b7280' }}>{user?.department}</div>
          </div>
          <button onClick={handleLogout} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14 }}>🚪</button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex:1, overflowY:'auto', paddingBottom:72 }}>
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:'rgba(13,13,13,0.95)', backdropFilter:'blur(10px)', borderTop:'1px solid #1a1a1a', display:'flex', zIndex:30 }}>
        {TABS.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            padding:'10px 0', fontSize:10, fontWeight:500, textDecoration:'none',
            color: isActive ? '#39ff14' : '#6b7280',
            transition:'color 0.15s',
          })}>
            <span style={{ fontSize:20 }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
