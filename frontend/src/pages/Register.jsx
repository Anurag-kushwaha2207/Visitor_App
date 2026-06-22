import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  User, Mail, Phone, Lock, Building, Crown, Scan, Users, 
  Contact, ArrowLeft, ArrowRight, Check, Image, Info, Eye, EyeOff
} from 'lucide-react';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    organization: '',
    department: '',
    role: ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showPass, setShowPass] = useState(false);

  const { register, sendOtp, verifyOtp, showToast } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.googleAutofill) {
      setFormData({
        firstName: 'Rahul',
        lastName: 'Dev',
        email: 'rahul.dev@gmail.com',
        phone: '+91 98765 43210',
        password: 'password123',
        organization: 'Google Workspace',
        department: '',
        role: 'visitor'
      });
      // Mock photo preview from Unsplash
      setPhotoPreview('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150');
      // Advance to step 2 to showcase populated fields
      setStep(2);
      showToast('Autofilled registration details from Google!');
    }
  }, [location, showToast]);

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: '', width: '0%', score: 0 };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { label: 'Weak', color: '#f43f5e', width: '25%', score };
    if (score === 2) return { label: 'Medium', color: '#f59e0b', width: '60%', score };
    return { label: 'Strong', color: '#00c9a7', width: '100%', score };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result); // Base64 data URL string!
        setPhotoPreview(reader.result);
        showToast('Photo selected successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRoleSelect = (role) => {
    // Dynamically set default department for employees
    let department = '';
    if (role === 'employee') {
      department = 'IT'; // default placeholder
    }
    setFormData(prev => ({ ...prev, role, department }));
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName) {
        showToast('Please fill in both first and last name', 'error');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.email || !formData.phone || !formData.password || !formData.organization) {
        showToast('Please fill in all contact and company details', 'error');
        return false;
      }
      if (formData.password.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.role) {
        showToast('Please select a system role to proceed', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    
    // Prepare standard JSON payload (with Base64 photo)
    const submissionData = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: formData.role,
      organization: formData.organization,
      department: formData.department,
      profilePhoto: photo || ''
    };

    const result = await register(submissionData);
    setLoading(false);

    if (result.success) {
      await sendOtp(formData.email);
      setStep(4);
      showToast('Account created! Verification OTP sent to your email.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      showToast('Please enter the 6-digit verification code', 'error');
      return;
    }
    setLoading(true);
    const result = await verifyOtp(formData.email, otpCode);
    setLoading(false);
    if (result.success) {
      setStep(5);
    }
  };

  // Humanized info notes per role selection
  const roleMessages = {
    admin: 'Admin role selected — you will manage the full system, staff, and analytics.',
    security: 'Security role selected — you will handle check-ins, check-outs, and scanner desk.',
    employee: 'Employee / Host role selected — you can invite visitors and approve pending schedules.',
    visitor: 'Visitor role selected — you can pre-register appointments, download passes and PDFs.'
  };

  return (
    <div className="page active" id="register" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="reg-wrap" style={{ maxWidth: '640px', width: '100%', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
        
        {/* Header Block */}
        <div className="reg-head">
          <h2>Create your account</h2>
          <p>Takes just 2 minutes — your role is set during registration</p>
        </div>

        {/* Steps Breadcrumbs bar */}
        <div className="steps-bar">
          <div className={`step ${step === 1 ? 'active' : step > 1 ? 'done' : 'idle'}`}>
            <div className="step-num">{step > 1 ? <Check size={12} /> : 1}</div>
            <div className="step-label">Basic info</div>
          </div>
          <div className="step-line" style={{ background: step > 1 ? '#00c9a7' : 'var(--border)' }}></div>
          
          <div className={`step ${step === 2 ? 'active' : step > 2 ? 'done' : 'idle'}`}>
            <div className="step-num">{step > 2 ? <Check size={12} /> : 2}</div>
            <div className="step-label">Contact</div>
          </div>
          <div className="step-line" style={{ background: step > 2 ? '#00c9a7' : 'var(--border)' }}></div>
          
          <div className={`step ${step === 3 ? 'active' : step > 3 ? 'done' : 'idle'}`}>
            <div className="step-num">{step > 3 ? <Check size={12} /> : 3}</div>
            <div className="step-label">Select role</div>
          </div>
          <div className="step-line" style={{ background: step > 3 ? '#00c9a7' : 'var(--border)' }}></div>
          
          <div className={`step ${step === 4 ? 'active' : step > 4 ? 'done' : 'idle'}`}>
            <div className="step-num">{step > 4 ? <Check size={12} /> : 4}</div>
            <div className="step-label">Verify OTP</div>
          </div>
          <div className="step-line" style={{ background: step > 4 ? '#00c9a7' : 'var(--border)' }}></div>
          
          <div className={`step ${step === 5 ? 'active' : 'idle'}`}>
            <div className="step-num">5</div>
            <div className="step-label">Confirm</div>
          </div>
        </div>

        {/* Wizard Form Body */}
        <div className="reg-body">
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="reg-step active">
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Tell us your name</p>
              <div className="reg-grid">
                <div className="fg" style={{ margin: 0 }}>
                  <label>First name</label>
                  <div className="iw">
                    <User size={16} />
                    <input 
                      type="text" 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Rahul" 
                      style={{ padding: '9px 12px 9px 34px' }}
                    />
                  </div>
                </div>
                <div className="fg" style={{ margin: 0 }}>
                  <label>Last name</label>
                  <div className="iw">
                    <User size={16} />
                    <input 
                      type="text" 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Kumar" 
                      style={{ padding: '9px 12px 9px 34px' }}
                    />
                  </div>
                </div>
                <div className="fg" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label>Profile photo (optional)</label>
                  <label 
                    htmlFor="photo-upload"
                    style={{ 
                      border: '1.5px dashed var(--border)', 
                      borderRadius: '8px', 
                      padding: '20px', 
                      textAlign: 'center', 
                      cursor: 'pointer', 
                      background: '#fafbfc',
                      display: 'block'
                    }}
                  >
                    {photoPreview ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <img src={photoPreview} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontSize: '11px', color: '#00c9a7' }}>Change selected photo</span>
                      </div>
                    ) : (
                      <>
                        <Image size={24} style={{ color: 'var(--slate2)', display: 'block', margin: '0 auto 6px' }} />
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Click to upload profile picture</span>
                      </>
                    )}
                    <input 
                      id="photo-upload"
                      type="file" 
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
              <div className="reg-footer">
                <div></div>
                <button type="button" className="btn-next" onClick={handleNext}>
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Contact Info */}
          {step === 2 && (
            <div className="reg-step active">
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>How can we reach you?</p>
              <div className="reg-grid">
                <div className="fg" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label>Email address</label>
                  <div className="iw">
                    <Mail size={16} />
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="rahul@yourorg.com" 
                      style={{ padding: '9px 12px 9px 34px' }}
                    />
                  </div>
                </div>
                <div className="fg" style={{ margin: 0 }}>
                  <label>Phone number</label>
                  <div className="iw">
                    <Phone size={16} />
                    <input 
                      type="text" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210" 
                      style={{ padding: '9px 12px 9px 34px' }}
                    />
                  </div>
                </div>
                <div className="fg" style={{ margin: 0 }}>
                  <label>Password</label>
                  <div className="iw" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '11px', color: 'var(--slate2)', pointerEvents: 'none' }} />
                    <input 
                      type={showPass ? 'text' : 'password'} 
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Min 6 characters" 
                      style={{ width: '100%', padding: '9px 44px 9px 34px', borderRadius: '8px', border: '1.5px solid var(--border)', outline: 'none', background: 'var(--card)' }}
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
                  {/* Real-time strength meter */}
                  {formData.password && (
                    <div style={{ marginTop: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Password Strength:</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: getPasswordStrength(formData.password).color }}>
                          {getPasswordStrength(formData.password).label}
                        </span>
                      </div>
                      <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: getPasswordStrength(formData.password).color, width: getPasswordStrength(formData.password).width, transition: 'width 0.3s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="fg" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label>Organization / Company</label>
                  <div className="iw">
                    <Building size={16} />
                    <input 
                      type="text" 
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      placeholder="Your company name" 
                      style={{ padding: '9px 12px 9px 34px' }}
                    />
                  </div>
                </div>
              </div>
              <div className="reg-footer">
                <button type="button" className="btn-back" onClick={handleBack}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="button" className="btn-next" onClick={handleNext}>
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Role */}
          {step === 3 && (
            <div className="reg-step active">
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Who are you in this system?</p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>This is asked only once — your dashboard will be selected dynamically.</p>
              
              <div className="role-cards">
                <div className={`role-card ${formData.role === 'admin' ? 'selected' : ''}`} onClick={() => handleRoleSelect('admin')}>
                  <Crown size={28} style={{ color: '#7c3aed' }} />
                  <div className="rc-name">Admin</div>
                  <div className="rc-desc">Manage system, staff, analytics & all settings</div>
                </div>
                <div className={`role-card ${formData.role === 'security' ? 'selected' : ''}`} onClick={() => handleRoleSelect('security')}>
                  <Scan size={28} style={{ color: '#f43f5e' }} />
                  <div className="rc-name">Security / Frontdesk</div>
                  <div className="rc-desc">Scan passes, check visitors in & out</div>
                </div>
                <div className={`role-card ${formData.role === 'employee' ? 'selected' : ''}`} onClick={() => handleRoleSelect('employee')}>
                  <Users size={28} style={{ color: '#0ea5e9' }} />
                  <div className="rc-name">Employee / Host</div>
                  <div className="rc-desc">Invite visitors, approve appointments</div>
                </div>
                <div className={`role-card ${formData.role === 'visitor' ? 'selected' : ''}`} onClick={() => handleRoleSelect('visitor')}>
                  <Contact size={28} style={{ color: '#00c9a7' }} />
                  <div className="rc-name">Visitor</div>
                  <div className="rc-desc">Pre-register, view & download your pass</div>
                </div>
              </div>

              {formData.role === 'employee' && (
                <div className="fg" style={{ marginTop: '14px' }}>
                  <label>Department</label>
                  <div className="iw">
                    <Building size={16} />
                    <select 
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      style={{ padding: '9px 12px 9px 34px' }}
                    >
                      <option value="IT">IT Department</option>
                      <option value="HR">Human Resources</option>
                      <option value="Finance">Finance / Billing</option>
                      <option value="Legal">Legal & Compliance</option>
                    </select>
                  </div>
                </div>
              )}

              {formData.role && (
                <div id="roleNote" style={{ marginTop: '12px', padding: '10px 12px', background: '#f0fdf9', border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '12px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Info size={14} style={{ color: '#00c9a7', flexShrink: 0 }} />
                  <span id="roleNoteText">{roleMessages[formData.role]}</span>
                </div>
              )}

              <div className="reg-footer">
                <button type="button" className="btn-back" onClick={handleBack}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button type="button" className="btn-next" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Submitting...' : <>Register <Check size={14} /></>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: OTP Verification Screen */}
          {step === 4 && (
            <div className="reg-step active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
              <div className="success-icon" style={{ background: '#e0f2fe', color: '#0ea5e9', marginBottom: '14px' }}><Lock size={28} /></div>
              <h3 style={{ fontFamily: 'var(--syne)', fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--navy)' }}>Verify your registration</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '380px', margin: '0 auto 20px', lineHeight: '1.4' }}>
                We have dispatched a 6-digit OTP security code to <strong>{formData.email}</strong>. Please check your inbox (or terminal console logs if testing locally).
              </p>
              
              <div className="fg" style={{ width: '100%', maxWidth: '280px', margin: '0 auto 20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enter 6-Digit OTP Code</label>
                <div className="iw" style={{ marginTop: '6px' }}>
                  <input 
                    type="text" 
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 123456"
                    maxLength={6}
                    style={{ padding: '12px', fontSize: '20px', letterSpacing: '6px', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'center' }}>
                <button type="button" className="btn-login" style={{ maxWidth: '280px' }} onClick={handleVerifyOTP} disabled={loading}>
                  {loading ? 'Verifying OTP...' : 'Verify and Activate'}
                </button>
                <button type="button" className="btn-back" style={{ border: 'none', background: 'none', color: '#00a88b', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }} onClick={() => sendOtp(formData.email)}>
                  Resend Verification OTP
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Success confirmation screen */}
          {step === 5 && (
            <div className="reg-step active">
              <div className="success-box">
                <div className="success-icon"><Check size={32} /></div>
                <div style={{ fontFamily: 'var(--syne)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>You're all set!</div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '340px', margin: '0 auto 20px' }}>Your account was registered. Your dashboard will open automatically according to your role.</p>
                
                <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', textAlign: 'left', maxWidth: '360px', margin: '0 auto 20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '10px' }}>Dashboard highlights</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px' }}><div style={{ width: '20px', height: '20px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', fontSize: '11px', flexShrink: 0 }}><Check size={10} /></div>Role detected automatically</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px' }}><div style={{ width: '20px', height: '20px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', fontSize: '11px', flexShrink: 0 }}><Check size={10} /></div>QR generation active</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}><div style={{ width: '20px', height: '20px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', fontSize: '11px', flexShrink: 0 }}><Check size={10} /></div>Check-in alerts enabled</div>
                </div>
                
                <button className="btn-login" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={() => navigate(`/${formData.role}`, { replace: true })}>
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
