import { useState, useEffect } from 'react';
import api from '../../lib/api';

const STATUS_BADGE = { PRESENT:'badge-green', LATE:'badge-yellow', ABSENT:'badge-red', WFH:'badge-gray', HALF_DAY:'badge-yellow' };

export default function FounderAttendance() {
  const [records,     setRecords]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filters,     setFilters]     = useState({ date: new Date().toISOString().split('T')[0], department:'' });

  useEffect(() => {
    api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ date: filters.date });
    if (filters.department) q.set('department', filters.department);
    api.get(`/founder/overview/attendance?${q}`)
      .then(r => setRecords(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const summary = {
    present: records.filter(r => r.status === 'PRESENT').length,
    late:    records.filter(r => r.status === 'LATE').length,
    absent:  records.filter(r => r.status === 'ABSENT').length,
  };

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Attendance Observation</h1>
        <p style={{ fontSize:13, color:'#6b7280' }}>Read-only view of employee attendance</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:20, padding:14 }}>
        <input type="date" value={filters.date} onChange={e => setFilters(p => ({ ...p, date:e.target.value }))} className="input" style={{ width:'auto' }} />
        <select value={filters.department} onChange={e => setFilters(p => ({ ...p, department:e.target.value }))} className="input" style={{ width:'auto' }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
        {[['Present', summary.present, '#39ff14'],['Late', summary.late, '#f5e642'],['Absent', summary.absent, '#f87171']].map(([label, val, color]) => (
          <div key={label} className="card" style={{ textAlign:'center', padding:14 }}>
            <p style={{ fontSize:24, fontWeight:800, color }}>{val}</p>
            <p style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #1a1a1a' }}>
              {['Employee','Department','Check In','Check Out','Duration','Status','Location'].map(h => (
                <th key={h} style={{ textAlign:'left', color:'#6b7280', fontWeight:500, padding:'12px 16px', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#6b7280' }}>Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#6b7280' }}>No records for this date</td></tr>
            ) : records.map(r => (
              <tr key={r._id || r.id} style={{ borderBottom:'1px solid #0f0f0f' }}>
                <td style={{ padding:'11px 16px', color:'#fff', fontWeight:500 }}>{r.userName}</td>
                <td style={{ padding:'11px 16px', color:'#9ca3af' }}>{r.department}</td>
                <td style={{ padding:'11px 16px', color:'#39ff14' }}>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}</td>
                <td style={{ padding:'11px 16px', color:'#9ca3af' }}>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}</td>
                <td style={{ padding:'11px 16px', color:'#9ca3af' }}>{r.duration ? `${Math.floor(r.duration/60)}h ${r.duration%60}m` : '—'}</td>
                <td style={{ padding:'11px 16px' }}><span className={STATUS_BADGE[r.status] || 'badge-gray'}>{r.status}</span></td>
                <td style={{ padding:'11px 16px', color:'#6b7280' }}>{r.location || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
