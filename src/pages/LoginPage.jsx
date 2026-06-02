import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/employee');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden'
    }}>
      {/* Glow blobs */}
      <div style={{ position:'absolute', top:'25%', left:'50%', transform:'translateX(-50%)', width:400, height:400, background:'rgba(57,255,20,0.04)', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'20%', right:'20%', width:300, height:300, background:'rgba(245,230,66,0.04)', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:72, height:72, borderRadius:20, background:'#111',
            border:'1px solid rgba(57,255,20,0.3)', marginBottom:16,
            boxShadow:'0 0 30px rgba(57,255,20,0.15)'
          }}>
            <span style={{ fontSize:32 }}>⚡</span>
          </div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'#fff', letterSpacing:'-0.5px', margin:0 }}>
            WORK<span style={{ color:'#39ff14' }}>SYNE</span>
          </h1>
          <p style={{ color:'#6b7280', fontSize:13, marginTop:4 }}>A5X Industries — Attendance System</p>
        </div>

        {/* Card */}
        <div className="card-glow">
          <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:24 }}>Sign in to your account</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, color:'#9ca3af', marginBottom:6 }}>Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@a5xindustries.com" required autoFocus
              />
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:13, color:'#9ca3af', marginBottom:6 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input" placeholder="••••••••" required
                  style={{ paddingRight:44 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:16
                }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%' }}>
              {loading
                ? <span className="animate-spin" style={{ display:'inline-block', width:18, height:18, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} />
                : '⚡ Sign In'
              }
            </button>
          </form>

          {/* Demo creds */}
          <div style={{ marginTop:24, padding:16, background:'#0a0a0a', borderRadius:12, border:'1px solid #1f1f1f' }}>
            <p style={{ fontSize:11, color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Demo Credentials</p>
            <p style={{ fontSize:12, color:'#9ca3af', marginBottom:4 }}>
              <span style={{ color:'#39ff14' }}>Admin:</span> admin@a5xindustries.com / admin123
            </p>
            <p style={{ fontSize:12, color:'#9ca3af' }}>
              <span style={{ color:'#f5e642' }}>Employee:</span> riya@a5xindustries.com / emp123
            </p>
          </div>
        </div>

        <p style={{ textAlign:'center', color:'#374151', fontSize:12, marginTop:24 }}>
          © 2024 A5X Industries. All rights reserved.
        </p>
      </div>
    </div>
  );
}
