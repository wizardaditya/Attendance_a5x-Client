import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', phone:'', department:'', designation:'', role:'EMPLOYEE' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get('/users').then(r => setEmployees(r.data)).catch(() => {}).finally(() => setLoading(false));
    api.get('/users/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const filtered = employees.filter(e => {
    const s = search.toLowerCase();
    return (!search || e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s) || e.phone?.includes(search))
      && (!deptFilter || e.department === deptFilter);
  });

  const createEmployee = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      const res = await api.post('/users', form);
      setEmployees(prev => [res.data, ...prev]);
      setShowCreate(false); setForm({ name:'', email:'', phone:'', department:'', designation:'', role:'EMPLOYEE' });
      toast.success(`${res.data.name} added! Default password: Welcome@123`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setCreating(false); }
  };

  const deactivate = async (id, name) => {
    if (!id || id === 'undefined') return toast.error('Invalid employee ID');
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      setEmployees(prev => prev.map(e => (e._id === id || e.id === id) ? { ...e, isActive:false } : e));
      toast.success('Deactivated');
    } catch { toast.error('Failed'); }
  };

  const resetPassword = async (id, name) => {
    if (!id || id === 'undefined') return toast.error('Invalid employee ID');
    if (!window.confirm(`Reset ${name}'s password to Welcome@123?`)) return;
    try { await api.post(`/users/${id}/reset-password`); toast.success('Password reset to Welcome@123'); }
    catch { toast.error('Failed'); }
  };

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

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card-glow" style={{ width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>Add New Employee</h2>
            <form onSubmit={createEmployee}>
              {[['name','Full Name *','text'],['email','Email *','email'],['phone','Phone Number *','tel'],['designation','Designation','text']].map(([key,ph,type]) => (
                <input key={key} type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]:e.target.value }))} className="input" placeholder={ph} required={ph.includes('*')} style={{ marginBottom:12 }} />
              ))}
              <select value={form.department} onChange={e => setForm(p => ({ ...p, department:e.target.value }))} className="input" required style={{ marginBottom:12 }}>
                <option value="">Select Department *</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role:e.target.value }))} className="input" style={{ marginBottom:8 }}>
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
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

      {/* Grid */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="card" style={{ height:160 }} />)}
        </div>
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
                <button onClick={() => resetPassword(empId, emp.name)} className="btn-secondary" style={{ flex:1, fontSize:11, padding:'7px 10px' }}>🔄 Reset Pass</button>
                {emp.isActive && <button onClick={() => deactivate(empId, emp.name)} className="btn-danger" style={{ fontSize:11, padding:'7px 12px' }}>🗑</button>}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
