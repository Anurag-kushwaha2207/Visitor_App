import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, CheckCircle, LogOut } from 'lucide-react';

const Verify = () => {
  const { user, sendOtp, verifyOtp, logout, showToast } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.isVerified) {
        navigate(`/${user.role}`, { replace: true });
        return;
      }
      setEmail(user.email);
      // Automatically send OTP once on mount if user is logged in but not verified
      if (!user.isVerified && !otpSent) {
        sendOtp(user.email);
        setOtpSent(true);
      }
    }
  }, [user, navigate]);

  const handleSendCode = async () => {
    if (!email) {
      showToast('Please enter your registered email address', 'error');
      return;
    }
    setLoading(true);
    const result = await sendOtp(email);
    setLoading(false);
    if (result.success) {
      setOtpSent(true);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      showToast('Please enter both email and OTP verification code', 'error');
      return;
    }
    if (otp.length !== 6) {
      showToast('OTP must be a 6-digit code', 'error');
      return;
    }

    setLoading(true);
    const result = await verifyOtp(email, otp);
    setLoading(false);

    if (result.success) {
      showToast('Your account has been verified successfully!');
      // Navigate to correct dashboard based on role
      if (user) {
        navigate(`/${user.role}`, { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  };

  return (
    <div className="page active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="lw" style={{ maxWidth: '480px', width: '100%', margin: '20px', background: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', borderRadius: '12px', overflow: 'hidden' }}>
        
        {/* Header Block */}
        <div style={{ background: 'var(--navy)', color: '#fff', padding: '24px', textAlign: 'center', borderBottom: '3px solid #00c9a7' }}>
          <div className="brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center', margin: '0 auto 8px' }}>
            <div className="bicon" style={{ background: '#00c9a7', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <ShieldCheck size={18} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '.4px', color: '#fff', fontFamily: 'var(--syne)' }}>VisitorPass</span>
          </div>
          <p style={{ margin: '0', fontSize: '11px', color: '#64c8b4', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Security Verification</p>
        </div>

        {/* Verification Form */}
        <div style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--syne)', fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>Account Activation Required</h3>
          <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.4', marginBottom: '20px' }}>
            To unlock your role dashboard, we must verify your email address. Enter your registered email to request a 6-digit OTP activation code.
          </p>

          <form onSubmit={handleVerifyCode}>
            {/* Email Field */}
            <div className="fg" style={{ marginBottom: '14px' }}>
              <label>Email address</label>
              <div className="iw">
                <Mail size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com" 
                  disabled={user !== null} // Lock if logged in
                  required
                />
              </div>
            </div>

            {/* Request code button */}
            {!otpSent ? (
              <button 
                type="button" 
                onClick={handleSendCode} 
                className="btn-login" 
                style={{ width: '100%', marginBottom: '16px' }}
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </button>
            ) : (
              <>
                {/* OTP Input Field */}
                <div className="fg" style={{ marginBottom: '16px' }}>
                  <label>6-Digit OTP Code</label>
                  <div className="iw">
                    <Lock size={16} />
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="e.g. 123456" 
                      maxLength={6}
                      style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '5px', fontWeight: 700 }}
                      required
                    />
                  </div>
                </div>

                {/* Verify Code Button */}
                <button 
                  type="submit" 
                  className="btn-login" 
                  style={{ width: '100%', marginBottom: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify and Activate Account'}
                </button>

                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <button 
                    type="button" 
                    onClick={handleSendCode} 
                    style={{ border: 'none', background: 'none', color: '#00a88b', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                    disabled={loading}
                  >
                    Resend Verification OTP
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Logout / Back fallback actions */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{ border: 'none', background: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <LogOut size={13} /> Log out & Sign in again
            </button>
            <button 
              onClick={() => navigate('/login')}
              style={{ border: 'none', background: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
            >
              Back to Login
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Verify;
