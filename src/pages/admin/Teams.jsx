import { useState, useEffect, useCallback } from 'react';import api from '../../lib/api';
import toast from 'react-hot-toast';

const TEAM_COLORS = ['#39ff14','#3b82f6','#f5e642','#f87171','#a78bfa','#fb923c','#34d399','#f472b6'];

const INIT_FORM = { name:'', department:'', description:'', color:'#39ff14', members:[], lead:'', memberMode:'department' };
// memberMode: 'department' = pick from one dept | 'individual' = pick anyone cross-dept

// Cross-department individual picker with dept filter
function IndividualPicker({ users, departments, selected, color, onChange }) {
  const [deptFilter, setDeptFilter] = useState('');
  const shown = deptFilter ? users.filter(u => u.department === deptFilter && u.isActive) : users.filter(u => u.isActive);

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
        <button type="button" onClick={() => setDeptFilter('')}
          style={{ padding:'4px 10px', borderRadius:999, fontSize:11, fontWeight:600, border: deptFilter === '' ? `1px solid ${color}` : '1px solid #2a2a2a', background: deptFilter === '' ? `${color}15` : '#1a1a1a', color: deptFilter === '' ? color : '#9ca3af', cursor:'pointer' }}>
          All
        </button>
        {departments.map(d => (
          <button key={d} type="button" onClick={() => setDeptFilter(d)}
            style={{ padding:'4px 10px', borderRadius:999, fontSize:11, fontWeight:600, border: deptFilter === d ? `1px solid ${color}` : '1px solid #2a2a2a', background: deptFilter === d ? `${color}15` : '#1a1a1a', color: deptFilter === d ? color : '#9ca3af', cursor:'pointer' }}>
            {d}
          </button>
        ))}
      </div>
      <div style={{ maxHeight:220, overflowY:'auto', background:'#0a0a0a', borderRadius:10, border:'1px solid #1a1a1a', padding:8 }}>
        {/* Select All shown */}
        <label style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderBottom:'1px solid #1a1a1a', marginBottom:4, cursor:'pointer' }}>
          <input type="checkbox"
            checked={shown.length > 0 && shown.every(u => selected.includes(u._id || u.id))}
            onChange={e => {
              const ids = shown.map(u => u._id || u.id);
              if (e.target.checked) {
                onChange([...new Set([...selected, ...ids])]);
              } else {
                onChange(selected.filter(id => !ids.includes(id)));
              }
            }}
            style={{ accentColor: color, width:14, height:14 }}
          />
          <span style={{ fontSize:12, color:'#9ca3af', fontWeight:600 }}>Select All shown ({shown.length})</span>
        </label>
        {shown.map(u => {
          const uid = u._id || u.id;
          return (
            <label key={uid} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'pointer' }}>
              <input type="checkbox"
                checked={selected.includes(uid)}
                onChange={e => onChange(e.target.checked ? [...selected, uid] : selected.filter(id => id !== uid))}
                style={{ accentColor: color, width:14, height:14 }}
              />
              <div style={{ width:26, height:26, borderRadius:'50%', background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', color, fontWeight:700, fontSize:11 }}>{u.name[0]}</div>
              <div>
                <p style={{ fontSize:13, color:'#d1d5db' }}>{u.name}</p>
                <p style={{ fontSize:10, color:'#6b7280' }}>{u.designation} · <span style={{ color:'#60a5fa' }}>{u.department}</span></p>
              </div>
            </label>
          );
        })}
        {shown.length === 0 && <p style={{ fontSize:12, color:'#6b7280', textAlign:'center', padding:12 }}>No employees found</p>}
      </div>
    </div>
  );
}

