import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const PRI_ICONS = { URGENT:'🔴', HIGH:'🟠', MEDIUM:'🟡', LOW:'🟢' };
const STATUS_LABELS = { TODO:'To Do', IN_PROGRESS:'In Progress', IN_REVIEW:'In Review', DONE:'Done' };
const STATUS_BADGE  = { TODO:'badge-gray', IN_PROGRESS:'badge-yellow', IN_REVIEW:'badge-gray', DONE:'badge-green' };

export default function EmployeeTasks() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/tasks').then(r => setTasks(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'DONE';
    if (filter === 'done')    return t.status === 'DONE';
    if (filter === 'urgent')  return t.priority === 'URGENT' || t.priority === 'HIGH';
    return true;
  });

  // Mark task as DONE directly
  const markComplete = async (task) => {
    if (task.status === 'DONE') return;
    try {
      const res = await api.patch(`/tasks/${task._id || task.id}`, { status: 'DONE' });
      setTasks(prev => prev.map(t => (t._id || t.id) === (task._id || task.id) ? res.data : t));
      toast.success('Task marked as completed! 🎉');
    } catch { toast.error('Update failed'); }
  };

  // Cycle through intermediate statuses (not DONE — use Complete button for that)
  const advanceStatus = async (task) => {
    const order = ['TODO', 'IN_PROGRESS', 'IN_REVIEW'];
    const idx = order.indexOf(task.status);
    if (idx === -1) return; // already DONE, don't cycle
    const newStatus = order[(idx + 1) % order.length];
    try {
      const res = await api.patch(`/tasks/${task._id || task.id}`, { status: newStatus });
      setTasks(prev => prev.map(t => (t._id || t.id) === (task._id || task.id) ? res.data : t));
    } catch { toast.error('Update failed'); }
  };

  const toggleSubtask = async (task, subId) => {
    const updated = task.subtasks.map(s => (s._id || s.id) === subId ? { ...s, done: !s.done } : s);
    try {
      const res = await api.patch(`/tasks/${task._id || task.id}`, { subtasks: updated });
      setTasks(prev => prev.map(t => (t._id || t.id) === (task._id || task.id) ? res.data : t));
    } catch {}
  };

  return (
    <div style={{ padding:16 }}>
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>My Tasks</h1>
        <p style={{ fontSize:12, color:'#6b7280' }}>{tasks.filter(t => t.status !== 'DONE').length} pending · {tasks.filter(t => t.status === 'DONE').length} completed</p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:16 }}>
        {[['all','All'],['pending','Pending'],['urgent','Urgent'],['done','Done']].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'6px 14px', borderRadius:999, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', whiteSpace:'nowrap',
            background: filter === val ? '#39ff14' : '#1a1a1a',
            color:      filter === val ? '#000'    : '#9ca3af',
            transition:'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Task List */}
      {loading
        ? [1,2,3].map(i => <div key={i} className="card" style={{ height:80, marginBottom:10 }} />)
        : filtered.length === 0
          ? (
            <div className="card" style={{ textAlign:'center', padding:48 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
              <p style={{ color:'#9ca3af' }}>No tasks here</p>
            </div>
          )
          : filtered.map(task => {
            const taskId = task._id || task.id;
            const isDone = task.status === 'DONE';
            return (
              <div key={taskId} className="card" style={{ marginBottom:10, opacity: isDone ? 0.65 : 1 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  {/* Status circle - cycles through TODO/IN_PROGRESS/IN_REVIEW */}
                  <button
                    onClick={() => !isDone && advanceStatus(task)}
                    title={isDone ? 'Completed' : 'Advance status'}
                    style={{ background:'none', border:'none', cursor: isDone ? 'default' : 'pointer', fontSize:20, marginTop:1, flexShrink:0, lineHeight:1 }}
                  >
                    {isDone ? '✅' : '⭕'}
                  </button>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:13 }}>{PRI_ICONS[task.priority]}</span>
                      <p style={{
                        fontSize:14, fontWeight:600,
                        color: isDone ? '#4b5563' : '#fff',
                        textDecoration: isDone ? 'line-through' : 'none',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>{task.title}</p>
                    </div>
                    {task.description && (
                      <p style={{ fontSize:12, color:'#6b7280', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.description}</p>
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap' }}>
                      <span className={STATUS_BADGE[task.status] || 'badge-gray'} style={{ fontSize:10 }}>{STATUS_LABELS[task.status]}</span>
                      {task.dueDate && (
                        <span style={{ fontSize:10, color:'#6b7280' }}>
                          📅 {new Date(task.dueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                        </span>
                      )}
                      {task.assignedByName && (
                        <span style={{ fontSize:10, color:'#6b7280' }}>👤 {task.assignedByName}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                    {/* Expand subtasks */}
                    {task.subtasks?.length > 0 && (
                      <button
                        onClick={() => setExpanded(expanded === taskId ? null : taskId)}
                        style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14 }}
                      >
                        {expanded === taskId ? '▲' : '▼'}
                      </button>
                    )}
                    {/* Complete button - only show if not done */}
                    {!isDone && (
                      <button
                        onClick={() => markComplete(task)}
                        style={{
                          background:'rgba(57,255,20,0.1)',
                          border:'1px solid rgba(57,255,20,0.3)',
                          color:'#39ff14',
                          borderRadius:8,
                          fontSize:11,
                          fontWeight:700,
                          padding:'4px 10px',
                          cursor:'pointer',
                          whiteSpace:'nowrap',
                        }}
                      >
                        ✓ Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtasks */}
                {expanded === taskId && task.subtasks?.length > 0 && (
                  <div style={{ marginTop:10, marginLeft:30, borderLeft:'1px solid #1a1a1a', paddingLeft:12 }}>
                    {task.subtasks.map(sub => (
                      <label key={sub._id || sub.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer' }}>
                        <input
                          type="checkbox"
                          checked={sub.done}
                          onChange={() => toggleSubtask(task, sub._id || sub.id)}
                          style={{ accentColor:'#39ff14', width:14, height:14 }}
                        />
                        <span style={{ fontSize:12, color: sub.done ? '#4b5563' : '#9ca3af', textDecoration: sub.done ? 'line-through' : 'none' }}>
                          {sub.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })
      }
    </div>
  );
}
