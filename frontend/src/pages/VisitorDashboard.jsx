import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import ProfileModal from '../components/ProfileModal';
import { 
  Contact, Download, Share2, UserCircle, MapPin, Clock, CheckCircle,
  History, Calendar, Send, Briefcase, Mail, User, ShieldAlert, HelpCircle,
  Sun, Moon, Monitor, Settings, LogOut
} from 'lucide-react';

const VisitorDashboard = () => {
  const [activeTab, setActiveTab] = useState('pass');
  const [pass, setPass] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pre-registration form states
  const [preForm, setPreForm] = useState({ hostId: '', purpose: '', scheduledTime: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Advanced Dashboard States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const { user, showToast, logout } = useAuth();

  // Apply theme to document body
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else if (theme === 'light') {
      document.body.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchVisitorData = async () => {
    try {
      setLoading(true);
      // Fetch latest active pass
      try {
        const passRes = await axios.get('/passes/my-pass');
        if (passRes.data.success) {
          setPass(passRes.data.pass);
        }
      } catch (err) {
        // Safe to ignore if visitor has no approved appointments yet
        console.log('No approved pass available');
      }

      // Fetch hosts for dropdown selection
      const hostsRes = await axios.get('/appointments/hosts');
      if (hostsRes.data.success) {
        setHosts(hostsRes.data.hosts);
      }

      // Fetch FAQs from backend
      try {
        const faqRes = await axios.get('/info/faq');
        if (faqRes.data.success) {
          setFaqs(faqRes.data.faqs);
        }
      } catch (err) {
        console.log('No FAQs retrieved');
      }

      // Fetch visit history from backend
      try {
        const historyRes = await axios.get('/appointments');
        if (historyRes.data.success) {
          setHistoryLogs(historyRes.data.appointments);
        }
      } catch (err) {
        console.log('No appointment history retrieved');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading portal data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitorData();
  }, []);

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    if (!preForm.hostId || !preForm.purpose || !preForm.scheduledTime) {
      showToast('Please fill in all scheduling fields', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await axios.post('/appointments', {
        hostId: preForm.hostId,
        purpose: preForm.purpose,
        scheduledTime: preForm.scheduledTime
      });

      if (res.data.success) {
        showToast('Pre-registration submitted to host for review!');
        setPreForm({ hostId: '', purpose: '', scheduledTime: '' });
        setActiveTab('pass');
        fetchVisitorData(); // reload
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting registration', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pass) return;
    // Direct link to backend pdf endpoint with security token
    window.open(`http://localhost:5000/api/passes/${pass._id}/pdf?token=${localStorage.getItem('vpms_token')}`);
    showToast('Initiated PDF Badge Download');
  };

  return (
    <div className="dw">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onProfileClick={() => setShowProfileModal(true)} 
      />
      
      <div className="mc">
        {/* Header bar */}
        <div className="tb">
          <div className="tbl">
            <div className="ptitle">Visitor Portal</div>
          </div>
          <div className="tbr">
            <div 
              className="av" 
              onClick={() => setShowProfileModal(true)}
              style={{ 
                background: '#00c9a7', 
                width: '30px', 
                height: '30px', 
                fontSize: '10px', 
                cursor: 'pointer',
                backgroundImage: user?.profilePhoto ? `url(${user.profilePhoto})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!user?.profilePhoto && user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="ca">
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <div className="loading-spinner" />
            </div>
          ) : (
            <>
              {/* TAB 1: Pass & Details View */}
              {activeTab === 'pass' && (
                <>
                  {pass ? (
                    <>
                      {/* Secure pass container widget */}
                      <div className="pass-c" style={{ maxWidth: '400px', margin: '0 auto 16px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
                          <div style={{ fontSize: '11px', color: '#00c9a7', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600 }}>
                            VPMS DIGITAL VISITOR PASS
                          </div>
                          <div style={{ fontSize: '10px', color: '#94b8d4', marginTop: '2px' }}>
                            Show this QR code at the Security Desk
                          </div>
                        </div>

                        {/* Large, Centered QR Code */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
                          <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', display: 'inline-block' }}>
                            <QRCodeCanvas 
                              value={pass.qrCodePayload} 
                              size={180} 
                              level="H"
                            />
                          </div>
                          <div style={{ fontSize: '10px', color: '#64c8b4', textTransform: 'uppercase', fontWeight: 600, marginTop: '10px', letterSpacing: '1px' }}>
                            SCAN TO ENTER & EXIT
                          </div>
                        </div>

                        {/* Visitor Info Section */}
                        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                          <div style={{ fontSize: '9px', color: '#64c8b4', textTransform: 'uppercase', letterSpacing: '.7px' }}>Visitor Name</div>
                          <div style={{ fontSize: '20px', fontFamily: 'var(--syne)', fontWeight: 700, margin: '2px 0 8px', color: '#fff' }}>{user.name}</div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                            <div>
                              <div style={{ fontSize: '9px', color: '#94b8d4', textTransform: 'uppercase' }}>Visiting Host</div>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>{pass.appointment?.host?.name || 'Staff'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '9px', color: '#94b8d4', textTransform: 'uppercase' }}>Department</div>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>{pass.appointment?.host?.department || 'IT'} Dept</div>
                            </div>
                          </div>
                        </div>

                        {/* Host Information Block inside the pass container */}
                        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                          <div style={{ fontSize: '9px', color: '#64c8b4', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '8px' }}>Host Employee Details</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div 
                              className="av" 
                              style={{ 
                                width: '36px', 
                                height: '36px', 
                                background: 'rgba(255,255,255,0.1)', 
                                border: '1px solid rgba(255,255,255,0.2)',
                                backgroundImage: pass.appointment?.host?.profilePhoto ? `url(${pass.appointment.host.profilePhoto})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                fontSize: '11px',
                                color: '#fff',
                                fontWeight: 600
                              }}
                            >
                              {!pass.appointment?.host?.profilePhoto && pass.appointment?.host?.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{pass.appointment?.host?.name || 'Staff'}</div>
                              <div style={{ fontSize: '10px', color: '#94b8d4' }}>{pass.appointment?.host?.department || 'N/A'} Department</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#e2f8f4', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                            <div>📧 {pass.appointment?.host?.email || 'N/A'}</div>
                            <div>📞 {pass.appointment?.host?.phone || 'N/A'}</div>
                            {(pass.appointment?.host?.floorNo || pass.appointment?.host?.roomNo || pass.appointment?.host?.seatNo) && (
                              <div style={{ background: 'rgba(0, 201, 167, 0.08)', padding: '6px', borderRadius: '6px', marginTop: '4px', border: '1px solid rgba(0, 201, 167, 0.15)', color: '#00c9a7', fontWeight: 500, fontSize: '10.5px' }}>
                                📍 Location: {
                                  [
                                    pass.appointment.host.floorNo ? `Floor ${pass.appointment.host.floorNo}` : '',
                                    pass.appointment.host.roomNo ? `Room ${pass.appointment.host.roomNo}` : '',
                                    pass.appointment.host.seatNo ? `Seat ${pass.appointment.host.seatNo}` : ''
                                  ].filter(Boolean).join(' | ')
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="prow" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginBottom: '14px', textAlign: 'left' }}>
                          <div className="pf">
                            <div className="pfl">Pass ID</div>
                            <div className="pfv" style={{ fontFamily: 'monospace', color: '#fff' }}>{pass.passCode}</div>
                          </div>
                          <div className="pf">
                            <div className="pfl">Date</div>
                            <div className="pfv" style={{ color: '#fff' }}>{new Date(pass.validFrom).toLocaleDateString()}</div>
                          </div>
                          <div className="pf">
                            <div className="pfl">Valid until</div>
                            <div className="pfv" style={{ color: '#fff' }}>
                              {new Date(pass.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="pf" style={{ minWidth: '100%', marginTop: '6px' }}>
                            <div className="pfl">Purpose</div>
                            <div className="pfv" style={{ color: '#fff' }}>{pass.appointment?.purpose}</div>
                          </div>
                        </div>
                        
                        <div className="pfoot" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <div className="pst">
                            <div className="sdot"></div>
                            <span>Active pass</span>
                          </div>
                          <div style={{ display: 'flex', gap: '7px' }}>
                            <button onClick={handleDownloadPDF} className="bsm" style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.2)', color: '#fff', fontSize: '11px' }}>
                              <Download size={11} /> PDF Badge
                            </button>
                            <button onClick={() => showToast('Pass code copied to clipboard!')} className="bsm" style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.2)', color: '#fff', fontSize: '11px' }}>
                              <Share2 size={11} /> Copy ID
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Offline PDF pass download card below pass container */}
                      <div className="secc" style={{ maxWidth: '400px', margin: '0 auto 16px', background: 'linear-gradient(135deg, #0a1628 0%, #0f1e3a 100%)', border: '1.5px solid rgba(0, 201, 167, 0.35)', borderRadius: '12px', padding: '16px', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ background: 'rgba(0, 201, 167, 0.12)', color: '#00c9a7', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Download size={20} />
                          </div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff', fontFamily: 'var(--syne)' }}>Offline PDF Badge Access</div>
                            <div style={{ fontSize: '11px', color: '#94b8d4', marginTop: '3px', lineHeight: '1.4' }}>Download your pass as a PDF document for seamless gate checking when offline.</div>
                          </div>
                        </div>
                        <button 
                          onClick={handleDownloadPDF} 
                          className="btn-login" 
                          style={{ marginTop: '12px', background: '#00c9a7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', fontSize: '12.5px', fontWeight: 600, padding: '9px 12px' }}
                        >
                          <Download size={14} /> Download PDF Pass Badge
                        </button>
                      </div>

                      {/* Details row layout */}
                      <div className="two">
                        <div className="secc">
                          <div className="sech">
                            <span className="sect"><Calendar style={{ color: '#00c9a7' }} />Appointment details</span>
                          </div>
                          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                              <div style={{ width: '30px', height: '30px', background: '#f0fdf9', borderRadius: '7px', display: 'flex', alignItems: 'center', justify: 'center', color: '#00a88b', fontSize: '15px' }}>
                                <UserCircle size={16} />
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Host Employee</div>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>{pass.appointment?.host?.name}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                              <div style={{ width: '30px', height: '30px', background: '#f0fdf9', borderRadius: '7px', display: 'flex', alignItems: 'center', justify: 'center', color: '#00a88b', fontSize: '15px' }}>
                                <MapPin size={16} />
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Location / Office</div>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                  {pass.appointment?.location || (pass.appointment?.host?.floorNo || pass.appointment?.host?.roomNo || pass.appointment?.host?.seatNo ? [
                                    pass.appointment.host.floorNo ? `${pass.appointment.host.floorNo} Floor` : '',
                                    pass.appointment.host.roomNo ? `Room ${pass.appointment.host.roomNo}` : '',
                                    pass.appointment.host.seatNo ? `Seat ${pass.appointment.host.seatNo}` : ''
                                  ].filter(Boolean).join(', ') : 'Main Reception')}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                              <div style={{ width: '30px', height: '30px', background: '#f0fdf9', borderRadius: '7px', display: 'flex', alignItems: 'center', justify: 'center', color: '#00a88b', fontSize: '15px' }}>
                                <Clock size={16} />
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Check-in time</div>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                  {new Date(pass.appointment?.scheduledTime).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                              <div style={{ width: '30px', height: '30px', background: '#f0fdf9', borderRadius: '7px', display: 'flex', alignItems: 'center', justify: 'center', color: '#00a88b', fontSize: '15px' }}>
                                <CheckCircle size={16} />
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Verification Status</div>
                                <span className={`pill ${pass.status === 'used' ? 'pgr' : 'pg'}`}>
                                  {pass.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* History timeline card */}
                        <div className="secc">
                          <div className="sech">
                            <span className="sect"><History style={{ color: 'var(--text)' }} />Pass transaction timeline</span>
                          </div>
                          <div className="tl">
                            <div className="tli">
                              <div className="tld" style={{ background: '#f0fdf9', color: '#00a88b' }}><CheckCircle size={11} /></div>
                              <div className="tlb">
                                <div className="tlt">Pass confirmed via MERN backend signature</div>
                                <div className="tlti">{new Date(pass.createdAt).toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="tli">
                              <div className="tld" style={{ background: '#ede9fe', color: '#6d28d9' }}><CheckCircle size={11} /></div>
                              <div className="tlb">
                                <div className="tlt">Pre-registration approved by Host Host</div>
                                <div className="tlti">{new Date(pass.validFrom).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Renders if there is no active pass approved yet */
                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                      <ShieldAlert size={36} style={{ color: '#f59e0b', marginBottom: '12px', display: 'inline-block' }} />
                      <h3>No active visitor pass</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '6px' }}>
                        Your appointments are currently pending employee host approval. Once approved, your dynamic QR digital pass will display here automatically.
                      </p>
                      <button onClick={() => setActiveTab('register-visit')} className="bsm bpri" style={{ margin: '16px auto 0', display: 'flex', alignItems: 'center' }}>
                        <Send size={12} /> Pre-register a visit
                      </button>
                    </div>
                  )}

                  {/* FAQs Section on Home Page */}
                  <div className="secc" style={{ maxWidth: '500px', margin: '24px auto 0' }}>
                    <div className="sech">
                      <span className="sect"><HelpCircle style={{ color: '#00c9a7' }} />Frequently Asked Questions</span>
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {faqs.map((faq, i) => (
                        <div key={i} style={{ borderBottom: i === faqs.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: '12px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', marginBottom: '4px', display: 'flex', gap: '6px', alignItems: 'flex-start', textAlign: 'left' }}>
                            <span style={{ color: '#00c9a7' }}>Q.</span>
                            <span>{faq.q}</span>
                          </h4>
                          <p style={{ fontSize: '12px', color: 'var(--muted)', paddingLeft: '18px', lineHeight: '1.4', textAlign: 'left' }}>
                            {faq.a}
                          </p>
                        </div>
                      ))}
                      {faqs.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '10px', color: 'var(--muted)', fontSize: '12px' }}>
                          No FAQs loaded.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: Pre-register Next Visit */}
              {activeTab === 'register-visit' && (
                <div className="secc" style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <div className="sech">
                    <span className="sect"><Contact style={{ color: '#00c9a7' }} />Pre-Register Next Appointment</span>
                  </div>
                  
                  <form onSubmit={handlePreSubmit} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                      
                      <div className="fg" style={{ margin: 0 }}>
                        <label>Visitor Name</label>
                        <div className="iw">
                          <User size={16} />
                          <input 
                            type="text" 
                            disabled 
                            value={user.name} 
                            style={{ padding: '9px 12px 9px 34px', background: '#f8fafc', color: 'var(--muted)' }} 
                          />
                        </div>
                      </div>

                      <div className="fg" style={{ margin: 0 }}>
                        <label>Host / Employee to Visit (Required)</label>
                        <div className="iw">
                          <UserCircle size={16} />
                          <select 
                            required
                            value={preForm.hostId}
                            onChange={(e) => setPreForm(prev => ({ ...prev, hostId: e.target.value }))}
                            style={{ padding: '9px 12px 9px 34px' }}
                          >
                            <option value="">Select an employee host...</option>
                            {hosts.map((h, i) => (
                              <option key={i} value={h._id}>
                                {h.name} ({h.department} Department)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="fg" style={{ margin: 0 }}>
                        <label>Scheduled Date & Time (Required)</label>
                        <div className="iw">
                          <Clock size={16} />
                          <input 
                            type="datetime-local" 
                            required
                            value={preForm.scheduledTime}
                            onChange={(e) => setPreForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                            style={{ padding: '9px 12px 9px 34px' }}
                          />
                        </div>
                      </div>

                      <div className="fg" style={{ margin: 0 }}>
                        <label>Purpose of visit (Required)</label>
                        <div className="iw">
                          <Briefcase size={16} />
                          <input 
                            type="text" 
                            required
                            value={preForm.purpose}
                            onChange={(e) => setPreForm(prev => ({ ...prev, purpose: e.target.value }))}
                            placeholder="Meeting / Job Interview / Delivery..." 
                            style={{ padding: '9px 12px 9px 34px' }}
                          />
                        </div>
                      </div>

                    </div>

                    <button type="submit" className="btn-login" style={{ width: '100%' }} disabled={submitLoading}>
                      {submitLoading ? 'Submitting request...' : <>Submit pre-registration request</>}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: FAQ / Help */}
              {activeTab === 'help' && (
                <div className="secc" style={{ maxWidth: '650px', margin: '0 auto' }}>
                  <div className="sech">
                    <span className="sect"><HelpCircle style={{ color: '#00c9a7' }} />Frequently Asked Questions</span>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {faqs.map((faq, i) => (
                      <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ color: '#00c9a7' }}>Q.</span>
                          <span>{faq.q}</span>
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--muted)', paddingLeft: '18px', lineHeight: '1.4' }}>
                          {faq.a}
                        </p>
                      </div>
                    ))}
                    {faqs.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                        No FAQs loaded.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Visit History / Appointments */}
              {(activeTab === 'history' || activeTab === 'appointments') && (
                <div className="secc" style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div className="sech">
                    <span className="sect"><History style={{ color: '#00c9a7' }} />My Appointment Schedules</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Host Employee</th>
                          <th>Scheduled Time</th>
                          <th>Location</th>
                          <th>Purpose</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyLogs.map((log, i) => (
                          <tr key={i}>
                            <td>
                              <div style={{ fontWeight: 500 }}>{log.host?.name || 'Staff'}</div>
                              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{log.host?.department || 'IT'} Dept</div>
                            </td>
                            <td>{new Date(log.scheduledTime).toLocaleString()}</td>
                            <td>{log.location || 'Main Reception'}</td>
                            <td>{log.purpose}</td>
                            <td>
                              <span className={`pill ${log.status === 'approved' ? 'pg' : log.status === 'pending' ? 'pa' : 'pr'}`}>
                                {log.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {historyLogs.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                              No appointments scheduled yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}



            </>
          )}

        </div>
      </div>
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
};

export default VisitorDashboard;
