import { useState, useEffect } from 'react';
import api from '../../lib/api';

const STATUS_COLOR = { PRESENT:'#39ff14', LATE:'#f5e642', ABSENT:'#f87171', WFH:'#60a5fa', HALF_DAY:'#fb923c' };
const STATUS_BADGE = { PRESENT:'badge-green', LATE:'badge-yellow', ABSENT:'badge-red', WFH:'badge-gray', HALF_DAY:'badge-yellow' };

export default function EmployeeAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month');

  useEffect(() => {
    const now = new Date();
    let from;
    if (range === 'week') { const d = new Date(); d.setDate(d.getDate()-7); from = d.toISOString().split('T')[0]; }
    else if (range === 'month') { from = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`; }
    setLoading(true);
    api.get(`/attendance/my${from ? `?from=${from}` : ''}`).then(r => setRecords(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [range]);

  const stats = {
    present: records.filter(r => r.status === 'PRESENT').length,
    late: records.filter(r => r.status === 'LATE').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    totalMins: records.reduce((a, r) => a + (r.duration || 0), 0),
  };

  return (
    <div style={{ padding:16 }}>
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#fff' }}>My Attendance</h1>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {[['Present', stats.present, '#39ff14'],['Late', stats.late, '#f5e642'],['Absent', stats.absent, '#f87171'],['Hours', `${Math.floor(stats.totalMins/60)}h`, '#fff']].map(([label, val, color]) => (
          <div key={label} className="card" style={{ textAlign:'center', padding:16 }}>
            <p style={{ fontSize:26, fontWeight:800, color }}>{val}</p>
            <p style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Range */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['week','This Week'],['month','This Month'],['all','All Time']].map(([val,label]) => (
          <button key={val} onClick={() => setRange(val)} style={{
            padding:'6px 12px', borderRadius:999, fontSize:11, fontWeight:500, border:'none', cursor:'pointer',
            background: range === val ? '#39ff14' : '#1a1a1a', color: range === val ? '#000' : '#9ca3af'
          }}>{label}</button>
        ))}
      </div>

      {/* Records */}
      {loading ? [1,2,3,4,5].map(i => <div key={i} className="card" style={{ height:60, marginBottom:8 }} />) :
       records.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:48 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>📅</div>
          <p style={{ color:'#9ca3af', fontSize:13 }}>No attendance records</p>
        </div>
      ) : records.map(r => (
        <div key={r.id} className="card" style={{ marginBottom:8, padding:'12px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:'#fff' }}>
                {new Date(r.date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}
              </p>
              <p style={{ fontSize:11, color:'#6b7280', marginTop:3 }}>
                ⏰ {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}
                {' → '}
                {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : 'Active'}
                {r.duration ? ` · ${Math.floor(r.duration/60)}h ${r.duration%60}m` : ''}
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <span className={STATUS_BADGE[r.status] || 'badge-gray'}>{r.status}</span>
              {r.location && <p style={{ fontSize:10, color:'#4b5563', marginTop:4 }}>{r.location}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
