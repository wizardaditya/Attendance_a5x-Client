import { useState, useEffect } from 'react';
import api from '../../lib/api';
import socket from '../../lib/socket';
import toast from 'react-hot-toast';

const COLS = ['TODO','IN_PROGRESS','IN_REVIEW','DONE'];
const COL_LABELS = { TODO:'To Do', IN_PROGRESS:'In Progress', IN_REVIEW:'In Review', DONE:'Done' };
const COL_COLORS = { TODO:'#6b7280', IN_PROGRESS:'#f5e642', IN_REVIEW:'#60a5fa', DONE:'#39ff14' };
const PRI_BADGE = { URGENT:'badge-red', HIGH:'badge-yellow', MEDIUM:'badge-gray', LOW:'badge-green' };
const PRI_ICONS = { URGENT:'🔴', HIGH:'🟠', MEDIUM:'🟡', LOW:'🟢' };

const INIT_FORM = {
  title:'', description:'', priority:'MEDIUM', dueDate:'', estimatedDur:'',
  assignMode:'individuals',   // 'department' | 'individuals'
  department:'',
  assignedTo:[],              // user IDs for individuals mode
};

export default function AdminTasks() {
  const [tasks, setTasks]           = useState([]);
  const [users, setUsers]           = useState([]);
  const [departments, setDepts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(INIT_FORM);
  const [creating, setCreating]     = useState(false);
  const [dragTask, setDragTask]     = useState(null);

  // Filters
  const [filterDept,   setFilterDept]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPri,    setFilterPri]    = useState('');
  const [filterPerson, setFilterPerson] = useState('');

  // Department summary
  const [deptSummary, setDeptSummary] = useState({});
  const [activeTab, setActiveTab]     = useState('board'); // 'board' | 'dept'

  useEffect(() => {
    loadTasks();
    api.get('/users').then(r => setUsers(r.data.filter(u => u.role === 'EMPLOYEE' && u.isActive))).catch(() => {});
    api.get('/users/departments').then(r => setDepts(r.data)).catch(() => {});
    api.get('/tasks/department-summary').then(r => setDeptSummary(r.data)).catch(() => {});

    // Listen for employee task completions
    socket.connect();
    socket.on('task:completed', (data) => {
      toast.success(`✅ ${data.completedBy} completed "${data.taskTitle}"`, { duration: 5000 });
      loadTasks(); // refresh task board
      api.get('/tasks/department-summary').then(r => setDeptSummary(r.data)).catch(() => {});
    });
    socket.on('task:updated', () => { loadTasks(); });

    return () => {
      socket.off('task:completed');
      socket.off('task:updated');
    };
  }, []);

  const loadTasks = (params = {}) => {
    setLoading(true);
    const q = new URLSearchParams();
    if (params.department) q.set('department', params.department);
    if (params.assignedTo) q.set('assignedTo', params.assignedTo);
    if (params.status)     q.set('status', params.status);
    if (params.priority)   q.set('priority', params.priority);
    api.get(`/tasks?${q}`).then(r => setTasks(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  // Re-fetch when filters change
  useEffect(() => {
    loadTasks({ department:filterDept, assignedTo:filterPerson, status:filterStatus, priority:filterPri });
  }, [filterDept, filterPerson, filterStatus, filterPri]);

  // Employees filtered by selected department in form
  const deptEmployees = form.department
    ? users.filter(u => u.department === form.department)
    : users;

  const createTask = async (e) => {
    e.preventDefault();
    if (!form.department) { toast.error('Please select a department'); return; }
    if (form.assignMode === 'individuals' && form.assignedTo.length === 0) {
      toast.error('Select at least one person to assign'); return;
    }
    setCreating(true);
    try {
      const res = await api.post('/tasks', {
        ...form,
        estimatedDur: form.estimatedDur ? parseInt(form.estimatedDur) : null,
      });
      setTasks(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm(INIT_FORM);
      toast.success('Task created!');
      api.get('/tasks/department-summary').then(r => setDeptSummary(r.data)).catch(() => {});
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status:newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
    } catch { toast.error('Update failed'); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Deleted');
      api.get('/tasks/department-summary').then(r => setDeptSummary(r.data)).catch(() => {});
    } catch { toast.error('Failed'); }
  };

  const getName = (id) => users.find(u => u.id === id)?.name || id;

  // When department changes in form, reset assignedTo
  const handleFormDeptChange = (dept) => {
    setForm(p => ({ ...p, department:dept, assignedTo:[] }));
  };

  // Toggle all employees in a department
  const toggleAllDept = () => {
    const allIds = deptEmployees.map(u => u.id);
    const allSelected = allIds.every(id => form.assignedTo.includes(id));
    setForm(p => ({ ...p, assignedTo: allSelected ? [] : allIds }));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Task Management</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>{tasks.length} tasks shown</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:13, padding:'10px 18px' }}>+ Create Task</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['board','📋 Task Board'],['dept','🏢 By Department']].map(([val,label]) => (
          <button key={val} onClick={() => setActiveTab(val)} style={{
            padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight:600, border:'none', cursor:'pointer',
            background: activeTab===val ? '#39ff14' : '#1a1a1a',
            color: activeTab===val ? '#000' : '#9ca3af',
          }}>{label}</button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="card" style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20, padding:14 }}>
        <span style={{ color:'#6b7280', fontSize:12, display:'flex', alignItems:'center' }}>🔍 Filter:</span>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="input" style={{ width:'auto', fontSize:12, padding:'6px 10px' }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)} className="input" style={{ width:'auto', fontSize:12, padding:'6px 10px' }}>
          <option value="">All People</option>
          {(filterDept ? users.filter(u => u.department===filterDept) : users).map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input" style={{ width:'auto', fontSize:12, padding:'6px 10px' }}>
          <option value="">All Status</option>
          {COLS.map(c => <option key={c} value={c}>{COL_LABELS[c]}</option>)}
        </select>
        <select value={filterPri} onChange={e => setFilterPri(e.target.value)} className="input" style={{ width:'auto', fontSize:12, padding:'6px 10px' }}>
          <option value="">All Priority</option>
          {['URGENT','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{PRI_ICONS[p]} {p}</option>)}
        </select>
        {(filterDept||filterPerson||filterStatus||filterPri) && (
          <button onClick={() => { setFilterDept(''); setFilterPerson(''); setFilterStatus(''); setFilterPri(''); }} style={{ background:'none', border:'1px solid #2a2a2a', color:'#9ca3af', borderRadius:8, padding:'6px 12px', fontSize:12, cursor:'pointer' }}>✕ Clear</button>
        )}
      </div>

      {/* ── DEPARTMENT SUMMARY TAB ── */}
      {activeTab === 'dept' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
          {departments.map(dept => {
            const s = deptSummary[dept] || { total:0, todo:0, inProgress:0, done:0, overdue:0 };
            const deptUsers = users.filter(u => u.department === dept);
            return (
              <div key={dept} className="card" style={{ cursor:'pointer' }} onClick={() => { setFilterDept(dept); setActiveTab('board'); }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <h3 style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{dept}</h3>
                  <span style={{ fontSize:11, color:'#6b7280' }}>{deptUsers.length} people</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                  {[['Total',s.total,'#fff'],['To Do',s.todo,'#9ca3af'],['In Progress',s.inProgress,'#f5e642'],['Done',s.done,'#39ff14']].map(([l,v,c]) => (
                    <div key={l} style={{ background:'#0a0a0a', borderRadius:8, padding:'8px 10px' }}>
                      <p style={{ fontSize:18, fontWeight:800, color:c }}>{v}</p>
                      <p style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>{l}</p>
                    </div>
                  ))}
                </div>
                {s.overdue > 0 && (
                  <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'6px 10px', fontSize:12, color:'#f87171' }}>
                    ⚠️ {s.overdue} overdue task{s.overdue>1?'s':''}
                  </div>
                )}
                {deptUsers.length > 0 && (
                  <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:4 }}>
                    {deptUsers.slice(0,4).map(u => (
                      <span key={u.id} style={{ fontSize:10, color:'#9ca3af', background:'#1a1a1a', padding:'2px 8px', borderRadius:999 }}>{u.name.split(' ')[0]}</span>
                    ))}
                    {deptUsers.length > 4 && <span style={{ fontSize:10, color:'#6b7280' }}>+{deptUsers.length-4} more</span>}
                  </div>
                )}
                <p style={{ fontSize:11, color:'#39ff14', marginTop:10 }}>Click to view tasks →</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── KANBAN BOARD TAB ── */}
      {activeTab === 'board' && (
        loading ? (
          <p style={{ color:'#6b7280', textAlign:'center', padding:48 }}>Loading tasks...</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
            {COLS.map(col => {
              const colTasks = tasks.filter(t => t.status === col);
              return (
                <div key={col}
                  style={{ background:'#0d0d0d', borderRadius:16, borderTop:`2px solid ${COL_COLORS[col]}`, padding:16, minHeight:400 }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => { if (dragTask && dragTask.status !== col) updateStatus(dragTask.id, col); setDragTask(null); }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <h3 style={{ color:'#fff', fontWeight:700, fontSize:13 }}>{COL_LABELS[col]}</h3>
                    <span style={{ width:22, height:22, borderRadius:'50%', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#9ca3af', fontWeight:700 }}>{colTasks.length}</span>
                  </div>
                  {colTasks.length === 0 && (
                    <p style={{ color:'#374151', fontSize:12, textAlign:'center', marginTop:32 }}>No tasks</p>
                  )}
                  {colTasks.map(task => (
                    <div key={task.id} draggable onDragStart={() => setDragTask(task)}
                      style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:12, padding:12, marginBottom:10, cursor:'grab' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:6 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#fff', lineHeight:1.3 }}>{task.title}</p>
                        <button onClick={() => deleteTask(task.id)} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:12, flexShrink:0 }}>🗑</button>
                      </div>
                      {task.description && (
                        <p style={{ fontSize:11, color:'#6b7280', marginBottom:8, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{task.description}</p>
                      )}
                      {/* Department badge */}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                        <span className={PRI_BADGE[task.priority] || 'badge-gray'}>{task.priority}</span>
                        <span style={{ fontSize:10, color:'#60a5fa', background:'rgba(96,165,250,0.1)', padding:'2px 7px', borderRadius:999, border:'1px solid rgba(96,165,250,0.2)' }}>
                          🏢 {task.department}
                        </span>
                        {task.assignMode === 'department' && (
                          <span style={{ fontSize:10, color:'#a78bfa', background:'rgba(167,139,250,0.1)', padding:'2px 7px', borderRadius:999, border:'1px solid rgba(167,139,250,0.2)' }}>
                            Dept-wide
                          </span>
                        )}
                      </div>
                      {task.dueDate && (
                        <p style={{ fontSize:10, color:'#6b7280', marginBottom:6 }}>
                          📅 {new Date(task.dueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                        </p>
                      )}
                      {/* Assignee avatars */}
                      {task.assignees?.length > 0 && (
                        <div style={{ display:'flex', gap:3, marginBottom:8, flexWrap:'wrap' }}>
                          {task.assignees.slice(0,4).map(a => (
                            <div key={a.id} title={`${a.name} (${a.department})`}
                              style={{ width:22, height:22, borderRadius:'50%', background:'rgba(57,255,20,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#39ff14', fontSize:10, fontWeight:700, border:'1px solid rgba(57,255,20,0.2)', cursor:'default' }}>
                              {a.name[0]}
                            </div>
                          ))}
                          {task.assignees.length > 4 && (
                            <span style={{ fontSize:10, color:'#6b7280', alignSelf:'center' }}>+{task.assignees.length-4}</span>
                          )}
                        </div>
                      )}
                      <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}
                        style={{ width:'100%', background:'#0a0a0a', border:'1px solid #1a1a1a', color:'#9ca3af', fontSize:11, borderRadius:8, padding:'4px 8px', outline:'none', cursor:'pointer' }}>
                        {COLS.map(c => <option key={c} value={c}>{COL_LABELS[c]}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── CREATE TASK MODAL ── */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>Create New Task</h2>
            <form onSubmit={createTask}>

              {/* Title */}
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))}
                className="input" placeholder="Task title *" required style={{ marginBottom:12 }} />

              {/* Description */}
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))}
                className="input" placeholder="Description (optional)" style={{ marginBottom:12, minHeight:68, resize:'vertical' }} />

              {/* Priority + Due date */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, color:'#9ca3af', marginBottom:5 }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority:e.target.value }))} className="input">
                    {['URGENT','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{PRI_ICONS[p]} {p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, color:'#9ca3af', marginBottom:5 }}>Due Date</label>
                  <input type="datetime-local" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate:e.target.value }))} className="input" />
                </div>
              </div>

              {/* Estimated duration */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, color:'#9ca3af', marginBottom:5 }}>Estimated Duration (minutes)</label>
                <input type="number" value={form.estimatedDur} onChange={e => setForm(p => ({ ...p, estimatedDur:e.target.value }))}
                  className="input" placeholder="e.g. 120" />
              </div>

              {/* Department selector */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, color:'#9ca3af', marginBottom:5 }}>Department *</label>
                <select value={form.department} onChange={e => handleFormDeptChange(e.target.value)} className="input" required>
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Assignment mode toggle */}
              {form.department && (
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:11, color:'#9ca3af', marginBottom:8 }}>Assign To</label>
                  <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                    {[['individuals','👤 Specific People'],['department','🏢 Entire Department']].map(([val,label]) => (
                      <button key={val} type="button"
                        onClick={() => setForm(p => ({ ...p, assignMode:val, assignedTo:[] }))}
                        style={{
                          flex:1, padding:'8px 12px', borderRadius:10, fontSize:12, fontWeight:600,
                          border: form.assignMode===val ? '1px solid #39ff14' : '1px solid #2a2a2a',
                          background: form.assignMode===val ? 'rgba(57,255,20,0.1)' : '#1a1a1a',
                          color: form.assignMode===val ? '#39ff14' : '#9ca3af',
                          cursor:'pointer',
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Entire department info */}
                  {form.assignMode === 'department' && (
                    <div style={{ background:'rgba(57,255,20,0.05)', border:'1px solid rgba(57,255,20,0.2)', borderRadius:10, padding:12 }}>
                      <p style={{ fontSize:13, color:'#39ff14', fontWeight:600 }}>
                        ✅ Task will be assigned to all {deptEmployees.length} active employee{deptEmployees.length!==1?'s':''} in {form.department}
                      </p>
                      {deptEmployees.length === 0 && (
                        <p style={{ fontSize:12, color:'#f87171', marginTop:4 }}>⚠️ No active employees in this department yet</p>
                      )}
                      {deptEmployees.length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:8 }}>
                          {deptEmployees.map(u => (
                            <span key={u.id} style={{ fontSize:11, color:'#9ca3af', background:'#1a1a1a', padding:'2px 8px', borderRadius:999 }}>{u.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Individual people picker */}
                  {form.assignMode === 'individuals' && (
                    <div>
                      {deptEmployees.length === 0 ? (
                        <p style={{ fontSize:12, color:'#f87171', padding:'10px 0' }}>No active employees in {form.department} yet. Add employees first.</p>
                      ) : (
                        <>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                            <span style={{ fontSize:11, color:'#6b7280' }}>{form.assignedTo.length} selected</span>
                            <button type="button" onClick={toggleAllDept}
                              style={{ background:'none', border:'none', color:'#39ff14', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                              {deptEmployees.every(u => form.assignedTo.includes(u.id)) ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          <div style={{ maxHeight:160, overflowY:'auto', background:'#0a0a0a', borderRadius:10, border:'1px solid #1a1a1a', padding:8 }}>
                            {deptEmployees.map(u => (
                              <label key={u.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 8px', borderRadius:8, cursor:'pointer' }}>
                                <input type="checkbox" checked={form.assignedTo.includes(u.id)}
                                  onChange={e => setForm(p => ({ ...p, assignedTo: e.target.checked ? [...p.assignedTo, u.id] : p.assignedTo.filter(id => id !== u.id) }))}
                                  style={{ accentColor:'#39ff14', width:15, height:15 }} />
                                <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(57,255,20,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#39ff14', fontSize:12, fontWeight:700, flexShrink:0 }}>
                                  {u.name[0]}
                                </div>
                                <div>
                                  <p style={{ fontSize:13, color:'#d1d5db', fontWeight:500 }}>{u.name}</p>
                                  <p style={{ fontSize:10, color:'#6b7280' }}>{u.designation}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                <button type="submit" disabled={creating} className="btn-primary" style={{ flex:1 }}>
                  {creating
                    ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} />
                    : 'Create Task'}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setForm(INIT_FORM); }} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
