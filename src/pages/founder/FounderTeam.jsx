import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import socket from '../../lib/socket';
import toast from 'react-hot-toast';

const PRI_ICONS   = { URGENT: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢' };
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const STATUS_BADGE  = { TODO: 'badge-gray', IN_PROGRESS: 'badge-yellow', DONE: 'badge-green' };
const INIT_FORM = { title:'', description:'', priority:'MEDIUM', dueDate:'', note:'' };

export default function FounderTeam() {
  const { user } = useAuth();
  const [pulse,         setPulse]         = useState(null);
  const [sharedTasks,   setSharedTasks]   = useState([]);
  const [allUsers,      setAllUsers]      = useState([]);
  const [tab,           setTab]           = useState('pulse');
  const [loading,       setLoading]       = useState(true);

  // Create task
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState(INIT_FORM);
  const [saving,     setSaving]     = useState(false);

  // Founder drawer — click on a founder to see their tasks
  const [drawerFounder, setDrawerFounder] = useState(null); // { id, name, designation }
  const [drawerTasks,   setDrawerTasks]   = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // ── load ────────────────────────────────────────────────────────────────
  const loadShared = () => {
    api.get('/founder/tasks/shared')
      .then(r => setSharedTasks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/founder/team/pulse').then(r => setPulse(r.data)).catch(() => {});
    api.get('/founder/all-users').then(r => setAllUsers(r.data)).catch(() => {});
    loadShared();

    socket.connect();
    socket.on('founder:task-shared', () => loadShared());
    return () => socket.off('founder:task-shared');
  }, []);

  // ── open founder drawer ─────────────────────────────────────────────────
  const openFounderDrawer = async (founder) => {
    setDrawerFounder(founder);
    setDrawerLoading(true);
    try {
      const res = await api.get(`/founder/tasks/by-founder/${founder.id}`);
      setDrawerTasks(res.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setDrawerLoading(false);
    }
  };

  const founders = pulse?.founders || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/founder/tasks', form);
      loadShared();
      setShowCreate(false);
      setForm(INIT_FORM);
      toast.success('Task created!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Founders Team</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>{founders.length} founders · shared workspace</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:700,
          background:'#f5e642', color:'#000', border:'none', cursor:'pointer',
        }}>+ Create Task</button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['pulse', '📡 Team Pulse'], ['tasks', '📤 Team Tasks']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={{
            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: tab === val ? '#f5e642' : '#1a1a1a',
            color:      tab === val ? '#000'    : '#9ca3af',
          }}>{label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TEAM PULSE TAB
      ══════════════════════════════════════════ */}
      {tab === 'pulse' && (
        <div>
          <div className="card" style={{ background: 'rgba(245,230,66,0.03)', border: '1px solid rgba(245,230,66,0.15)', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#f5e642', marginBottom: 12, fontWeight: 600 }}>
              ⚡ Click on a founder to view their tasks
            </p>
            {!pulse ? (
              <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid #f5e642', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : founders.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>No founders found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {founders.map(f => {
                  const isMe = f.id === (user?._id || user?.id);
                  return (
                    <div
                      key={f.id}
                      onClick={() => openFounderDrawer(f)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        background: isMe ? 'rgba(245,230,66,0.05)' : '#0a0a0a',
                        border: isMe ? '1px solid rgba(245,230,66,0.2)' : '1px solid #1a1a1a',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,230,66,0.4)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = isMe ? 'rgba(245,230,66,0.2)' : '#1a1a1a'}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,230,66,0.15)', border: '1px solid rgba(245,230,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5e642', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {f.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{f.name}{isMe ? ' (you)' : ''}</p>
                        <p style={{ fontSize: 11, color: '#6b7280' }}>{f.designation}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, color: '#f5e642', background: 'rgba(245,230,66,0.1)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(245,230,66,0.2)', fontWeight: 600 }}>
                          FOUNDER
                        </span>
                        <p style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>Click to view tasks →</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TEAM TASKS TAB — only shared tasks
      ══════════════════════════════════════════ */}
      {tab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              Tasks shared between founders — {sharedTasks.length} total
            </p>
          </div>

          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="card" style={{ height: 90, marginBottom: 10 }} />)
          ) : sharedTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 56 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📤</div>
              <p style={{ color: '#9ca3af', fontSize: 14, fontWeight: 600 }}>No shared tasks yet</p>
              <p style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>
                Go to My Tasks → share a task with another founder to see it here
              </p>
            </div>
          ) : sharedTasks.map(task => {
            const tid    = task._id || task.id;
            const isDone = task.status === 'DONE';
            return (
              <div key={tid} className="card" style={{ marginBottom: 12, opacity: isDone ? 0.7 : 1, borderLeft: '3px solid rgba(245,230,66,0.5)' }}>
                {/* Title + priority */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span>{PRI_ICONS[task.priority]}</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: isDone ? '#4b5563' : '#fff', textDecoration: isDone ? 'line-through' : 'none' }}>
                        {task.title}
                      </p>
                      <span className={STATUS_BADGE[task.status]}>{STATUS_LABELS[task.status]}</span>
                    </div>

                    {task.description && (
                      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, lineHeight: 1.5 }}>{task.description}</p>
                    )}

                    {/* ── Share details card ── */}
                    <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 10, padding: '10px 14px', marginBottom: 6 }}>
                      {/* Shared by */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(245,230,66,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5e642', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                          {task.createdBy?.name?.[0]}
                        </div>
                        <div>
                          <span style={{ fontSize: 10, color: '#6b7280' }}>Shared by </span>
                          <span style={{ fontSize: 12, color: '#f5e642', fontWeight: 600 }}>{task.createdBy?.name}</span>
                          <span style={{ fontSize: 10, color: '#4b5563' }}> · {task.createdBy?.designation}</span>
                        </div>
                      </div>

                      {/* Shared with */}
                      {task.sharedWith?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: '#6b7280', minWidth: 60 }}>Shared with</span>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {task.sharedWith.map(f => (
                              <span key={f._id || f.id} style={{ fontSize: 11, color: '#fff', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.2)', padding: '2px 8px', borderRadius: 999 }}>
                                {f.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assigned to */}
                      {task.assignedTo && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: '#6b7280', minWidth: 60 }}>Assigned to</span>
                          <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>
                            📌 {task.assignedTo?.name}
                          </span>
                        </div>
                      )}

                      {/* Note */}
                      {task.note && (
                        <div style={{ marginTop: 4, padding: '6px 10px', background: 'rgba(245,230,66,0.05)', borderLeft: '2px solid rgba(245,230,66,0.4)', borderRadius: '0 6px 6px 0' }}>
                          <span style={{ fontSize: 10, color: '#6b7280' }}>Note: </span>
                          <span style={{ fontSize: 12, color: '#d1d5db' }}>{task.note}</span>
                        </div>
                      )}
                    </div>

                    {/* Due date + share time */}
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {task.dueDate && (
                        <span style={{ fontSize: 10, color: '#6b7280' }}>
                          📅 Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: '#4b5563' }}>
                        🕐 Shared: {new Date(task.updatedAt || task.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════
          CREATE TASK MODAL
      ══════════════════════════════════════════ */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:440 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Create New Task</h2>
              <button onClick={() => setShowCreate(false)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:20 }}>✕</button>
            </div>
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
                  {saving ? '...' : '+ Create Task'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          FOUNDER DRAWER — tasks of a specific founder
      ══════════════════════════════════════════ */}
      {drawerFounder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#111', height: '100%', overflowY: 'auto', padding: 24, borderLeft: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,230,66,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5e642', fontWeight: 700, fontSize: 15 }}>
                    {drawerFounder.name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{drawerFounder.name}</p>
                    <p style={{ fontSize: 11, color: '#6b7280' }}>{drawerFounder.designation}</p>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280' }}>Personal Tasks</p>
              </div>
              <button onClick={() => { setDrawerFounder(null); setDrawerTasks([]); }}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 20, padding: 4 }}>✕</button>
            </div>

            {drawerLoading ? (
              [1, 2, 3].map(i => <div key={i} style={{ height: 70, background: '#1a1a1a', borderRadius: 10, marginBottom: 10 }} />)
            ) : drawerTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <p style={{ color: '#6b7280', fontSize: 13 }}>No tasks yet</p>
              </div>
            ) : drawerTasks.map(task => {
              const tid    = task._id || task.id;
              const isDone = task.status === 'DONE';
              return (
                <div key={tid} style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 12, padding: 14, marginBottom: 10, opacity: isDone ? 0.65 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span>{PRI_ICONS[task.priority]}</span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: isDone ? '#4b5563' : '#fff', textDecoration: isDone ? 'line-through' : 'none', flex: 1 }}>
                      {task.title}
                    </p>
                    <span className={STATUS_BADGE[task.status]}>{STATUS_LABELS[task.status]}</span>
                  </div>
                  {task.description && <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{task.description}</p>}
                  {task.note && <p style={{ fontSize: 11, color: '#f5e642', marginBottom: 4 }}>📝 {task.note}</p>}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {task.dueDate && (
                      <span style={{ fontSize: 10, color: '#6b7280' }}>
                        📅 {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {task.isShared && (
                      <span style={{ fontSize: 10, color: '#f5e642', background: 'rgba(245,230,66,0.1)', padding: '1px 7px', borderRadius: 999, border: '1px solid rgba(245,230,66,0.2)' }}>
                        📤 Shared
                      </span>
                    )}
                    {task.sharedWith?.length > 0 && (
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>
                        with {task.sharedWith.map(f => f.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
