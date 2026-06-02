import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div style={{ textAlign:'center', margin:'16px 0' }}>
      <div style={{ fontSize:36, fontWeight:800, color:'#fff', fontVariantNumeric:'tabular-nums' }}>
        {time.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
      </div>
      <div style={{ color:'#6b7280', fontSize:13, marginTop:4 }}>
        {time.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
      </div>
    </div>
  );
}

export default function CheckInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const token = searchParams.get('token');

  const [step, setStep] = useState('init');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [qrMode, setQrMode] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (!token) { setStep('no-token'); return; }
    api.post('/qr/validate', { token })
      .then(res => { setLocation(res.data.location); setStep(user ? 'checking' : 'login'); })
      .catch(() => setStep('error'));
  }, [token]);

  useEffect(() => {
    if (step === 'checking' && user) checkTodayStatus();
  }, [step, user]);

  const checkTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data) {
        setAttendance(res.data);
        setStep(res.data.checkOut ? 'done' : 'checkout');
      } else {
        setStep('checkin');
      }
    } catch { setStep('checkin'); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      await checkTodayStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await api.post('/attendance/checkin', {
        token, latitude: coords?.lat, longitude: coords?.lng,
        deviceId: navigator.userAgent.slice(0, 50),
      });
      setAttendance(res.data.attendance);
      setStep('success');
      setTimeout(() => setStep('checkout'), 3000);
    } catch (err) {
      if (err.response?.data?.alreadyCheckedIn) {
        setAttendance(err.response.data.attendance);
        setStep('checkout');
      } else {
        toast.error(err.response?.data?.error || 'Check-in failed');
      }
    } finally { setLoading(false); }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await api.post('/attendance/checkout');
      setAttendance(res.data.attendance);
      setStep('done');
      toast.success('Checked out successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-out failed');
    } finally { setLoading(false); }
  };

  // QR scanner
  useEffect(() => {
    if (qrMode) {
      import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
        const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 });
        scanner.render(
          (text) => {
            scanner.clear();
            setQrMode(false);
            try {
              const url = new URL(text);
              const t = url.searchParams.get('token');
              if (t) navigate(`/checkin?token=${t}`);
            } catch { toast.error('Invalid QR code'); }
          },
          () => {}
        );
        scannerRef.current = scanner;
      });
      return () => { if (scannerRef.current) scannerRef.current.clear().catch(() => {}); };
    }
  }, [qrMode]);

  const S = { // styles
    page: { minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:16, position:'relative', overflow:'hidden' },
    topBar: { position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#39ff14,#f5e642,#39ff14)' },
    glow: { position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:320, height:320, background:'rgba(57,255,20,0.04)', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' },
    wrap: { width:'100%', maxWidth:380 },
    logo: { textAlign:'center', marginBottom:24 },
    logoBox: { display:'inline-flex', alignItems:'center', justifyContent:'center', width:60, height:60, borderRadius:16, background:'#111', border:'1px solid rgba(57,255,20,0.3)', marginBottom:12, boxShadow:'0 0 20px rgba(57,255,20,0.15)' },
    location: { display:'flex', alignItems:'center', justifyContent:'center', gap:6, color:'#9ca3af', fontSize:13, marginBottom:16 },
  };

  if (step === 'init') return (
    <div style={S.page}><div style={S.glow} />
      <div style={{ width:32, height:32, border:'2px solid #39ff14', borderTopColor:'transparent', borderRadius:'50%' }} className="animate-spin" />
    </div>
  );

  if (step === 'error') return (
    <div style={S.page}><div style={S.glow} />
      <div className="card-glow" style={{ maxWidth:360, textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
        <h2 style={{ color:'#fff', fontSize:18, fontWeight:700, marginBottom:8 }}>Invalid QR Code</h2>
        <p style={{ color:'#6b7280', fontSize:14 }}>This QR code has expired or is invalid. Please scan the latest QR code from your office.</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.topBar} />
      <div style={S.glow} />
      <div style={S.wrap}>
        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoBox}><span style={{ fontSize:28 }}>⚡</span></div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>WORK<span style={{ color:'#39ff14' }}>SYNE</span></h1>
          <p style={{ color:'#6b7280', fontSize:11, marginTop:2 }}>A5X Industries</p>
        </div>

        <LiveClock />

        {location && (
          <div style={S.location}>
            <span>📍</span><span>{location}</span>
          </div>
        )}

        {/* LOGIN */}
        {step === 'login' && (
          <div className="card-glow">
            <h3 style={{ color:'#fff', fontWeight:700, fontSize:16, marginBottom:16 }}>Sign in to Check In</h3>
            <form onSubmit={handleLogin}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="Email" required style={{ marginBottom:12 }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="Password" required style={{ marginBottom:16 }} />
              <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%' }}>
                {loading ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} /> : 'Continue →'}
              </button>
            </form>
          </div>
        )}

        {/* CHECK-IN */}
        {step === 'checkin' && user && (
          <div className="card-glow" style={{ textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(57,255,20,0.1)', border:'2px solid rgba(57,255,20,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>
              {user.name[0]}
            </div>
            <h3 style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:4 }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]}! 👋
            </h3>
            <p style={{ color:'#9ca3af', fontSize:13 }}>{user.department} · {user.designation}</p>
            <p style={{ color:'#6b7280', fontSize:12, marginTop:4 }}>📞 {user.phone}</p>
            {coords && <p style={{ color:'#39ff14', fontSize:11, marginTop:4 }}>📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>}
            <button onClick={handleCheckIn} disabled={loading} className="btn-primary pulse-green" style={{ width:'100%', marginTop:20 }}>
              {loading
                ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #000', borderTopColor:'transparent', borderRadius:'50%' }} />
                : '✅ Mark Attendance'
              }
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="card" style={{ textAlign:'center', border:'1px solid rgba(57,255,20,0.3)', boxShadow:'0 0 40px rgba(57,255,20,0.1)' }}>
            <div style={{ fontSize:64, marginBottom:8 }}>✅</div>
            <h3 style={{ color:'#39ff14', fontSize:24, fontWeight:800, textShadow:'0 0 20px rgba(57,255,20,0.5)' }}>Checked In!</h3>
            <p style={{ color:'#d1d5db', marginTop:8 }}>{user?.name}</p>
            <p style={{ color:'#6b7280', fontSize:13 }}>{attendance?.checkIn && new Date(attendance.checkIn).toLocaleTimeString('en-IN')}</p>
            {attendance?.status === 'LATE' && <span className="badge-yellow" style={{ marginTop:12, display:'inline-flex' }}>Late Arrival</span>}
          </div>
        )}

        {/* CHECKOUT */}
        {step === 'checkout' && user && (
          <div className="card-glow">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <span style={{ color:'#39ff14', fontSize:20 }}>✅</span>
              <div>
                <p style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{user.name}</p>
                <p style={{ color:'#6b7280', fontSize:12 }}>{user.phone} · {user.department}</p>
              </div>
            </div>
            <div style={{ background:'#0a0a0a', borderRadius:12, padding:12, marginBottom:16 }}>
              {[
                ['Checked in', attendance?.checkIn ? new Date(attendance.checkIn).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—', '#39ff14'],
                ['Status', attendance?.status || '—', attendance?.status === 'LATE' ? '#f5e642' : '#39ff14'],
                ['Location', attendance?.location || '—', '#d1d5db'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                  <span style={{ color:'#6b7280' }}>{label}</span>
                  <span style={{ color, fontWeight:600 }}>{val}</span>
                </div>
              ))}
            </div>
            <button onClick={handleCheckOut} disabled={loading} className="btn-secondary" style={{ width:'100%' }}>
              {loading
                ? <span className="animate-spin" style={{ display:'inline-block', width:16, height:16, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%' }} />
                : '🚪 Check Out'
              }
            </button>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:56, marginBottom:12 }}>👋</div>
            <h3 style={{ color:'#fff', fontWeight:700, fontSize:20 }}>See you tomorrow!</h3>
            <p style={{ color:'#6b7280', fontSize:13, marginTop:8 }}>Attendance recorded for today</p>
            {attendance?.duration && (
              <p style={{ color:'#39ff14', fontWeight:700, marginTop:12 }}>
                {Math.floor(attendance.duration / 60)}h {attendance.duration % 60}m in office
              </p>
            )}
          </div>
        )}

        {/* No token — show scanner */}
        {step === 'no-token' && !qrMode && (
          <div className="card-glow" style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📷</div>
            <h3 style={{ color:'#fff', fontWeight:700, marginBottom:8 }}>Scan QR Code</h3>
            <p style={{ color:'#6b7280', fontSize:13, marginBottom:16 }}>Point your camera at the office QR code</p>
            <button onClick={() => setQrMode(true)} className="btn-primary" style={{ width:'100%' }}>Open Camera Scanner</button>
          </div>
        )}
        {qrMode && <div id="qr-reader" style={{ marginTop:16, borderRadius:12, overflow:'hidden' }} />}
      </div>
    </div>
  );
}
