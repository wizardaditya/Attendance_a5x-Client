import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const PRI_ICONS = { URGENT:'🔴', HIGH:'🟠', MEDIUM:'🟡', LOW:'🟢' };
const STATUS_NEXT = { TODO:'IN_PROGRESS', IN_PROGRESS:'IN_REVIEW', IN_REVIEW:'DONE', DONE:'TODO' };
const STATUS_LABELS = { TODO:'To Do', IN_PROGRESS:'In Progress', IN_REVIEW:'In Review', DONE:'Done' };

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', priority:'MEDIUM', dueDate:'' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get('/tasks').then(r => setTasks(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'today') { const today = new Date().toISOString().split('T')[0]; return t.dueDate?.toString().startsWith(today) || t.status !== 'DONE'; }
    if (filter === 'done') return t.status === 'DONE';
    if (filter === 'urgent') return t.priority === 'URGENT' || t.priority === 'HIGH';
    return true;
  });

  const toggleStatus = async (task) => {
    const newStatus = STATUS_NEXT[task.status];
    try {
      const res = await api.patch(`/tasks/${task.id}`, { status:newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
      if (newStatus === 'DONE') toast.success('Task completed! 🎉');
    } catch { toast.error('Update failed'); }
  };

  const createTask = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      const res = await api.post('/tasks', form);
      setTasks(prev => [res.data, ...prev]);
      setShowCreate(false); setForm({ title:'', description:'', priority:'MEDIUM', dueDate:'' });
      toast.success('Task added!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  const toggleSubtask = async (task, subId) => {
    const updated = task.subtasks.map(s => s.id === subId ? { ...s, done:!s.done } : s);
    try {
      const res = await api.patch(`/tasks/${task.id}`, { subtasks:updated });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
    } catch {}
  };

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#fff' }}>My Tasks</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:12, padding:'8px 14px' }}>+ Add</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:16 }}>
        {[['all','All'],['today','Today'],['urgent','Urgent'],['done','Done']].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'6px 14px', borderRadius:999, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', whiteSpace:'nowrap',
            background: filter === val ? '#39ff14' : '#1a1a1a', color: filter === val ? '#000' : '#9ca3af', transition:'all 0.15s'
          }}>{label}</button>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:480 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:16 }}>New Task</h2>
            <form onSubmit={createTask}>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))} className="input" placeholder="Task title *" required autoFocus style={{ marginBottom:10 }} />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))} className="input" placeholder="Description..." style={{ marginBottom:10, minHeight:56, resize:'none', fontSize:13 }} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority:e.target.value }))} className="input" style={{ fontSize:13 }}>
                  {['URGENT','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{PRI_ICONS[p]} {p}</option>)}
                </select>
                <input type="datetime-local" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate:e.target.value }))} className="input" style={{ fontSize:13 }} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" disabled={creating} className="btn-primary" style={{ flex:1, padding:'10px' }}>
                  {creating ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} /> : 'Add Task'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flex:1, padding:'10px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task List */}
      {loading ? [1,2,3].map(i => <div key={i} className="card" style={{ height:72, marginBottom:10 }} />) :
       filtered.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:48 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
          <p style={{ color:'#9ca3af' }}>No tasks here</p>
        </div>
      ) : filtered.map(task => (
        <div key={task.id} className="card" style={{ marginBottom:10, opacity: task.status === 'DONE' ? 0.65 : 1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
            <button onClick={() => toggleStatus(task)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, marginTop:1, flexShrink:0, lineHeight:1 }}>
              {task.status === 'DONE' ? '✅' : '⭕'}
            </button>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13 }}>{PRI_ICONS[task.priority]}</span>
                <p style={{ fontSize:14, fontWeight:600, color: task.status === 'DONE' ? '#4b5563' : '#fff', textDecoration: task.status === 'DONE' ? 'line-through' : 'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.title}</p>
              </div>
              {task.description && <p style={{ fontSize:12, color:'#6b7280', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.description}</p>}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, color:'#9ca3af', background:'#1a1a1a', padding:'2px 8px', borderRadius:999 }}>{STATUS_LABELS[task.status]}</span>
                {task.dueDate && <span style={{ fontSize:10, color:'#6b7280' }}>📅 {new Date(task.dueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>}
                {task.estimatedDur && <span style={{ fontSize:10, color:'#6b7280' }}>~{task.estimatedDur}m</span>}
              </div>
            </div>
            {task.subtasks?.length > 0 && (
              <button onClick={() => setExpanded(expanded === task.id ? null : task.id)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14, flexShrink:0 }}>
                {expanded === task.id ? '▲' : '▼'}
              </button>
            )}
          </div>
          {/* Subtasks */}
          {expanded === task.id && task.subtasks?.length > 0 && (
            <div style={{ marginTop:10, marginLeft:30, borderLeft:'1px solid #1a1a1a', paddingLeft:12 }}>
              {task.subtasks.map(sub => (
                <label key={sub.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer' }}>
                  <input type="checkbox" checked={sub.done} onChange={() => toggleSubtask(task, sub.id)} style={{ accentColor:'#39ff14', width:14, height:14 }} />
                  <span style={{ fontSize:12, color: sub.done ? '#4b5563' : '#9ca3af', textDecoration: sub.done ? 'line-through' : 'none' }}>{sub.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
