import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import socket from '../../lib/socket';
import toast from 'react-hot-toast';

const PRI_ICONS  = { URGENT:'🔴', HIGH:'🟠', MEDIUM:'🟡', LOW:'🟢' };
const STATUS_LABELS = { TODO:'To Do', IN_PROGRESS:'In Progress', DONE:'Done' };
const STATUS_BADGE  = { TODO:'badge-gray', IN_PROGRESS:'badge-yellow', DONE:'badge-green' };

const INIT_FORM = { title:'', description:'', priority:'MEDIUM', dueDate:'', note:'' };

export default function FounderTasks() {
  const { user } = useAuth();
  const [tasks,       setTasks]       = useState([]);
  const [founders,    setFounders]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [showCreate,  setShowCreate]  = useState(false);
  const [shareTask,   setShareTask]   = useState(null); // task being shared
  const [shareForm,   setShareForm]   = useState({ founderId:'', note:'', assign: false });
  const [form,        setForm]        = useState(INIT_FORM);
  const [saving,      setSaving]      = useState(false);

  const loadTasks = () => {
    api.get('/founder/tasks').then(r => setTasks(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
    api.get('/founder/founders').then(r => {
      // Exclude self
      setFounders(r.data.filter(f => (f._id || f.id) !== (user?._id || user?.id)));
    }).catch(() => {});

    socket.connect();
    socket.on('founder:task-shared', (data) => {
      if (data.sharedWith === (user?._id || user?.id)) {
        toast.success(`📩 ${data.sharedBy} shared a task with you: "${data.taskTitle}"`);
        loadTasks();
      }
    });
    return () => socket.off('founder:task-shared');
  }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'mine')   return (t.createdBy?._id || t.createdBy?.id || t.createdBy) === (user?._id || user?.id);
    if (filter === 'shared') return t.isShared;
    if (filter === 'done')   return t.status === 'DONE';
    if (filter === 'pending') return t.status !== 'DONE';
    return true;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/founder/tasks', form);
      setTasks(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm(INIT_FORM);
      toast.success('Task created!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (task, status) => {
    const id = task._id || task.id;
    try {
      const res = await api.patch(`/founder/tasks/${id}`, { status });
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? res.data : t));
      if (status === 'DONE') toast.success('Task completed! 🎉');
    } catch { toast.error('Failed'); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/founder/tasks/${id}`);
      setTasks(prev => prev.filter(t => (t._id || t.id) !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareForm.founderId) return toast.error('Select a founder');
    const id = shareTask._id || shareTask.id;
    try {
      const res = await api.post(`/founder/tasks/${id}/share`, {
        founderId:  shareForm.founderId,
        assignedTo: shareForm.assign ? shareForm.founderId : undefined,
        note:       shareForm.note,
      });
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? res.data : t));
      setShareTask(null);
      setShareForm({ founderId:'', note:'', assign: false });
      toast.success('Task shared!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const isOwner = (task) => {
    const cid = task.createdBy?._id || task.createdBy?.id || task.createdBy?.toString?.();
    const uid = user?._id || user?.id;
    return cid === uid;
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>My Tasks</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>{tasks.filter(t => t.status !== 'DONE').length} pending</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:13, padding:'10px 18px', background:'#f5e642', color:'#000' }}>+ New Task</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[['all','All'],['mine','Mine'],['shared','Shared'],['pending','Pending'],['done','Done']].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'6px 14px', borderRadius:999, fontSize:12, fontWeight:500, border:'none', cursor:'pointer',
            background: filter === val ? '#f5e642' : '#1a1a1a',
            color:      filter === val ? '#000'    : '#9ca3af',
          }}>{label}</button>
        ))}
      </div>

      {/* Tasks */}
      {loading ? (
        [1,2,3].map(i => <div key={i} className="card" style={{ height:80, marginBottom:10 }} />)
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:48 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
          <p style={{ color:'#9ca3af' }}>No tasks here</p>
        </div>
      ) : filtered.map(task => {
        const tid  = task._id || task.id;
        const mine = isOwner(task);
        const isDone = task.status === 'DONE';
        return (
          <div key={tid} className="card" style={{ marginBottom:10, opacity: isDone ? 0.7 : 1, border: task.isShared ? '1px solid rgba(245,230,66,0.2)' : '1px solid #1f1f1f' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                  <span>{PRI_ICONS[task.priority]}</span>
                  <p style={{ fontSize:14, fontWeight:600, color: isDone ? '#4b5563' : '#fff', textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</p>
                  {task.isShared && <span style={{ fontSize:10, color:'#f5e642', background:'rgba(245,230,66,0.1)', padding:'2px 7px', borderRadius:999, border:'1px solid rgba(245,230,66,0.2)' }}>📤 Shared</span>}
                  {!mine && <span style={{ fontSize:10, color:'#9ca3af', background:'#1a1a1a', padding:'2px 7px', borderRadius:999 }}>from {task.createdBy?.name}</span>}
                </div>
                {task.description && <p style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>{task.description}</p>}
                {task.note && <p style={{ fontSize:11, color:'#f5e642', marginBottom:4 }}>📝 {task.note}</p>}
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span className={STATUS_BADGE[task.status]}>{STATUS_LABELS[task.status]}</span>
                  {task.dueDate && <span style={{ fontSize:10, color:'#6b7280' }}>📅 {new Date(task.dueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>}
                  {task.sharedWith?.length > 0 && <span style={{ fontSize:10, color:'#9ca3af' }}>👥 shared with {task.sharedWith.map(f => f.name).join(', ')}</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0, alignItems:'flex-end' }}>
                {!isDone && (
                  <button onClick={() => updateStatus(task, 'DONE')} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8, background:'rgba(245,230,66,0.1)', border:'1px solid rgba(245,230,66,0.3)', color:'#f5e642', cursor:'pointer' }}>
                    ✓ Done
                  </button>
                )}
                {!isDone && task.status === 'TODO' && (
                  <button onClick={() => updateStatus(task, 'IN_PROGRESS')} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, background:'#1a1a1a', border:'1px solid #2a2a2a', color:'#9ca3af', cursor:'pointer' }}>
                    ▶ Start
                  </button>
                )}
                {mine && founders.length > 0 && (
                  <button onClick={() => setShareTask(task)} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, background:'rgba(57,255,20,0.05)', border:'1px solid rgba(57,255,20,0.2)', color:'#39ff14', cursor:'pointer' }}>
                    📤 Share
                  </button>
                )}
                {mine && (
                  <button onClick={() => deleteTask(tid)} style={{ fontSize:11, padding:'4px 8px', borderRadius:8, background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}>🗑</button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:440 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>New Task</h2>
            <form onSubmit={handleCreate}>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))} className="input" placeholder="Task title *" required style={{ marginBottom:12 }} />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))} className="input" placeholder="Description (optional)" style={{ marginBottom:12, minHeight:60, resize:'none' }} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority:e.target.value }))} className="input">
                  {['URGENT','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{PRI_ICONS[p]} {p}</option>)}
                </select>
                <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate:e.target.value }))} className="input" />
              </div>
              <input value={form.note} onChange={e => setForm(p => ({ ...p, note:e.target.value }))} className="input" placeholder="Note (optional)" style={{ marginBottom:16 }} />
              <div style={{ display:'flex', gap:12 }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, background:'#f5e642', color:'#000' }}>
                  {saving ? '...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareTask && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:400 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>Share Task</h2>
            <p style={{ fontSize:12, color:'#f5e642', marginBottom:20 }}>"{shareTask.title}"</p>
            <form onSubmit={handleShare}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Share with Founder *</label>
                <select value={shareForm.founderId} onChange={e => setShareForm(p => ({ ...p, founderId:e.target.value }))} className="input" required>
                  <option value="">Select founder...</option>
                  {founders.map(f => <option key={f._id || f.id} value={f._id || f.id}>{f.name} — {f.designation}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Note / Message</label>
                <textarea value={shareForm.note} onChange={e => setShareForm(p => ({ ...p, note:e.target.value }))} className="input" placeholder="Add a note for them..." style={{ minHeight:60, resize:'none' }} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, cursor:'pointer' }}>
                <input type="checkbox" checked={shareForm.assign} onChange={e => setShareForm(p => ({ ...p, assign:e.target.checked }))} style={{ accentColor:'#f5e642', width:15, height:15 }} />
                <span style={{ fontSize:13, color:'#d1d5db' }}>Assign this task to them</span>
              </label>
              <div style={{ display:'flex', gap:12 }}>
                <button type="submit" className="btn-primary" style={{ flex:1, background:'#f5e642', color:'#000', fontSize:13 }}>📤 Share</button>
                <button type="button" onClick={() => setShareTask(null)} className="btn-secondary" style={{ flex:1, fontSize:13 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
