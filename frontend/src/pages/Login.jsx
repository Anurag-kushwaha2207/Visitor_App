import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import tourismSketch from '../assets/up_tourism_sketch.png';
import axios from 'axios';
import { 
  ShieldCheck, QrCode, BellRing, PieChart, Smartphone, Mail, Lock, 
  LogIn, Crown, Scan, Users, Contact, Eye, EyeOff
} from 'lucide-react';

// Google Cloud Console Client ID - Replace with your real Google Client ID
const GOOGLE_CLIENT_ID = '1098658097728-pbjchfpgskplp34r1e7e4q9hve119npe.apps.googleusercontent.com';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Mobile-only brand splash screen states
  const [showMobileSplash, setShowMobileSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  const { login, googleLogin, showToast } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const fadeTimer = setTimeout(() => {
        setSplashFading(true);
        const hideTimer = setTimeout(() => {
          setShowMobileSplash(false);
        }, 800); // 800ms match with CSS transition duration
        return () => clearTimeout(hideTimer);
      }, 2000); // 2 seconds display timer
      return () => clearTimeout(fadeTimer);
    } else {
      setShowMobileSplash(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      // Navigate to correct dashboard based on role
      navigate(`/${result.role}`);
    }
  };

  // Google Sign-In SDK Handler (opens browser's real accounts chooser popup)
  const handleGoogleLogin = () => {
    if (!window.google) {
      showToast('Google API client is loading. Please try again.', 'error');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            setLoading(true);
            try {
              // Fetch user details from Google userinfo API
              const userInfo = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
              const { name, email, picture } = userInfo.data;

              // Authenticate with backend
              const result = await googleLogin({ name, email, profilePhoto: picture });
              if (result.success) {
                navigate(`/${result.role}`);
              }
            } catch (err) {
              showToast('Failed to fetch profile info from Google', 'error');
            } finally {
              setLoading(false);
            }
          }
        },
        error_callback: (err) => {
          showToast('Google Sign-In popup closed or failed', 'error');
        }
      });
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      console.error(err);
      showToast('Error initializing Google login', 'error');
    }
  };



  return (
    <div className="page active" id="login" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="lw" style={{ maxWidth: '840px', width: '100%', margin: '20px', background: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
        
        {/* Left Side: Brand Highlights */}
        <div className={`ll ${showMobileSplash ? 'splash-view' : ''} ${splashFading ? 'splash-exit' : ''}`}>
          <div>
            <div className="brand">
              <div className="bicon"><ShieldCheck size={20} /></div>
              <div>
                <div className="bname">VisitorPass</div>
                <div className="bsub">Management System</div>
              </div>
            </div>
            
            <div className="ltag" style={{ marginTop: '28px' }}>
              <h2>Secure. Smart.<br />Seamless Entry.</h2>
              <p>Digital visitor management — QR passes, real-time tracking, role-based access, instant notifications.</p>
            </div>
            
            <div style={{ marginTop: '18px' }}>
              <div className="fpill"><QrCode size={15} /><span>QR code digital passes</span></div>
              <div className="fpill"><BellRing size={15} /><span>Instant email & SMS alerts</span></div>
              <div className="fpill"><PieChart size={15} /><span>Analytics & audit logs</span></div>
              <div className="fpill"><Smartphone size={15} /><span>Mobile & desktop ready</span></div>
            </div>
          </div>
          
          <div>
            <p style={{ fontSize: '10px', color: '#64c8b4', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: 600, marginBottom: '7px' }}>Access roles</p>
            <div className="rbadges">
              <span className="rb a"><Crown size={11} /> Admin</span>
              <span className="rb s"><Scan size={11} /> Security</span>
              <span className="rb e"><Users size={11} /> Employee</span>
              <span className="rb v"><Contact size={11} /> Visitor</span>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', marginTop: '14px' }}>Your role is detected automatically from your registered email.</p>
          </div>
        </div>

        {/* Right Side: Login Input Form */}
        <div className={`lr ${showMobileSplash ? 'mobile-hidden' : ''} ${splashFading ? 'login-form-enter' : ''}`}>
          <div className="lh3">Welcome back</div>
          <div className="lp">Sign in — we'll know who you are from your email</div>
          
          <form onSubmit={handleSubmit}>
            <div className="fg">
              <label>Email address</label>
              <div className="iw">
                <Mail size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com" 
                  required
                />
              </div>
            </div>
            
            <div className="fg">
              <label>Password</label>
              <div className="iw" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '11px', color: 'var(--slate2)', pointerEvents: 'none' }} />
                <input 
                  type={showPass ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  style={{ width: '100%', padding: '10px 44px 10px 36px', borderRadius: '8px', border: '1.5px solid var(--border)', outline: 'none', background: 'var(--card)' }}
                  required
                />
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPass(prev => !prev);
                  }}
                  style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', zIndex: 10, outline: 'none', padding: 0 }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--muted)', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: '#00c9a7', width: '13px', height: '13px' }} /> Remember me
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); showToast('Password reset is mocked. Use demo bypass logins!', 'error'); }} style={{ fontSize: '12px', color: '#00a88b', textDecoration: 'none' }}>Forgot password?</a>
            </div>
            
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <div className="loading-spinner" style={{ margin: '0', width: '16px', height: '16px', borderLeftColor: '#fff' }} />
              ) : (
                <>
                  <LogIn size={17} />
                  <span>Sign in securely</span>
                </>
              )}
            </button>
          </form>
          
          <div className="divider" style={{ margin: '16px 0' }}>or continue with</div>
          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            className="btn-google"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', border: '1.5px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--dm)', fontSize: '13px', fontWeight: 500, transition: 'all 0.15s ease' }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" style={{ flexShrink: 0 }}>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          
          <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', marginTop: '18px' }}>
            New here? <Link to="/register" style={{ color: '#00a88b', fontWeight: 500, textDecoration: 'none' }}>Create an account</Link>
          </p>
          
          {/* Tourism sketch logo branding */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <img 
              src={tourismSketch} 
              alt="UP Tourism Sketch Logo" 
              className="tourism-logo"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