export default function AdminTeams() {
  const [teams,       setTeams]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [editTeam,    setEditTeam]    = useState(null); // team being edited
  const [form,        setForm]        = useState(INIT_FORM);
  const [saving,      setSaving]      = useState(false);
  const [viewPulse,   setViewPulse]   = useState(null); // team id for pulse view
  const [pulseData,   setPulseData]   = useState(null);

  const loadTeams = useCallback(() => {
    setLoading(true);
    api.get('/teams').then(r => setTeams(r.data)).catch(() => toast.error('Failed to load teams')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTeams();
    api.get('/users').then(r => setUsers(r.data.filter(u => u.isActive))).catch(() => {});
    api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, [loadTeams]);

  const deptUsers = (dept) => users.filter(u => u.department === dept);

  const openCreate = () => { setForm(INIT_FORM); setEditTeam(null); setShowCreate(true); };
  const openEdit = (team) => {
    setForm({
      name:        team.name,
      department:  team.department,
      description: team.description || '',
      color:       team.color || '#39ff14',
      members:     team.members.map(m => m._id || m.id),
      lead:        team.lead?._id || team.lead?.id || '',
      memberMode:  'individual', // edit mode always shows all users
    });
    setEditTeam(team);
    setShowCreate(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Team name required');
    if (!form.department)  return toast.error('Department required');
    setSaving(true);
    try {
      if (editTeam) {
        const res = await api.patch(`/teams/${editTeam._id || editTeam.id}`, form);
        setTeams(prev => prev.map(t => (t._id || t.id) === (editTeam._id || editTeam.id) ? res.data : t));
        toast.success('Team updated!');
      } else {
        const res = await api.post('/teams', form);
        setTeams(prev => [res.data, ...prev]);
        toast.success('Team created!');
      }
      setShowCreate(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteTeam = async (id, name) => {
    if (!window.confirm(`Delete team "${name}"?`)) return;
    try {
      await api.delete(`/teams/${id}`);
      setTeams(prev => prev.filter(t => (t._id || t.id) !== id));
      toast.success('Team deleted');
    } catch { toast.error('Failed'); }
  };

  const loadPulse = async (teamId) => {
    setViewPulse(teamId);
    setPulseData(null);
    try {
      const res = await api.get(`/teams/${teamId}/pulse`);
      setPulseData(res.data);
    } catch { toast.error('Failed to load pulse'); }
  };

  // Group teams by department
  const byDept = departments.reduce((acc, dept) => {
    const deptTeams = teams.filter(t => t.department === dept);
    if (deptTeams.length > 0) acc[dept] = deptTeams;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Teams</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>{teams.length} teams across {Object.keys(byDept).length} departments</p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ fontSize:13, padding:'10px 18px' }}>+ Create Team</button>
      </div>

      {/* Teams grouped by department */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {[1,2,3].map(i => <div key={i} className="card" style={{ height:200 }} />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:64 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
          <p style={{ color:'#9ca3af', fontWeight:600 }}>No teams yet</p>
          <p style={{ color:'#6b7280', fontSize:13, marginTop:4 }}>Create department-wise teams to organize your employees.</p>
          <button onClick={openCreate} className="btn-primary" style={{ marginTop:20, fontSize:13 }}>+ Create First Team</button>
        </div>
      ) : (
        Object.entries(byDept).map(([dept, deptTeams]) => (
          <div key={dept} style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:14, fontWeight:700, color:'#9ca3af', marginBottom:12, display:'flex', alignItems:'center', gap:8, textTransform:'uppercase', letterSpacing:1 }}>
              🏢 {dept}
              <span style={{ fontSize:11, color:'#4b5563', fontWeight:400, textTransform:'none', letterSpacing:0 }}>{deptTeams.length} team{deptTeams.length > 1 ? 's' : ''}</span>
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
              {deptTeams.map(team => {
                const tid = team._id || team.id;
                return (
                  <div key={tid} className="card" style={{ borderTop:`3px solid ${team.color || '#39ff14'}` }}>
                    {/* Header */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div>
                        <h3 style={{ color:'#fff', fontWeight:700, fontSize:15, marginBottom:2 }}>{team.name}</h3>
                        {team.description && <p style={{ fontSize:12, color:'#6b7280' }}>{team.description}</p>}
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => openEdit(team)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14 }}>✏️</button>
                        <button onClick={() => deleteTeam(tid, team.name)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:14 }}>🗑</button>
                      </div>
                    </div>

                    {/* Lead */}
                    {team.lead && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10, padding:'6px 10px', background:'rgba(57,255,20,0.05)', borderRadius:8, border:'1px solid rgba(57,255,20,0.15)' }}>
                        <span style={{ fontSize:11, color:'#39ff14', fontWeight:600 }}>👑 Lead:</span>
                        <span style={{ fontSize:12, color:'#d1d5db' }}>{team.lead.name}</span>
                      </div>
                    )}

                    {/* Members */}
                    <div style={{ marginBottom:12 }}>
                      <p style={{ fontSize:11, color:'#6b7280', marginBottom:6 }}>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {team.members.slice(0, 6).map(m => (
                          <div key={m._id || m.id} title={m.name}
                            style={{ width:30, height:30, borderRadius:'50%', background:`${team.color || '#39ff14'}20`, border:`1px solid ${team.color || '#39ff14'}44`, display:'flex', alignItems:'center', justifyContent:'center', color: team.color || '#39ff14', fontWeight:700, fontSize:12 }}>
                            {m.name?.[0]}
                          </div>
                        ))}
                        {team.members.length > 6 && (
                          <div style={{ width:30, height:30, borderRadius:'50%', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', fontSize:10 }}>
                            +{team.members.length - 6}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pulse button */}
                    <button
                      onClick={() => loadPulse(tid)}
                      style={{ width:'100%', background:'rgba(57,255,20,0.05)', border:`1px solid ${team.color || '#39ff14'}33`, color: team.color || '#39ff14', borderRadius:10, padding:'8px', fontSize:12, fontWeight:600, cursor:'pointer' }}
                    >
                      📡 View Live Pulse
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Live Pulse Modal */}
      {viewPulse && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:480, maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>
                📡 {pulseData?.team?.name || 'Team'} — Live Pulse
              </h2>
              <button onClick={() => { setViewPulse(null); setPulseData(null); }} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:20 }}>✕</button>
            </div>
            {!pulseData ? (
              <div style={{ textAlign:'center', padding:32 }}>
                <div className="animate-spin" style={{ width:24, height:24, border:'2px solid #39ff14', borderTopColor:'transparent', borderRadius:'50%', margin:'0 auto' }} />
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
                  {[
                    ['Present', pulseData.pulse.filter(p => p.present).length, '#39ff14'],
                    ['Absent',  pulseData.pulse.filter(p => !p.present).length, '#f87171'],
                    ['Late',    pulseData.pulse.filter(p => p.status === 'LATE').length, '#f5e642'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background:'#0a0a0a', borderRadius:10, padding:10, textAlign:'center' }}>
                      <p style={{ fontSize:20, fontWeight:800, color }}>{val}</p>
                      <p style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {pulseData.pulse.map(member => (
                    <div key={member.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#0a0a0a', borderRadius:10, border:'1px solid #1a1a1a' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background: member.present ? '#39ff14' : '#374151' }} className={member.present ? 'animate-pulse' : ''} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{member.name}</p>
                        <p style={{ fontSize:11, color:'#6b7280' }}>{member.designation}</p>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        {member.present ? (
                          <>
                            <span className={member.status === 'LATE' ? 'badge-yellow' : 'badge-green'}>{member.status}</span>
                            <p style={{ fontSize:10, color:'#6b7280', marginTop:3 }}>
                              {new Date(member.checkIn).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                            </p>
                          </>
                        ) : (
                          <span className="badge-red">ABSENT</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>
              {editTeam ? `Edit Team: ${editTeam.name}` : 'Create New Team'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Team Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="e.g. Backend Squad, Sales Tigers" required />
              </div>

              {/* Department */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Department *</label>
                <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value, members: [], lead: '' }))} className="input" required>
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Description</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input" placeholder="What does this team do?" />
              </div>

              {/* Color picker */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:8 }}>Team Color</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {TEAM_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                      style={{ width:28, height:28, borderRadius:'50%', background:c, border: form.color === c ? `3px solid #fff` : '2px solid transparent', cursor:'pointer', transition:'transform 0.1s', transform: form.color === c ? 'scale(1.2)' : 'scale(1)' }}
                    />
                  ))}
                </div>
              </div>

              {/* Member mode toggle */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:8 }}>Member Selection Mode</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[['department','🏢 By Department'],['individual','👤 Individual (cross-dept)']].map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => setForm(p => ({ ...p, memberMode: val, members: [], lead: '' }))}
                      style={{
                        flex:1, padding:'8px 10px', borderRadius:10, fontSize:12, fontWeight:600,
                        border: form.memberMode === val ? `1px solid ${form.color}` : '1px solid #2a2a2a',
                        background: form.memberMode === val ? `${form.color}15` : '#1a1a1a',
                        color: form.memberMode === val ? form.color : '#9ca3af',
                        cursor:'pointer',
                      }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* DEPARTMENT MODE */}
              {form.memberMode === 'department' && form.department && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:8 }}>
                    Members from <strong style={{ color:'#fff' }}>{form.department}</strong>
                    <span style={{ color:'#6b7280', fontWeight:400 }}> ({form.members.length} selected)</span>
                  </label>
                  {deptUsers(form.department).length === 0 ? (
                    <p style={{ fontSize:12, color:'#f87171' }}>No active employees in {form.department}</p>
                  ) : (
                    <div style={{ maxHeight:200, overflowY:'auto', background:'#0a0a0a', borderRadius:10, border:'1px solid #1a1a1a', padding:8 }}>
                      <label style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderBottom:'1px solid #1a1a1a', marginBottom:4, cursor:'pointer' }}>
                        <input type="checkbox"
                          checked={deptUsers(form.department).length > 0 && deptUsers(form.department).every(u => form.members.includes(u._id || u.id))}
                          onChange={e => {
                            const ids = deptUsers(form.department).map(u => u._id || u.id);
                            setForm(p => ({ ...p, members: e.target.checked ? ids : [] }));
                          }}
                          style={{ accentColor: form.color, width:14, height:14 }}
                        />
                        <span style={{ fontSize:12, color:'#9ca3af', fontWeight:600 }}>Select All ({deptUsers(form.department).length})</span>
                      </label>
                      {deptUsers(form.department).map(u => {
                        const uid = u._id || u.id;
                        return (
                          <label key={uid} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'pointer' }}>
                            <input type="checkbox"
                              checked={form.members.includes(uid)}
                              onChange={e => setForm(p => ({ ...p, members: e.target.checked ? [...p.members, uid] : p.members.filter(id => id !== uid) }))}
                              style={{ accentColor: form.color, width:14, height:14 }}
                            />
                            <div style={{ width:26, height:26, borderRadius:'50%', background:`${form.color}20`, display:'flex', alignItems:'center', justifyContent:'center', color: form.color, fontWeight:700, fontSize:11 }}>{u.name[0]}</div>
                            <div>
                              <p style={{ fontSize:13, color:'#d1d5db' }}>{u.name}</p>
                              <p style={{ fontSize:10, color:'#6b7280' }}>{u.designation} · {u.department}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* INDIVIDUAL MODE - cross department */}
              {form.memberMode === 'individual' && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:8 }}>
                    Add Members
                    <span style={{ color:'#6b7280', fontWeight:400 }}> ({form.members.length} selected)</span>
                  </label>

                  {/* Filter by dept */}
                  {departments.length > 0 && (
                    <IndividualPicker
                      users={users}
                      departments={departments}
                      selected={form.members}
                      color={form.color}
                      onChange={members => setForm(p => ({ ...p, members }))}
                    />
                  )}
                </div>
              )}

              {/* Team Lead - shown when members are selected */}
              {form.members.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:6 }}>Team Lead (optional)</label>
                  <select value={form.lead} onChange={e => setForm(p => ({ ...p, lead: e.target.value }))} className="input">
                    <option value="">No lead assigned</option>
                    {users.filter(u => form.members.includes(u._id || u.id)).map(u => (
                      <option key={u._id || u.id} value={u._id || u.id}>{u.name} · {u.department}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display:'flex', gap:12 }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1 }}>
                  {saving ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} /> : editTeam ? 'Save Changes' : 'Create Team'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
