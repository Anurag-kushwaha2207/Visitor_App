import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Mail, Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
  const { showToast } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your registered email address', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/auth/forgot-password', { email });
      if (res.data.success) {
        showToast('Password reset verification code sent to your email.');
        setOtpSent(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send reset code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !otp || !newPassword || !confirmPassword) {
      showToast('Please fill in all verification fields', 'error');
      return;
    }
    if (otp.length !== 6) {
      showToast('OTP must be a 6-digit code', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      if (res.data.success) {
        showToast('Password reset successful! Logging you in...');
        navigate('/login');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Password reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="lw" style={{ maxWidth: '480px', width: '100%', margin: '20px', background: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', borderRadius: '12px', overflow: 'hidden' }}>
        
        {/* Header Block */}
        <div style={{ background: 'var(--navy)', color: '#fff', padding: '24px', textAlign: 'center', borderBottom: '3px solid #f43f5e' }}>
          <div className="brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center', margin: '0 auto 8px' }}>
            <div className="bicon" style={{ background: '#f43f5e', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <ShieldCheck size={18} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '.4px', color: '#fff', fontFamily: 'var(--syne)' }}>VisitorPass</span>
          </div>
          <p style={{ margin: '0', fontSize: '11px', color: '#fda4af', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Reset Password</p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--syne)', fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
            {otpSent ? 'Enter Verification Code' : 'Forgot Password?'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.4', marginBottom: '20px' }}>
            {otpSent 
              ? 'Enter the 6-digit OTP code sent to your email along with your new password to update your credentials.' 
              : 'Enter your registered email address below, and we will send you a 6-digit OTP verification code to reset your password.'
            }
          </p>

          {!otpSent ? (
            <form onSubmit={handleSendResetCode}>
              {/* Email Field */}
              <div className="fg" style={{ marginBottom: '16px' }}>
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

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn-login" 
                style={{ width: '100%', marginBottom: '16px', background: '#f43f5e', borderColor: '#f43f5e' }}
                disabled={loading}
              >
                {loading ? 'Sending code...' : 'Send Verification OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              {/* Email Input (Locked) */}
              <div className="fg" style={{ marginBottom: '14px' }}>
                <label>Email address</label>
                <div className="iw" style={{ opacity: 0.6 }}>
                  <Mail size={16} />
                  <input type="email" value={email} disabled />
                </div>
              </div>

              {/* OTP Field */}
              <div className="fg" style={{ marginBottom: '14px' }}>
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

              {/* New Password */}
              <div className="fg" style={{ marginBottom: '14px' }}>
                <label>New Password</label>
                <div className="iw" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '11px', color: 'var(--slate2)', pointerEvents: 'none' }} />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters" 
                    style={{ width: '100%', padding: '10px 44px 10px 36px', borderRadius: '8px', border: '1.5px solid var(--border)', outline: 'none', background: 'var(--card)' }}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', zIndex: 10, outline: 'none' }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="fg" style={{ marginBottom: '20px' }}>
                <label>Confirm Password</label>
                <div className="iw">
                  <Lock size={16} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password" 
                    required
                  />
                </div>
              </div>

              {/* Submit Reset Button */}
              <button 
                type="submit" 
                className="btn-login" 
                style={{ width: '100%', marginBottom: '16px', background: '#f43f5e', borderColor: '#f43f5e' }}
                disabled={loading}
              >
                {loading ? 'Resetting password...' : 'Update Password'}
              </button>

              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <button 
                  type="button" 
                  onClick={handleSendResetCode} 
                  style={{ border: 'none', background: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                  disabled={loading}
                >
                  Resend Verification OTP
                </button>
              </div>
            </form>
          )}

          {/* Back Action */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', textAlign: 'center' }}>
            <Link 
              to="/login"
              style={{ color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <ArrowLeft size={13} /> Back to Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
