import { useState, useEffect } from 'react';
import api from '../../lib/api';

const STATUS_LABELS = { TODO:'To Do', IN_PROGRESS:'In Progress', IN_REVIEW:'In Review', DONE:'Done' };
const STATUS_BADGE  = { TODO:'badge-gray', IN_PROGRESS:'badge-yellow', IN_REVIEW:'badge-gray', DONE:'badge-green' };
const PRI_ICONS     = { URGENT:'🔴', HIGH:'🟠', MEDIUM:'🟡', LOW:'🟢' };

export default function FounderEmployees() {
  const [tasks,       setTasks]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filters,     setFilters]     = useState({ department:'', status:'', assignedTo:'' });

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data.filter(u => u.role === 'EMPLOYEE' && u.isActive))).catch(() => {});
    api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (filters.department) q.set('department', filters.department);
    if (filters.status)     q.set('status',     filters.status);
    if (filters.assignedTo) q.set('assignedTo', filters.assignedTo);
    api.get(`/founder/overview/tasks?${q}`)
      .then(r => setTasks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const filteredUsers = filters.department ? users.filter(u => u.department === filters.department) : users;

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Employee Tasks</h1>
        <p style={{ fontSize:13, color:'#6b7280' }}>Observation view — {tasks.length} tasks</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:20, padding:14 }}>
        <select value={filters.department} onChange={e => setFilters(p => ({ ...p, department:e.target.value, assignedTo:'' }))} className="input" style={{ width:'auto', fontSize:12 }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filters.assignedTo} onChange={e => setFilters(p => ({ ...p, assignedTo:e.target.value }))} className="input" style={{ width:'auto', fontSize:12 }}>
          <option value="">All Employees</option>
          {filteredUsers.map(u => <option key={u._id || u.id} value={u._id || u.id}>{u.name}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status:e.target.value }))} className="input" style={{ width:'auto', fontSize:12 }}>
          <option value="">All Status</option>
          {['TODO','IN_PROGRESS','IN_REVIEW','DONE'].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        {(filters.department || filters.assignedTo || filters.status) && (
          <button onClick={() => setFilters({ department:'', status:'', assignedTo:'' })} style={{ background:'none', border:'1px solid #2a2a2a', color:'#9ca3af', borderRadius:8, padding:'6px 12px', fontSize:12, cursor:'pointer' }}>✕ Clear</button>
        )}
      </div>

      {/* Tasks list */}
      {loading ? (
        [1,2,3,4].map(i => <div key={i} className="card" style={{ height:72, marginBottom:10 }} />)
      ) : tasks.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:48 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>📋</div>
          <p style={{ color:'#9ca3af' }}>No tasks found</p>
        </div>
      ) : tasks.map(task => (
        <div key={task._id || task.id} className="card" style={{ marginBottom:10, opacity: task.status === 'DONE' ? 0.65 : 1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                <span>{PRI_ICONS[task.priority]}</span>
                <p style={{ fontSize:14, fontWeight:600, color: task.status === 'DONE' ? '#4b5563' : '#fff', textDecoration: task.status === 'DONE' ? 'line-through' : 'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:300 }}>{task.title}</p>
              </div>
              {task.description && <p style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>{task.description}</p>}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                <span className={STATUS_BADGE[task.status] || 'badge-gray'}>{STATUS_LABELS[task.status] || task.status}</span>
                <span style={{ fontSize:10, color:'#60a5fa', background:'rgba(96,165,250,0.1)', padding:'2px 7px', borderRadius:999 }}>🏢 {task.department}</span>
                {task.dueDate && (
                  <span style={{ fontSize:10, color: new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? '#f87171' : '#6b7280' }}>
                    📅 {new Date(task.dueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    {new Date(task.dueDate) < new Date() && task.status !== 'DONE' && ' ⚠️ Overdue'}
                  </span>
                )}
              </div>
            </div>
            {/* Assignees */}
            {task.assignedTo?.length > 0 && (
              <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                {task.assignedTo.slice(0, 3).map(a => (
                  <div key={a._id || a.id} title={a.name}
                    style={{ width:24, height:24, borderRadius:'50%', background:'rgba(57,255,20,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#39ff14', fontSize:10, fontWeight:700, border:'1px solid rgba(57,255,20,0.2)' }}>
                    {a.name?.[0]}
                  </div>
                ))}
                {task.assignedTo.length > 3 && <span style={{ fontSize:10, color:'#6b7280', alignSelf:'center' }}>+{task.assignedTo.length - 3}</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
