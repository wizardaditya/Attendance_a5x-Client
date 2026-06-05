import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const ROLES = ['EMPLOYEE', 'FOUNDER', 'ADMIN'];

export default function AdminEmployees() {
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState([]);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({ name:'', email:'', phone:'', department:'', designation:'', role:'EMPLOYEE' });
  const [creating, setCreating]     = useState(false);

  // Edit
  const [editEmp, setEditEmp]   = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    api.get('/users').then(r => setEmployees(r.data)).catch(() => {}).finally(() => setLoading(false));
    api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const filtered = employees.filter(e => {
    const s = search.toLowerCase();
    return (!search || e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s) || e.phone?.includes(search))
      && (!deptFilter || e.department === deptFilter);
  });

  // ── Create ──────────────────────────────────────────────────────────────
  const createEmployee = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      const res = await api.post('/users', form);
      setEmployees(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ name:'', email:'', phone:'', department:'', designation:'', role:'EMPLOYEE' });
      toast.success(`${res.data.name} added! Default password: Welcome@123`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  // ── Edit ────────────────────────────────────────────────────────────────
  const openEdit = (emp) => {
    setEditEmp(emp);
    setEditForm({
      name:        emp.name        || '',
      email:       emp.email       || '',
      phone:       emp.phone       || '',
      department:  emp.department  || '',
      designation: emp.designation || '',
      role:        emp.role        || 'EMPLOYEE',
      isActive:    emp.isActive ?? true,
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const id = editEmp._id || editEmp.id;
    try {
      const res = await api.patch(`/users/${id}`, editForm);
      setEmployees(prev => prev.map(emp => (emp._id === id || emp.id === id) ? { ...emp, ...res.data } : emp));
      setEditEmp(null);
      toast.success('Employee updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const deactivate = async (id, name) => {
    if (!id || id === 'undefined') return toast.error('Invalid employee ID');
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      setEmployees(prev => prev.filter(e => (e._id !== id && e.id !== id)));
      toast.success(`${name} removed permanently`);
    } catch { toast.error('Failed to delete employee'); }
  };

  const resetPassword = async (id, name) => {
    if (!id || id === 'undefined') return toast.error('Invalid employee ID');
    if (!window.confirm(`Reset ${name}'s password to Welcome@123?`)) return;
    try { await api.post(`/users/${id}/reset-password`); toast.success('Password reset to Welcome@123'); }
    catch { toast.error('Failed'); }
  };

  const inputStyle = { marginBottom: 12 };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4 }}>Employee Directory</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>{filtered.length} employees</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ fontSize:13, padding:'10px 18px' }}>+ Add Employee</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:20 }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#6b7280' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} className="input" placeholder="Search name, email, phone..." style={{ paddingLeft:36, fontSize:13 }} />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input" style={{ width:'auto', fontSize:13, padding:'10px 14px' }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>Add New Employee</h2>
            <form onSubmit={createEmployee}>
              {[['name','Full Name *','text'],['email','Email *','email'],['phone','Phone Number *','tel'],['designation','Designation','text']].map(([key,ph,type]) => (
                <input key={key} type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]:e.target.value }))} className="input" placeholder={ph} required={ph.includes('*')} style={inputStyle} />
              ))}
              <select value={form.department} onChange={e => setForm(p => ({ ...p, department:e.target.value }))} className="input" required style={inputStyle}>
                <option value="">Select Department *</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role:e.target.value }))} className="input" style={inputStyle}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <p style={{ fontSize:12, color:'#6b7280', marginBottom:16 }}>Default password: <span style={{ color:'#39ff14' }}>Welcome@123</span></p>
              <div style={{ display:'flex', gap:12 }}>
                <button type="submit" disabled={creating} className="btn-primary" style={{ flex:1 }}>
                  {creating ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} /> : 'Add Employee'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editEmp && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Edit Employee</h2>
              <button onClick={() => setEditEmp(null)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:20, lineHeight:1 }}>✕</button>
            </div>
            <form onSubmit={saveEdit}>
              <label style={{ fontSize:12, color:'#6b7280', marginBottom:4, display:'block' }}>Full Name</label>
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name:e.target.value }))} className="input" placeholder="Full Name" required style={inputStyle} />

              <label style={{ fontSize:12, color:'#6b7280', marginBottom:4, display:'block' }}>Email</label>
              <input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email:e.target.value }))} className="input" placeholder="Email" type="email" required style={inputStyle} />

              <label style={{ fontSize:12, color:'#6b7280', marginBottom:4, display:'block' }}>Phone</label>
              <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone:e.target.value }))} className="input" placeholder="Phone" style={inputStyle} />

              <label style={{ fontSize:12, color:'#6b7280', marginBottom:4, display:'block' }}>Designation</label>
              <input value={editForm.designation} onChange={e => setEditForm(p => ({ ...p, designation:e.target.value }))} className="input" placeholder="Designation" style={inputStyle} />

              <label style={{ fontSize:12, color:'#6b7280', marginBottom:4, display:'block' }}>Department</label>
              <select value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department:e.target.value }))} className="input" required style={inputStyle}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <label style={{ fontSize:12, color:'#6b7280', marginBottom:4, display:'block' }}>Role</label>
              <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role:e.target.value }))} className="input" style={inputStyle}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <label style={{ fontSize:12, color:'#6b7280', marginBottom:4, display:'block' }}>Status</label>
              <select value={editForm.isActive ? 'active' : 'inactive'} onChange={e => setEditForm(p => ({ ...p, isActive: e.target.value === 'active' }))} className="input" style={inputStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex:1 }}>
                  {saving ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} /> : '💾 Save Changes'}
                </button>
                <button type="button" onClick={() => setEditEmp(null)} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Employee Grid ── */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="card" style={{ height:160 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:'#6b7280' }}>No employees found</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {filtered.map(emp => {
            const empId = emp._id || emp.id;
            return (
              <div key={empId} className="card" style={{ opacity: emp.isActive ? 1 : 0.5 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'rgba(57,255,20,0.1)', border:'1px solid rgba(57,255,20,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#39ff14', fontWeight:700, fontSize:18, flexShrink:0 }}>
                    {emp.name[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <h3 style={{ color:'#fff', fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{emp.name}</h3>
                      {!emp.isActive && <span className="badge-red">Inactive</span>}
                      {emp.role === 'FOUNDER' && <span style={{ fontSize:10, color:'#f5e642', background:'rgba(245,230,66,0.1)', padding:'2px 7px', borderRadius:999, border:'1px solid rgba(245,230,66,0.2)', fontWeight:700 }}>FOUNDER</span>}
                      {emp.role === 'ADMIN' && <span style={{ fontSize:10, color:'#3b82f6', background:'rgba(59,130,246,0.1)', padding:'2px 7px', borderRadius:999, border:'1px solid rgba(59,130,246,0.2)', fontWeight:700 }}>ADMIN</span>}
                    </div>
                    <p style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{emp.designation}</p>
                  </div>
                </div>

                <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>
                  <p style={{ marginBottom:4 }}>🏢 {emp.department} · <span style={{ color:'#6b7280' }}>{emp.employeeId}</span></p>
                  <p style={{ marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>✉️ {emp.email}</p>
                  <p>📞 {emp.phone}</p>
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => openEdit(emp)} className="btn-secondary" style={{ flex:1, fontSize:11, padding:'7px 10px' }}>✏️ Edit</button>
                  <button onClick={() => resetPassword(empId, emp.name)} className="btn-secondary" style={{ flex:1, fontSize:11, padding:'7px 10px' }}>🔄 Reset</button>
                  <button onClick={() => deactivate(empId, emp.name)} className="btn-danger" style={{ fontSize:11, padding:'7px 12px' }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
