import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function FounderOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/founder/overview/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const KPI = ({ icon, label, value, sub, color = '#f5e642' }) => (
    <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <p style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>{label}</p>
        <p style={{ fontSize:32, fontWeight:800, color:'#fff', lineHeight:1 }}>{value ?? '—'}</p>
        {sub && <p style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>{sub}</p>}
      </div>
      <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom:24, border:'1px solid rgba(245,230,66,0.2)', background:'rgba(245,230,66,0.03)', display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:52, height:52, borderRadius:14, background:'rgba(245,230,66,0.15)', border:'1px solid rgba(245,230,66,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
          {user?.name?.[0]}
        </div>
        <div>
          <p style={{ fontSize:12, color:'#9ca3af' }}>{greeting()}</p>
          <h1 style={{ fontSize:20, fontWeight:800, color:'#fff' }}>{user?.name} 👋</h1>
          <p style={{ fontSize:12, color:'#f5e642', marginTop:2 }}>
            {user?.designation || 'Founder'} · {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="card" style={{ height:100 }} />)}
        </div>
      ) : stats ? (
        <>
          <h2 style={{ fontSize:13, fontWeight:700, color:'#9ca3af', marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>Today's Attendance</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16, marginBottom:28 }}>
            <KPI icon="👥" label="Total Employees"  value={stats.attendance.totalEmployees} color="#f5e642" />
            <KPI icon="✅" label="Checked In"        value={stats.attendance.checkedIn}      color="#39ff14" />
            <KPI icon="🟢" label="On Time"           value={stats.attendance.present}        color="#39ff14" />
            <KPI icon="⏰" label="Late Arrivals"     value={stats.attendance.late}           color="#f5e642" />
            <KPI icon="❌" label="Absent"            value={stats.attendance.absent}         color="#f87171" />
          </div>

          <h2 style={{ fontSize:13, fontWeight:700, color:'#9ca3af', marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>Task Overview</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16 }}>
            <KPI icon="📋" label="Total Tasks"   value={stats.tasks.total}   color="#9ca3af" />
            <KPI icon="✅" label="Completed"     value={stats.tasks.done}    color="#39ff14" />
            <KPI icon="⏳" label="Pending"       value={stats.tasks.pending} color="#f5e642" />
            <KPI icon="🔴" label="Overdue"       value={stats.tasks.overdue} color="#f87171" />
          </div>
        </>
      ) : (
        <p style={{ color:'#6b7280' }}>Failed to load stats</p>
      )}
    </div>
  );
}
