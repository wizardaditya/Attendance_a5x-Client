import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import socket from '../../lib/socket';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:32, fontWeight:800, color:'#fff', fontVariantNumeric:'tabular-nums' }}>
        {time.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
      </div>
      <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>
        {time.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [teamStatus, setTeamStatus] = useState([]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    api.get('/attendance/today').then(r => setAttendance(r.data)).catch(() => {});
    api.get('/tasks/today').then(r => setTasks(r.data)).catch(() => {});
    api.get('/announcements').then(r => setAnnouncements(r.data.slice(0,3))).catch(() => {});
    api.get('/attendance/live').then(r => setTeamStatus(r.data.slice(0,6))).catch(() => {});
    socket.on('attendance:checkin', () => {
      api.get('/attendance/live').then(r => setTeamStatus(r.data.slice(0,6))).catch(() => {});
    });
    return () => socket.off('attendance:checkin');
  }, []);

  useEffect(() => {
    if (attendance?.checkIn && !attendance?.checkOut) {
      const update = () => setElapsed(Math.floor((Date.now() - new Date(attendance.checkIn)) / 60000));
      update();
      const t = setInterval(update, 60000);
      return () => clearInterval(t);
    }
  }, [attendance]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const Card = ({ children, style = {} }) => (
    <div className="card" style={{ marginBottom:16, ...style }}>{children}</div>
  );

  const SectionTitle = ({ icon, title }) => (
    <h2 style={{ fontSize:14, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
      <span>{icon}</span>{title}
    </h2>
  );

  return (
    <div style={{ padding:16 }}>
      {/* Greeting */}
      <Card style={{ textAlign:'center', padding:24, border:'1px solid rgba(57,255,20,0.2)', boxShadow:'0 0 30px rgba(57,255,20,0.05)' }}>
        <p style={{ color:'#9ca3af', fontSize:13 }}>{greeting()},</p>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#fff', margin:'4px 0' }}>{user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color:'#6b7280', fontSize:12 }}>{user?.designation} · {user?.department}</p>
        <div style={{ marginTop:16 }}><LiveClock /></div>
      </Card>

      {/* Attendance */}
      <Card>
        <SectionTitle icon="⏰" title="Today's Attendance" />
        {attendance ? (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
              {[
                ['Check In', attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—', '#39ff14'],
                ['Duration', attendance.checkOut ? `${Math.floor(attendance.duration/60)}h ${attendance.duration%60}m` : `${Math.floor(elapsed/60)}h ${elapsed%60}m`, '#fff'],
                ['Status', attendance.status, attendance.status === 'LATE' ? '#f5e642' : '#39ff14'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background:'#0a0a0a', borderRadius:10, padding:10, textAlign:'center' }}>
                  <p style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{label}</p>
                  <p style={{ fontSize:13, fontWeight:700, color }}>{val}</p>
                </div>
              ))}
            </div>
            {attendance.location && <p style={{ fontSize:11, color:'#6b7280' }}>📍 {attendance.location}</p>}
            {attendance.latitude && <p style={{ fontSize:11, color:'#39ff14', marginTop:2 }}>🌐 {attendance.latitude.toFixed(4)}, {attendance.longitude.toFixed(4)}</p>}
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <p style={{ color:'#6b7280', fontSize:13 }}>Not checked in yet today</p>
            <p style={{ color:'#4b5563', fontSize:11, marginTop:4 }}>Scan the office QR code to mark attendance</p>
          </div>
        )}
      </Card>

      {/* Tasks */}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <SectionTitle icon="⚡" title="Today's Tasks" />
          <span style={{ fontSize:12, color:'#9ca3af' }}>{doneTasks}/{tasks.length}</span>
        </div>
        <div style={{ background:'#1a1a1a', borderRadius:999, height:6, marginBottom:8 }}>
          <div style={{ height:6, borderRadius:999, background:'linear-gradient(90deg,#39ff14,#f5e642)', width:`${progress}%`, transition:'width 0.8s ease' }} />
        </div>
        <p style={{ fontSize:11, color:'#6b7280', marginBottom:10 }}>{progress}% complete</p>
        {tasks.slice(0,4).map(task => (
          <div key={task.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'#0a0a0a', borderRadius:10, marginBottom:6 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background: task.status === 'DONE' ? '#39ff14' : task.priority === 'URGENT' ? '#f87171' : '#f5e642' }} />
            <span style={{ fontSize:13, flex:1, color: task.status === 'DONE' ? '#4b5563' : '#d1d5db', textDecoration: task.status === 'DONE' ? 'line-through' : 'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.title}</span>
            <span style={{ fontSize:10, color:'#6b7280', flexShrink:0 }}>{task.priority}</span>
          </div>
        ))}
        {tasks.length === 0 && <p style={{ color:'#6b7280', fontSize:13, textAlign:'center', padding:'8px 0' }}>No tasks for today</p>}
      </Card>

      {/* Team Pulse */}
      <Card>
        <SectionTitle icon="👥" title="Team Pulse" />
        {teamStatus.length === 0
          ? <p style={{ color:'#6b7280', fontSize:13, textAlign:'center', padding:'8px 0' }}>No team members checked in yet</p>
          : <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {teamStatus.map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'#0a0a0a', borderRadius:10, padding:'6px 10px' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'#39ff14' }} className="animate-pulse" />
                  <span style={{ fontSize:12, color:'#d1d5db' }}>{(r.user?.name || r.userName)?.split(' ')[0]}</span>
                </div>
              ))}
            </div>
        }
      </Card>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card>
          <SectionTitle icon="📢" title="Announcements" />
          {announcements.map(ann => (
            <div key={ann.id} style={{ padding:12, background:'#0a0a0a', borderRadius:10, border: ann.pinned ? '1px solid rgba(245,230,66,0.2)' : '1px solid #1a1a1a', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                {ann.pinned && <span style={{ fontSize:12 }}>📌</span>}
                <h3 style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{ann.title}</h3>
              </div>
              <p style={{ fontSize:12, color:'#9ca3af', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{ann.body}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
