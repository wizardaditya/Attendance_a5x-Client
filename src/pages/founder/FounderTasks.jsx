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
  const [shareTask,   setShareTask]   = useState(null);
  const [shareForm,   setShareForm]   = useState({ selectedIds: [], note: '', assignTo: '' });
  const [form,        setForm]        = useState(INIT_FORM);
  const [saving,      setSaving]      = useState(false);

  const loadTasks = () => {
    api.get('/founder/tasks?mine=true').then(r => setTasks(r.data)).catch(() => {}).finally(() => setLoading(false));
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

  const isOwner = (task) => {
    const cid = task.createdBy?._id?.toString?.() || task.createdBy?.id?.toString?.() || task.createdBy?.toString?.();
    const uid = user?._id?.toString?.() || user?.id?.toString?.();
    return !!(cid && uid && cid === uid);
  };

  const filtered = tasks.filter(t => {
    if (filter === 'mine')    return true; // all tasks here are mine (mine=true from API)
    if (filter === 'shared')  return t.isShared;
    if (filter === 'done')    return t.status === 'DONE';
    if (filter === 'pending') return t.status !== 'DONE';
    return true; // 'all'
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
    if (shareForm.selectedIds.length === 0) return toast.error('Select at least one founder');
    const id = shareTask._id || shareTask.id;
    setSaving(true);
    try {
      // Share with each selected founder one by one
      let lastRes = null;
      for (const fid of shareForm.selectedIds) {
        const res = await api.post(`/founder/tasks/${id}/share`, {
          targetId:   fid,
          assignedTo: shareForm.assignTo === fid ? fid : undefined,
          note:       shareForm.note,
        });
        lastRes = res;
      }
      if (lastRes) setTasks(prev => prev.map(t => (t._id || t.id) === id ? lastRes.data : t));
      setShareTask(null);
      setShareForm({ selectedIds: [], note: '', assignTo: '' });
      toast.success(`Task shared with ${shareForm.selectedIds.length} founder${shareForm.selectedIds.length > 1 ? 's' : ''}!`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const toggleFounder = (fid) => {
    setShareForm(p => ({
      ...p,
      selectedIds: p.selectedIds.includes(fid)
        ? p.selectedIds.filter(id => id !== fid)
        : [...p.selectedIds, fid],
      // reset assignTo if that founder was deselected
      assignTo: p.assignTo === fid && p.selectedIds.includes(fid) ? '' : p.assignTo,
    }));
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
          <div className="card-glow" style={{ width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Share Task</h2>
              <button onClick={() => setShareTask(null)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <p style={{ fontSize:12, color:'#f5e642', marginBottom:18 }}>"{shareTask.title}"</p>

            <form onSubmit={handleShare}>
              {/* Multi-select founders */}
              <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:8 }}>
                Select Founders <span style={{ color:'#6b7280' }}>(select one or more)</span>
              </label>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14, maxHeight:220, overflowY:'auto', paddingRight:4 }}>
                {founders.length === 0 ? (
                  <p style={{ color:'#6b7280', fontSize:12 }}>No other founders found</p>
                ) : founders.map(f => {
                  const fid = f._id || f.id;
                  const isSelected = shareForm.selectedIds.includes(fid);
                  return (
                    <div key={fid}
                      onClick={() => toggleFounder(fid)}
                      style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding:'10px 12px', borderRadius:10, cursor:'pointer',
                        background: isSelected ? 'rgba(245,230,66,0.08)' : '#0a0a0a',
                        border: isSelected ? '1px solid rgba(245,230,66,0.4)' : '1px solid #1f1f1f',
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Checkbox visual */}
                      <div style={{
                        width:18, height:18, borderRadius:5, border: isSelected ? '2px solid #f5e642' : '2px solid #3a3a3a',
                        background: isSelected ? '#f5e642' : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                        transition:'all 0.15s',
                      }}>
                        {isSelected && <span style={{ color:'#000', fontSize:11, fontWeight:900 }}>✓</span>}
                      </div>

                      <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(245,230,66,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f5e642', fontWeight:700, fontSize:12, flexShrink:0 }}>
                        {f.name[0]}
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, color:'#fff', fontWeight:500 }}>{f.name}</p>
                        <p style={{ fontSize:10, color:'#6b7280' }}>{f.designation}</p>
                      </div>

                      {/* Assign radio — only show if selected */}
                      {isSelected && (
                        <div
                          onClick={ev => { ev.stopPropagation(); setShareForm(p => ({ ...p, assignTo: p.assignTo === fid ? '' : fid })); }}
                          title="Mark as assigned to this founder"
                          style={{
                            fontSize:10, padding:'2px 8px', borderRadius:999, cursor:'pointer', flexShrink:0,
                            background: shareForm.assignTo === fid ? 'rgba(57,255,20,0.15)' : '#1a1a1a',
                            border: shareForm.assignTo === fid ? '1px solid rgba(57,255,20,0.4)' : '1px solid #2a2a2a',
                            color: shareForm.assignTo === fid ? '#39ff14' : '#6b7280',
                          }}
                        >
                          📌 Assign
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected summary */}
              {shareForm.selectedIds.length > 0 && (
                <div style={{ background:'rgba(245,230,66,0.05)', border:'1px solid rgba(245,230,66,0.15)', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:12 }}>
                  <span style={{ color:'#f5e642', fontWeight:600 }}>{shareForm.selectedIds.length}</span>
                  <span style={{ color:'#9ca3af' }}> founder{shareForm.selectedIds.length > 1 ? 's' : ''} selected</span>
                  {shareForm.assignTo && (
                    <span style={{ color:'#39ff14' }}>
                      {' · '}📌 Assigned to {founders.find(f => (f._id || f.id) === shareForm.assignTo)?.name}
                    </span>
                  )}
                </div>
              )}

              {/* Note */}
              <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Note / Message</label>
              <textarea
                value={shareForm.note}
                onChange={e => setShareForm(p => ({ ...p, note:e.target.value }))}
                className="input"
                placeholder="Add a note for them..."
                style={{ minHeight:60, resize:'none', marginBottom:18 }}
              />

              <div style={{ display:'flex', gap:12 }}>
                <button
                  type="submit"
                  disabled={saving || shareForm.selectedIds.length === 0}
                  className="btn-primary"
                  style={{ flex:1, background: shareForm.selectedIds.length > 0 ? '#f5e642' : '#2a2a2a', color: shareForm.selectedIds.length > 0 ? '#000' : '#6b7280', fontSize:13 }}
                >
                  {saving ? '...' : `📤 Share${shareForm.selectedIds.length > 1 ? ` (${shareForm.selectedIds.length})` : ''}`}
                </button>
                <button type="button" onClick={() => { setShareTask(null); setShareForm({ selectedIds:[], note:'', assignTo:'' }); }} className="btn-secondary" style={{ flex:1, fontSize:13 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
