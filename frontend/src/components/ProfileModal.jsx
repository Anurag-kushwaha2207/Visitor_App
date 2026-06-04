import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, User, Phone, Image, Building, ShieldCheck, Mail, MapPin,
  Sun, Moon, Monitor, Settings, LogOut, ShieldAlert
} from 'lucide-react';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile, showToast, logout } = useAuth();

  // Local state initialized with fallback empty strings
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [floorNo, setFloorNo] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [seatNo, setSeatNo] = useState('');
  const [photo, setPhoto] = useState('');
  const [saving, setSaving] = useState(false);

  // Theme Settings state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Enterprise settings for Admin (persisted in localStorage)
  const [requirePreApproval, setRequirePreApproval] = useState(true);
  const [autoVerifyDomains, setAutoVerifyDomains] = useState(false);
  const [autoGeneratePDF, setAutoGeneratePDF] = useState(true);

  // Synchronize user settings when the modal is opened
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setFloorNo(user.floorNo || '');
      setRoomNo(user.roomNo || '');
      setSeatNo(user.seatNo || '');
      setPhoto(user.profilePhoto || '');
      setTheme(localStorage.getItem('theme') || 'light');

      // Load admin settings from localStorage if user is admin
      if (user.role === 'admin') {
        const storedPreApproval = localStorage.getItem('admin_requirePreApproval');
        const storedAutoVerify = localStorage.getItem('admin_autoVerifyDomains');
        const storedAutoPrint = localStorage.getItem('admin_autoPrintBadge');
        
        setRequirePreApproval(storedPreApproval !== 'false'); // defaults to true
        setAutoVerifyDomains(storedAutoVerify === 'true'); // defaults to false
        setAutoGeneratePDF(storedAutoPrint !== 'false'); // defaults to true
      }
    }
  }, [isOpen, user]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark');
    } else if (newTheme === 'light') {
      document.body.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
    localStorage.setItem('theme', newTheme);
  };

  const handleAdminSettingChange = (settingKey, value) => {
    if (settingKey === 'preApproval') {
      setRequirePreApproval(value);
      localStorage.setItem('admin_requirePreApproval', value ? 'true' : 'false');
    } else if (settingKey === 'autoVerify') {
      setAutoVerifyDomains(value);
      localStorage.setItem('admin_autoVerifyDomains', value ? 'true' : 'false');
    } else if (settingKey === 'autoPrint') {
      setAutoGeneratePDF(value);
      localStorage.setItem('admin_autoPrintBadge', value ? 'true' : 'false');
    }
  };

  if (!isOpen || !user) return null;

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result); // Base64 Data URL
        showToast('Photo selected successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      showToast('Name and phone are required', 'error');
      return;
    }

    setSaving(true);
    const result = await updateProfile({
      name,
      phone,
      floorNo,
      roomNo,
      seatNo,
      profilePhoto: photo
    });
    setSaving(false);

    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(10,22,40,0.6)', zIndex: 1000, justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="modal-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', width: '92%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ background: 'var(--navy)', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #00c9a7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#00c9a7', width: '22px', height: '22px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><ShieldCheck size={14} /></div>
            <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--syne)' }}>My Profile & Settings</span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: '2px' }}><X size={18} /></button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} style={{ padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
          
          {/* Avatar Picture Block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ position: 'relative' }}>
              <div 
                className="av" 
                style={{ 
                  width: '75px', 
                  height: '75px', 
                  background: 'var(--teal)', 
                  fontSize: '22px',
                  backgroundImage: photo ? `url(${photo})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '2px solid var(--border)'
                }}
              >
                {!photo && name.slice(0, 2).toUpperCase()}
              </div>
              <label htmlFor="modal-photo" style={{ position: 'absolute', bottom: 0, right: 0, background: '#00c9a7', border: '1.5px solid #fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <Image size={11} />
                <input id="modal-photo" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </label>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Click icon to upload new photo</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Name Field */}
            <div className="fg" style={{ margin: 0 }}>
              <label>Full Name</label>
              <div className="iw">
                <User size={15} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '8px 10px 8px 30px' }} />
              </div>
            </div>

            {/* Email Field (Disabled) */}
            <div className="fg" style={{ margin: 0 }}>
              <label>Email Address (Account ID)</label>
              <div className="iw">
                <Mail size={15} />
                <input type="email" value={user.email} disabled style={{ padding: '8px 10px 8px 30px', background: 'var(--surface)', color: 'var(--muted)' }} />
              </div>
            </div>

            {/* Phone Field */}
            <div className="fg" style={{ margin: 0 }}>
              <label>Phone Number</label>
              <div className="iw">
                <Phone size={15} />
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ padding: '8px 10px 8px 30px' }} />
              </div>
            </div>

            {/* Organization / Dept (Disabled) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="fg" style={{ margin: 0 }}>
                <label>Organization</label>
                <div className="iw">
                  <Building size={14} />
                  <input type="text" value={user.organization || 'VPMS HQ'} disabled style={{ padding: '8px 10px 8px 30px', background: 'var(--surface)', color: 'var(--muted)' }} />
                </div>
              </div>
              <div className="fg" style={{ margin: 0 }}>
                <label>Department</label>
                <div className="iw">
                  <Building size={14} />
                  <input type="text" value={user.department || 'N/A'} disabled style={{ padding: '8px 10px 8px 30px', background: 'var(--surface)', color: 'var(--muted)' }} />
                </div>
              </div>
            </div>

            {/* Host Location Fields (Only for Employees) */}
            {user.role === 'employee' && (
              <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--slate)' }}>Host Location Info (Optional)</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="fg" style={{ margin: 0 }}>
                    <label>Floor No.</label>
                    <input type="text" placeholder="e.g. 3rd" value={floorNo} onChange={(e) => setFloorNo(e.target.value)} style={{ padding: '6px 10px', fontSize: '12px' }} />
                  </div>
                  <div className="fg" style={{ margin: 0 }}>
                    <label>Room No.</label>
                    <input type="text" placeholder="e.g. 302" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} style={{ padding: '6px 10px', fontSize: '12px' }} />
                  </div>
                  <div className="fg" style={{ margin: 0 }}>
                    <label>Seat No.</label>
                    <input type="text" placeholder="e.g. B-12" value={seatNo} onChange={(e) => setSeatNo(e.target.value)} style={{ padding: '6px 10px', fontSize: '12px' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Theme Mode Selector */}
            <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--slate)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Settings size={12} /> Interface Theme Settings
              </span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button 
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px',
                    border: '1.5px solid',
                    borderColor: theme === 'light' ? '#00c9a7' : 'var(--border)',
                    borderRadius: '8px',
                    background: theme === 'light' ? 'rgba(0, 201, 167, 0.05)' : 'var(--card)',
                    color: theme === 'light' ? '#00c9a7' : 'var(--text)',
                    fontWeight: 600,
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Sun size={12} /> Light
                </button>

                <button 
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px',
                    border: '1.5px solid',
                    borderColor: theme === 'dark' ? '#00c9a7' : 'var(--border)',
                    borderRadius: '8px',
                    background: theme === 'dark' ? 'rgba(0, 201, 167, 0.05)' : 'var(--card)',
                    color: theme === 'dark' ? '#00c9a7' : 'var(--text)',
                    fontWeight: 600,
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Moon size={12} /> Dark
                </button>

                <button 
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px',
                    border: '1.5px solid',
                    borderColor: theme === 'system' ? '#00c9a7' : 'var(--border)',
                    borderRadius: '8px',
                    background: theme === 'system' ? 'rgba(0, 201, 167, 0.05)' : 'var(--card)',
                    color: theme === 'system' ? '#00c9a7' : 'var(--text)',
                    fontWeight: 600,
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Monitor size={12} /> System
                </button>
              </div>
            </div>

            {/* Enterprise Security Settings (Admin Only) */}
            {user.role === 'admin' && (
              <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--slate)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={12} style={{ color: '#f43f5e' }} /> Enterprise Pass Security Settings
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11.5px' }}>
                    <input 
                      type="checkbox" 
                      checked={requirePreApproval}
                      onChange={(e) => handleAdminSettingChange('preApproval', e.target.checked)}
                      style={{ width: '14px', height: '14px', accentColor: '#00c9a7', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Require Host Pre-Approval</div>
                      <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Visitors require host approval before QR pass generation.</span>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11.5px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={autoVerifyDomains}
                      onChange={(e) => handleAdminSettingChange('autoVerify', e.target.checked)}
                      style={{ width: '14px', height: '14px', accentColor: '#00c9a7', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Auto-Verify Partner Domains</div>
                      <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Bypass OTP for registered corporate email domains.</span>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11.5px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={autoGeneratePDF}
                      onChange={(e) => handleAdminSettingChange('autoPrint', e.target.checked)}
                      style={{ width: '14px', height: '14px', accentColor: '#00c9a7', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Auto-Print Badge on Scan</div>
                      <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Send badge automatically to lobby printer on check-in.</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Account Session / Logout */}
            <div style={{ background: 'rgba(244, 63, 94, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LogOut size={12} /> Account Session
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Terminate active session on this device</span>
                <button 
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: '#f43f5e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    boxShadow: '0 2px 4px rgba(244, 63, 94, 0.15)'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e11d48'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f43f5e'}
                >
                  <LogOut size={12} /> Logout Securely
                </button>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <button type="button" className="bsm bout" onClick={onClose} disabled={saving} style={{ padding: '6px 14px' }}>Cancel</button>
            <button type="submit" className="bsm bpri" disabled={saving} style={{ padding: '6px 14px' }}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ProfileModal;
