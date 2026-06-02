import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';
import socket from '../../lib/socket';

const S = {
  title: { fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 },
  sub: { fontSize:13, color:'#6b7280', marginBottom:24 },
  grid4: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:24 },
  grid2: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 },
};

function KPICard({ icon, label, value, sub, color }) {
  const colors = { green:'#39ff14', yellow:'#f5e642', red:'#f87171', gray:'#9ca3af' };
  const c = colors[color] || '#39ff14';
  return (
    <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <p style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>{label}</p>
        <p style={{ fontSize:30, fontWeight:800, color:'#fff', lineHeight:1 }}>{value ?? '—'}</p>
        {sub && <p style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>{sub}</p>}
      </div>
      <div style={{ width:38, height:38, borderRadius:10, background:`${c}18`, border:`1px solid ${c}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
    </div>
  );
}

const PIE_COLORS = ['#39ff14', '#f5e642', '#ef4444', '#6b7280'];

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);
  const [taskStats, setTaskStats] = useState(null);

  useEffect(() => {
    api.get('/attendance/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/attendance/live').then(r => setLiveFeed(r.data.slice(0, 8))).catch(() => {});
    api.get('/tasks/stats').then(r => setTaskStats(r.data)).catch(() => {});

    socket.on('attendance:checkin', (record) => {
      setLiveFeed(prev => [record, ...prev].slice(0, 8));
      setStats(prev => prev ? { ...prev, checkedIn: (prev.checkedIn || 0) + 1 } : prev);
    });
    return () => socket.off('attendance:checkin');
  }, []);

  const pieData = taskStats ? [
    { name: 'Done', value: taskStats.byStatus?.DONE || 0 },
    { name: 'In Progress', value: taskStats.byStatus?.IN_PROGRESS || 0 },
    { name: 'Overdue', value: taskStats.overdue || 0 },
    { name: 'Todo', value: taskStats.byStatus?.TODO || 0 },
  ] : [];

  return (
    <div>
      <h1 style={S.title}>Command Center</h1>
      <p style={S.sub}>{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>

      <div style={S.grid4}>
        <KPICard icon="👥" label="In Office Today" value={stats?.checkedIn} sub={`of ${stats?.totalEmployees || '—'} employees`} color="green" />
        <KPICard icon="✅" label="On Time" value={stats?.present} color="green" />
        <KPICard icon="⏰" label="Late Arrivals" value={stats?.late} color="yellow" />
        <KPICard icon="❌" label="Absent" value={stats?.absent} color="red" />
      </div>

      <div style={S.grid2}>
        {/* Live Feed */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#39ff14' }} className="animate-pulse" />
            <h2 style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Live Attendance Feed</h2>
          </div>
          {liveFeed.length === 0 ? (
            <p style={{ color:'#6b7280', fontSize:13, textAlign:'center', padding:'32px 0' }}>No check-ins yet today</p>
          ) : liveFeed.map((r, i) => (
            <div key={r.id || i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#0a0a0a', borderRadius:10, border:'1px solid #1a1a1a', marginBottom:8 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(57,255,20,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#39ff14', fontWeight:700, fontSize:13, flexShrink:0 }}>
                {(r.user?.name || r.userName)?.[0]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.user?.name || r.userName}</p>
                <p style={{ fontSize:11, color:'#6b7280' }}>{r.user?.department || r.department} · {r.location}</p>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ fontSize:12, color:'#39ff14', fontWeight:600 }}>{new Date(r.checkIn).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</p>
                <span className={r.status === 'LATE' ? 'badge-yellow' : 'badge-green'}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Task Breakdown */}
        <div className="card">
          <h2 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:16 }}>Task Overview</h2>
          {taskStats ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'#111', border:'1px solid #1f1f1f', borderRadius:8, color:'#fff', fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop:8 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:PIE_COLORS[i] }} />
                      <span style={{ color:'#9ca3af' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight:600, color:'#fff' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p style={{ color:'#6b7280', fontSize:13 }}>Loading...</p>}
        </div>
      </div>
    </div>
  );
}
