import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '', active: false });

  // Base API configuration
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://visitor-app-69ei.onrender.com/api';
  axios.defaults.baseURL = API_URL;

  // Show premium custom toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type, active: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, active: false }));
    }, 4000);
  };

  // Set JWT Token in headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('vpms_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('vpms_token');
    }
  };

  // Fetch current user details
  const fetchUser = async () => {
    try {
      const res = await axios.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        logout();
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Run on mount to check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('vpms_token');
    if (token) {
      setAuthToken(token);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await axios.post('/auth/login', { email, password });
      if (res.data.success) {
        setAuthToken(res.data.token);
        setUser(res.data.user);
        showToast(`Welcome back, ${res.data.user.name}!`);
        return { success: true, role: res.data.user.role };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      showToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Google Login / On-the-fly registration
  const googleLogin = async (googleData) => {
    try {
      setLoading(true);
      const res = await axios.post('/auth/google-login', googleData);
      if (res.data.success) {
        setAuthToken(res.data.token);
        setUser(res.data.user);
        showToast(`Welcome back, ${res.data.user.name}!`);
        return { success: true, role: res.data.user.role };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google Sign-In failed';
      showToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (formData) => {
    try {
      setLoading(true);
      const res = await axios.post('/auth/register', formData);
      if (res.data.success) {
        setAuthToken(res.data.token);
        setUser(res.data.user);
        showToast('Registration successful!');
        return { success: true, role: res.data.user.role };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      showToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const res = await axios.put('/auth/profile', profileData);
      if (res.data.success) {
        setUser(res.data.user);
        showToast('Profile updated successfully!');
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Profile update failed';
      showToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setAuthToken(null);
    setUser(null);
    showToast('Logged out successfully.');
  };

  // Send OTP
  const sendOtp = async (email) => {
    try {
      const res = await axios.post('/auth/send-otp', { email });
      if (res.data.success) {
        showToast('Verification OTP sent to your email.');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      showToast(msg, 'error');
      return { success: false };
    }
  };

  // Verify OTP
  const verifyOtp = async (email, otp) => {
    try {
      const res = await axios.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        showToast('Email verified successfully!');
        if (user && user.email === email) {
          setUser(prev => ({ ...prev, isVerified: true }));
        }
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed';
      showToast(msg, 'error');
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        register,
        updateProfile,
        logout,
        sendOtp,
        verifyOtp,
        showToast,
        toast
      }}
    >
      {children}
      {/* Centralized Toast Modal rendering */}
      <div className={`toast ${toast.type} ${toast.active ? 'active' : ''}`}>
        {toast.type === 'success' ? (
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '16px', height: '16px', color: '#00c9a7' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '16px', height: '16px', color: '#f43f5e' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        <span>{toast.message}</span>
      </div>
    </AuthContext.Provider>
  );
};
