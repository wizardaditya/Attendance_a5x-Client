import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = { PRESENT:'badge-green', LATE:'badge-yellow', ABSENT:'badge-red', WFH:'badge-gray', HALF_DAY:'badge-yellow' };

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: new Date().toISOString().split('T')[0], department:'', status:'' });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [departments, setDepartments] = useState([]);

  useEffect(() => { api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filters.date) p.set('date', filters.date);
    if (filters.department) p.set('department', filters.department);
    if (filters.status) p.set('status', filters.status);
    api.get(`/attendance/all?${p}`).then(r => setRecords(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [filters]);

  const saveEdit = async (id) => {
    try {
      const res = await api.patch(`/attendance/${id}`, editData);
      setRecords(prev => prev.map(r => r.id === id ? res.data : r));
      setEditId(null); toast.success('Updated');
    } catch { toast.error('Update failed'); }
  };

  const exportCSV = () => {
    const rows = [['Name','Dept','Date','Check In','Check Out','Duration','Status','Location'],
      ...records.map(r => [r.userName, r.department, r.date,
        r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN') : '-',
        r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN') : '-',
        r.duration ? `${Math.floor(r.duration/60)}h ${r.duration%60}m` : '-',
        r.status, r.location || '-'])
    ];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `attendance-${filters.date}.csv`; a.click();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Attendance Management</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>{records.length} records</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary" style={{ fontSize:13, padding:'8px 16px' }}>⬇ Export CSV</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:20, padding:16 }}>
        <span style={{ color:'#6b7280', fontSize:13, display:'flex', alignItems:'center', gap:4 }}>🔍 Filters</span>
        <input type="date" value={filters.date} onChange={e => setFilters(p => ({ ...p, date:e.target.value }))} className="input" style={{ width:'auto', padding:'6px 12px', fontSize:13 }} />
        <select value={filters.department} onChange={e => setFilters(p => ({ ...p, department:e.target.value }))} className="input" style={{ width:'auto', padding:'6px 12px', fontSize:13 }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status:e.target.value }))} className="input" style={{ width:'auto', padding:'6px 12px', fontSize:13 }}>
          <option value="">All Status</option>
          {['PRESENT','LATE','ABSENT','WFH','HALF_DAY'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #1a1a1a' }}>
              {['Employee','Department','Date','Check In','Check Out','Duration','Status','Location','Edit'].map(h => (
                <th key={h} style={{ textAlign:'left', color:'#6b7280', fontWeight:500, padding:'12px 16px', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign:'center', padding:48, color:'#6b7280' }}>Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign:'center', padding:48, color:'#6b7280' }}>No records found</td></tr>
            ) : records.map(r => (
              <tr key={r.id} style={{ borderBottom:'1px solid #0f0f0f' }}>
                <td style={{ padding:'12px 16px', color:'#fff', fontWeight:500, whiteSpace:'nowrap' }}>{r.userName}</td>
                <td style={{ padding:'12px 16px', color:'#9ca3af' }}>{r.department}</td>
                <td style={{ padding:'12px 16px', color:'#9ca3af' }}>{r.date}</td>
                <td style={{ padding:'12px 16px', color:'#39ff14' }}>
                  {editId === r.id
                    ? <input type="time" defaultValue={r.checkIn ? new Date(r.checkIn).toTimeString().slice(0,5) : ''} onChange={e => setEditData(p => ({ ...p, checkIn:e.target.value }))} className="input" style={{ padding:'4px 8px', fontSize:12, width:110 }} />
                    : r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}
                </td>
                <td style={{ padding:'12px 16px', color:'#9ca3af' }}>
                  {editId === r.id
                    ? <input type="time" defaultValue={r.checkOut ? new Date(r.checkOut).toTimeString().slice(0,5) : ''} onChange={e => setEditData(p => ({ ...p, checkOut:e.target.value }))} className="input" style={{ padding:'4px 8px', fontSize:12, width:110 }} />
                    : r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}
                </td>
                <td style={{ padding:'12px 16px', color:'#9ca3af' }}>{r.duration ? `${Math.floor(r.duration/60)}h ${r.duration%60}m` : '—'}</td>
                <td style={{ padding:'12px 16px' }}>
                  {editId === r.id
                    ? <select defaultValue={r.status} onChange={e => setEditData(p => ({ ...p, status:e.target.value }))} className="input" style={{ padding:'4px 8px', fontSize:12, width:110 }}>
                        {['PRESENT','LATE','ABSENT','WFH','HALF_DAY'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    : <span className={STATUS_BADGE[r.status] || 'badge-gray'}>{r.status}</span>}
                </td>
                <td style={{ padding:'12px 16px', color:'#9ca3af', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.location || '—'}</td>
                <td style={{ padding:'12px 16px' }}>
                  {editId === r.id
                    ? <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => saveEdit(r.id)} style={{ background:'none', border:'none', color:'#39ff14', cursor:'pointer', fontSize:16 }}>✓</button>
                        <button onClick={() => setEditId(null)} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:16 }}>✕</button>
                      </div>
                    : <button onClick={() => { setEditId(r.id); setEditData({}); }} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14 }}>✏️</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
