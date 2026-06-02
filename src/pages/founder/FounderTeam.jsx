import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import socket from '../../lib/socket';
import toast from 'react-hot-toast';

const PRI_ICONS = { URGENT:'🔴', HIGH:'🟠', MEDIUM:'🟡', LOW:'🟢' };
const STATUS_LABELS = { TODO:'To Do', IN_PROGRESS:'In Progress', DONE:'Done' };
const STATUS_BADGE  = { TODO:'badge-gray', IN_PROGRESS:'badge-yellow', DONE:'badge-green' };
const INIT_FORM = { title:'', description:'', priority:'MEDIUM', dueDate:'', note:'' };

export default function FounderTeam() {
  const { user } = useAuth();
  const [pulse,       setPulse]       = useState(null);
  const [tasks,       setTasks]       = useState([]);
  const [allUsers,    setAllUsers]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [shareTask,   setShareTask]   = useState(null);
  const [shareForm,   setShareForm]   = useState({ targetId:'', note:'', assign:false, userSearch:'' });
  const [form,        setForm]        = useState(INIT_FORM);
  const [saving,      setSaving]      = useState(false);
  const [tab,         setTab]         = useState('pulse'); // 'pulse' | 'tasks'

  const loadAll = () => {
    api.get('/founder/team/pulse').then(r => setPulse(r.data)).catch(() => {});
    api.get('/founder/tasks').then(r => setTasks(r.data)).catch(() => {}).finally(() => setLoading(false));
    api.get('/founder/all-users').then(r => setAllUsers(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadAll();
    socket.connect();
    socket.on('founder:task-shared', (data) => {
      if (data.sharedWith === (user?._id || user?.id)) {
        toast.success(`📩 ${data.sharedBy} shared "${data.taskTitle}" with you`);
        loadAll();
      }
    });
    return () => socket.off('founder:task-shared');
  }, []);

  const founders = pulse?.founders || [];

  // Filtered users for share modal
  const searchedUsers = allUsers.filter(u => {
    const q = shareForm.userSearch.toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
  });

  // Team tasks = all tasks visible to any founder
  const teamTasks = tasks;

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.post('/founder/tasks', form);
      setTasks(prev => [res.data, ...prev]);
      setShowCreate(false); setForm(INIT_FORM);
      toast.success('Task created!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const selfAssign = async (task) => {
    const id = task._id || task.id;
    try {
      const res = await api.post(`/founder/tasks/${id}/self-assign`);
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? res.data : t));
      toast.success('Task assigned to you!');
    } catch { toast.error('Failed'); }
  };

  const updateStatus = async (task, status) => {
    const id = task._id || task.id;
    try {
      const res = await api.patch(`/founder/tasks/${id}`, { status });
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? res.data : t));
      if (status === 'DONE') toast.success('Task completed! 🎉');
    } catch { toast.error('Failed'); }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareForm.targetId) return toast.error('Select a person');
    const id = shareTask._id || shareTask.id;
    const target = allUsers.find(u => (u._id || u.id) === shareForm.targetId);
    try {
      const res = await api.post(`/founder/tasks/${id}/share`, {
        targetId:   shareForm.targetId,
        assignedTo: shareForm.assign ? shareForm.targetId : undefined,
        note:       shareForm.note,
      });
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? res.data : t));
      setShareTask(null);
      setShareForm({ targetId:'', note:'', assign:false, userSearch:'' });
      toast.success(`Task shared with ${target?.name || 'user'}!`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const isOwner = (task) => {
    const cid = task.createdBy?._id || task.createdBy?.id || task.createdBy?.toString?.();
    return cid === (user?._id || user?.id);
  };

  const isSelfAssigned = (task) => {
    const aid = task.assignedTo?._id || task.assignedTo?.id || task.assignedTo?.toString?.();
    return aid === (user?._id || user?.id);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Founders Team</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>{founders.length} founders · shared workspace</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:13, padding:'10px 18px', background:'#f5e642', color:'#000' }}>+ New Task</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['pulse','📡 Team Pulse'],['tasks','✅ Team Tasks']].map(([val,label]) => (
          <button key={val} onClick={() => setTab(val)} style={{
            padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight:600, border:'none', cursor:'pointer',
            background: tab === val ? '#f5e642' : '#1a1a1a',
            color:      tab === val ? '#000' : '#9ca3af',
          }}>{label}</button>
        ))}
      </div>

      {/* PULSE TAB */}
      {tab === 'pulse' && (
        <div>
          <div className="card" style={{ marginBottom:16, background:'rgba(245,230,66,0.03)', border:'1px solid rgba(245,230,66,0.15)' }}>
            <p style={{ fontSize:12, color:'#f5e642', marginBottom:12, fontWeight:600 }}>⚡ Founders Team — Live Status</p>
            {!pulse ? (
              <div className="animate-spin" style={{ width:20, height:20, border:'2px solid #f5e642', borderTopColor:'transparent', borderRadius:'50%' }} />
            ) : founders.length === 0 ? (
              <p style={{ color:'#6b7280', fontSize:13 }}>No founders found. Add founders from Admin → Employees.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {founders.map(f => {
                  const isMe = f.id === (user?._id || user?.id);
                  return (
                    <div key={f.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background: isMe ? 'rgba(245,230,66,0.05)' : '#0a0a0a', borderRadius:10, border: isMe ? '1px solid rgba(245,230,66,0.2)' : '1px solid #1a1a1a' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(245,230,66,0.15)', border:'1px solid rgba(245,230,66,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f5e642', fontWeight:700, fontSize:14, flexShrink:0 }}>
                        {f.name[0]}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{f.name}{isMe ? ' (you)' : ''}</p>
                        <p style={{ fontSize:11, color:'#6b7280' }}>{f.designation}</p>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <span style={{ fontSize:10, color:'#f5e642', background:'rgba(245,230,66,0.1)', padding:'2px 8px', borderRadius:999, border:'1px solid rgba(245,230,66,0.2)', fontWeight:600 }}>
                          FOUNDER
                        </span>
                        <p style={{ fontSize:10, color:'#4b5563', marginTop:3 }}>No attendance req.</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TASKS TAB */}
      {tab === 'tasks' && (
        <div>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="card" style={{ height:80, marginBottom:10 }} />)
          ) : teamTasks.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:48 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
              <p style={{ color:'#9ca3af' }}>No tasks yet</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ marginTop:16, background:'#f5e642', color:'#000', fontSize:13 }}>Create First Task</button>
            </div>
          ) : teamTasks.map(task => {
            const tid   = task._id || task.id;
            const mine  = isOwner(task);
            const isDone = task.status === 'DONE';
            const assignedToMe = isSelfAssigned(task);
            return (
              <div key={tid} className="card" style={{ marginBottom:10, opacity: isDone ? 0.7 : 1, borderLeft:`3px solid ${task.isShared ? '#f5e642' : '#1f1f1f'}` }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                      <span>{PRI_ICONS[task.priority]}</span>
                      <p style={{ fontSize:14, fontWeight:600, color: isDone ? '#4b5563' : '#fff', textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</p>
                      {task.isShared && <span style={{ fontSize:10, color:'#f5e642', background:'rgba(245,230,66,0.1)', padding:'2px 7px', borderRadius:999, border:'1px solid rgba(245,230,66,0.2)' }}>📤 Shared</span>}
                      {assignedToMe && <span style={{ fontSize:10, color:'#39ff14', background:'rgba(57,255,20,0.1)', padding:'2px 7px', borderRadius:999, border:'1px solid rgba(57,255,20,0.2)' }}>📌 Mine</span>}
                      {!mine && <span style={{ fontSize:10, color:'#9ca3af', background:'#1a1a1a', padding:'2px 7px', borderRadius:999 }}>by {task.createdBy?.name}</span>}
                    </div>
                    {task.description && <p style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>{task.description}</p>}
                    {task.note && <p style={{ fontSize:11, color:'#f5e642', marginBottom:4 }}>📝 {task.note}</p>}
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span className={STATUS_BADGE[task.status]}>{STATUS_LABELS[task.status]}</span>
                      {task.dueDate && <span style={{ fontSize:10, color:'#6b7280' }}>📅 {new Date(task.dueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>}
                      {task.assignedTo && <span style={{ fontSize:10, color:'#9ca3af' }}>👤 {task.assignedTo?.name}</span>}
                      {task.sharedWith?.length > 0 && <span style={{ fontSize:10, color:'#9ca3af' }}>👥 {task.sharedWith.map(f => f.name).join(', ')}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', flexDirection:'column', gap:5, flexShrink:0 }}>
                    {!isDone && (
                      <button onClick={() => updateStatus(task, 'DONE')} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8, background:'rgba(245,230,66,0.1)', border:'1px solid rgba(245,230,66,0.3)', color:'#f5e642', cursor:'pointer' }}>✓ Done</button>
                    )}
                    {!isDone && task.status === 'TODO' && (
                      <button onClick={() => updateStatus(task, 'IN_PROGRESS')} style={{ fontSize:11, padding:'4px 8px', borderRadius:8, background:'#1a1a1a', border:'1px solid #2a2a2a', color:'#9ca3af', cursor:'pointer' }}>▶ Start</button>
                    )}
                    {!assignedToMe && !isDone && (
                      <button onClick={() => selfAssign(task)} style={{ fontSize:11, padding:'4px 8px', borderRadius:8, background:'rgba(57,255,20,0.05)', border:'1px solid rgba(57,255,20,0.2)', color:'#39ff14', cursor:'pointer' }}>📌 Take</button>
                    )}
                    <button onClick={() => setShareTask(task)} style={{ fontSize:11, padding:'4px 8px', borderRadius:8, background:'rgba(96,165,250,0.05)', border:'1px solid rgba(96,165,250,0.2)', color:'#60a5fa', cursor:'pointer' }}>📤 Share</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:440 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>New Team Task</h2>
            <form onSubmit={handleCreate}>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))} className="input" placeholder="Task title *" required style={{ marginBottom:12 }} />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))} className="input" placeholder="Description..." style={{ marginBottom:12, minHeight:56, resize:'none' }} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority:e.target.value }))} className="input">
                  {['URGENT','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{PRI_ICONS[p]} {p}</option>)}
                </select>
                <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate:e.target.value }))} className="input" />
              </div>
              <input value={form.note} onChange={e => setForm(p => ({ ...p, note:e.target.value }))} className="input" placeholder="Note..." style={{ marginBottom:16 }} />
              <div style={{ display:'flex', gap:12 }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1, background:'#f5e642', color:'#000' }}>{saving ? '...' : 'Create Task'}</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal - to anyone (founder or employee) */}
      {shareTask && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:460, maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Share / Assign Task</h2>
              <button onClick={() => setShareTask(null)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <p style={{ fontSize:12, color:'#f5e642', marginBottom:16 }}>"{shareTask.title}"</p>
            <form onSubmit={handleShare}>
              {/* Search */}
              <div style={{ marginBottom:10 }}>
                <input
                  value={shareForm.userSearch}
                  onChange={e => setShareForm(p => ({ ...p, userSearch:e.target.value, targetId:'' }))}
                  className="input" placeholder="🔍 Search by name, email, department..."
                  style={{ fontSize:13 }}
                />
              </div>

              {/* User list */}
              <div style={{ maxHeight:240, overflowY:'auto', background:'#0a0a0a', borderRadius:10, border:'1px solid #1a1a1a', padding:6, marginBottom:12 }}>
                {searchedUsers.length === 0 ? (
                  <p style={{ color:'#6b7280', fontSize:12, textAlign:'center', padding:16 }}>No users found</p>
                ) : searchedUsers.map(u => {
                  const uid = u._id || u.id;
                  const isMe = uid === (user?._id || user?.id);
                  if (isMe) return null;
                  const isSelected = shareForm.targetId === uid;
                  const roleColor  = u.role === 'FOUNDER' ? '#f5e642' : '#39ff14';
                  return (
                    <div key={uid} onClick={() => setShareForm(p => ({ ...p, targetId: uid }))}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, cursor:'pointer', background: isSelected ? `${roleColor}10` : 'transparent', border: isSelected ? `1px solid ${roleColor}33` : '1px solid transparent', marginBottom:2 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:`${roleColor}20`, display:'flex', alignItems:'center', justifyContent:'center', color:roleColor, fontWeight:700, fontSize:12, flexShrink:0 }}>{u.name[0]}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, color:'#fff', fontWeight:500 }}>{u.name}</p>
                        <p style={{ fontSize:10, color:'#6b7280' }}>{u.designation}{u.department ? ` · ${u.department}` : ''}</p>
                      </div>
                      <span style={{ fontSize:10, color:roleColor, background:`${roleColor}10`, padding:'2px 7px', borderRadius:999, border:`1px solid ${roleColor}22`, flexShrink:0 }}>{u.role}</span>
                      {isSelected && <span style={{ color:roleColor, fontSize:14 }}>✓</span>}
                    </div>
                  );
                })}
              </div>

              {/* Note */}
              <textarea value={shareForm.note} onChange={e => setShareForm(p => ({ ...p, note:e.target.value }))} className="input" placeholder="Add a note / message..." style={{ marginBottom:10, minHeight:56, resize:'none', fontSize:13 }} />

              {/* Assign toggle */}
              <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, cursor:'pointer' }}>
                <input type="checkbox" checked={shareForm.assign} onChange={e => setShareForm(p => ({ ...p, assign:e.target.checked }))} style={{ accentColor:'#f5e642', width:15, height:15 }} />
                <span style={{ fontSize:13, color:'#d1d5db' }}>Assign this task to them (make them responsible)</span>
              </label>

              {shareForm.targetId && (
                <div style={{ background:'rgba(245,230,66,0.05)', border:'1px solid rgba(245,230,66,0.15)', borderRadius:8, padding:10, marginBottom:14, fontSize:12 }}>
                  {(() => {
                    const t = allUsers.find(u => (u._id || u.id) === shareForm.targetId);
                    return t ? (
                      <p style={{ color:'#9ca3af' }}>
                        Sharing with: <strong style={{ color:'#fff' }}>{t.name}</strong>
                        {t.role === 'EMPLOYEE' ? <span style={{ color:'#f5e642' }}> · Task will also appear in their employee task list</span> : <span style={{ color:'#9ca3af' }}> · Shared in Founders workspace</span>}
                      </p>
                    ) : null;
                  })()}
                </div>
              )}

              <div style={{ display:'flex', gap:12 }}>
                <button type="submit" disabled={!shareForm.targetId} className="btn-primary" style={{ flex:1, background: shareForm.targetId ? '#f5e642' : '#2a2a2a', color: shareForm.targetId ? '#000' : '#6b7280', fontSize:13 }}>📤 Share</button>
                <button type="button" onClick={() => setShareTask(null)} className="btn-secondary" style={{ flex:1, fontSize:13 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
