import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import ProfileModal from '../components/ProfileModal';
import NotificationsDropdown from '../components/NotificationsDropdown';
import { 
  Calendar, Hourglass, CheckSquare, Check, X, 
  Plus, Bell, Search, Settings, LogOut, UserPlus, Clock, Briefcase, Mail, Send,
  Sun, Moon, Monitor, MapPin, Building, CheckCircle, History
} from 'lucide-react';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ todayCount: 0, pendingCount: 0, monthCount: 0, invitesSent: 0 });

  // Invitation Form
  const [inviteForm, setInviteForm] = useState({ visitorEmail: '', visitorName: '', visitorPhone: '', purpose: '', scheduledTime: '', location: '' });
  const [inviteLoading, setInviteLoading] = useState(false);

  // Advanced Dashboard States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Host location states
  const [floorNo, setFloorNo] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [seatNo, setSeatNo] = useState('');

  const { user, updateProfile, showToast, logout } = useAuth();

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

  // Sync user location settings
  useEffect(() => {
    if (user) {
      setFloorNo(user.floorNo || '');
      setRoomNo(user.roomNo || '');
      setSeatNo(user.seatNo || '');
    }
  }, [user]);

  const fetchHostData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/appointments');
      if (res.data.success) {
        const apps = res.data.appointments;
        setAppointments(apps);

        // Calculate statistics
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();
        
        const todayApps = apps.filter(a => new Date(a.scheduledTime).toDateString() === today);
        const pendingApps = apps.filter(a => a.status === 'pending');
        const monthApps = apps.filter(a => new Date(a.scheduledTime).getMonth() === thisMonth);
        const approvedApps = apps.filter(a => a.status === 'approved');

        setStats({
          todayCount: todayApps.length,
          pendingCount: pendingApps.length,
          monthCount: monthApps.length,
          invitesSent: approvedApps.length
        });
      }

    } catch (err) {
      console.error(err);
      showToast('Error loading host data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await axios.put(`/appointments/${id}/status`, { status });
      if (res.data.success) {
        showToast(`Appointment has been ${status === 'approved' ? 'approved' : 'declined'}.`);
        fetchHostData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating status', 'error');
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.visitorEmail || !inviteForm.purpose || !inviteForm.scheduledTime) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    setInviteLoading(true);
    try {
      // Create or retrieve visitor profile on the fly
      let visitorId = '';
      const newVisitorRes = await axios.post('/admin/users', {
        name: inviteForm.visitorName || 'Invited Visitor',
        email: inviteForm.visitorEmail,
        password: 'password123', // temp password
        phone: inviteForm.visitorPhone || `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
        role: 'visitor',
        organization: 'Invited Client'
      });
      
      if (newVisitorRes.data.success) {
        const visitorUser = newVisitorRes.data.user;
        visitorId = visitorUser._id || visitorUser.id;
      }

      // 2. Create the appointment link
      const res = await axios.post('/appointments', {
        visitorId,
        hostId: user.id,
        purpose: inviteForm.purpose,
        scheduledTime: inviteForm.scheduledTime,
        location: inviteForm.location
      });

      if (res.data.success) {
        showToast(`Invitation sent to ${inviteForm.visitorEmail}! Pass generated.`);
        setInviteForm({ visitorEmail: '', visitorName: '', visitorPhone: '', purpose: '', scheduledTime: '', location: '' });
        setActiveTab('overview');
        fetchHostData();
      }

    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send invitation', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const pendingList = appointments.filter(a => a.status === 'pending');
  const approvedList = appointments.filter(a => a.status === 'approved');

  return (
    <div className="dw">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onProfileClick={() => setShowProfileModal(true)} 
        onNotificationsClick={() => setShowNotiDropdown(!showNotiDropdown)} 
      />
      
      <div className="mc">
        {/* Header bar */}
        <div className="tb">
          <div className="tbl">
            <div className="ptitle">Host Dashboard</div>
            <div className="sbox">
              <Search size={14} />
              <input placeholder="Search my visitors..." />
            </div>
          </div>
          <div className="tbr" style={{ position: 'relative' }}>
            <button className="bsm bpri" onClick={() => setActiveTab('invite')} style={{ padding: '6px 12px' }}>
              <UserPlus size={12} /> <span>Invite</span>
            </button>
            <div className="ibtn" onClick={() => setShowNotiDropdown(!showNotiDropdown)} style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={15} />
              <div className="ndot"></div>
            </div>
            <div 
              className="av" 
              onClick={() => setShowProfileModal(true)}
              style={{ 
                background: '#0ea5e9', 
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
            <NotificationsDropdown 
              isOpen={showNotiDropdown} 
              onClose={() => setShowNotiDropdown(false)} 
              logs={appointments.map(a => ({
                visitor: a.visitor,
                status: a.status === 'approved' ? 'inside' : 'pending',
                checkInTime: a.scheduledTime
              }))}
            />
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
              {/* Stats KPIs row */}
              <div className="sg">
                <div className="sc">
                  <div className="si" style={{ background: '#dbeafe', color: '#1d4ed8' }}><Calendar /></div>
                  <div className="sv" style={{ color: '#1d4ed8' }}>{stats.todayCount}</div>
                  <div className="sl">Today's Visitors</div>
                </div>
                <div className="sc">
                  <div className="si" style={{ background: '#fef3c7', color: '#92400e' }}><Hourglass /></div>
                  <div className="sv" style={{ color: '#d97706' }}>{stats.pendingCount}</div>
                  <div className="sl">Pending Approval</div>
                </div>
                <div className="sc">
                  <div className="si" style={{ background: '#dcfce7', color: '#15803d' }}><CheckSquare /></div>
                  <div className="sv" style={{ color: '#15803d' }}>{stats.monthCount}</div>
                  <div className="sl">This Month</div>
                </div>
                <div className="sc">
                  <div className="si" style={{ background: '#f0f9ff', color: '#0ea5e9' }}><Send /></div>
                  <div className="sv" style={{ color: '#0ea5e9' }}>{stats.invitesSent}</div>
                  <div className="sl">Invites Sent</div>
                </div>
              </div>

              {/* TAB 1: Overview Panel */}
              {activeTab === 'overview' && (
                <>
                  {/* Pending approvals block */}
                  <div className="secc" style={{ marginBottom: '14px' }}>
                    <div className="sech">
                      <span className="sect"><Clock style={{ color: '#d97706' }} />Pending Approvals</span>
                      <span className="pill pa">{pendingList.length} Waiting</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '30%' }}>Visitor</th>
                            <th style={{ width: '25%' }}>Purpose</th>
                            <th style={{ width: '25%' }}>Scheduled Date & Time</th>
                            <th style={{ width: '20%' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingList.map((app, i) => (
                            <tr key={i}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div className="av" style={{ background: '#7c3aed', width: '24px', height: '24px', fontSize: '9px' }}>
                                    {app.visitor?.name?.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{app.visitor?.name}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{app.visitor?.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td>{app.purpose}</td>
                              <td style={{ color: 'var(--muted)' }}>{new Date(app.scheduledTime).toLocaleString()}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <button onClick={() => handleStatusUpdate(app._id, 'approved')} className="bsm" style={{ background: '#dcfce7', borderColor: '#86efac', color: '#15803d', padding: '4px 8px', fontSize: '10px' }}>
                                    <Check size={10} /> Approve
                                  </button>
                                  <button onClick={() => handleStatusUpdate(app._id, 'declined')} className="bsm" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626', padding: '4px 8px', fontSize: '10px' }}>
                                    <X size={10} /> Deny
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {pendingList.length === 0 && (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No pending approvals needing review</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Upcoming visits & Notification grids */}
                  <div className="two">
                    <div className="secc">
                      <div className="sech">
                        <span className="sect"><Calendar style={{ color: '#0ea5e9' }} />Upcoming Approved Visitors</span>
                        <button onClick={() => setActiveTab('invite')} className="bsm bpri" style={{ fontSize: '10px', padding: '4px 9px' }}>
                          <Plus size={10} /> New
                        </button>
                      </div>
                      <div className="tl">
                        {approvedList.slice(0, 3).map((app, i) => (
                          <div className="tli" key={i}>
                            <div className="tld" style={{ background: '#dbeafe', color: '#1d4ed8' }}><Calendar size={11} /></div>
                            <div className="tlb">
                              <div className="tlt">{app.visitor?.name} · {app.purpose}</div>
                              <div className="tlti">{new Date(app.scheduledTime).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                        {approvedList.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: '11px' }}>
                            No upcoming scheduled visits
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="secc">
                      <div className="sech">
                        <span className="sect"><Bell style={{ color: 'var(--text)' }} />Gate Notifications feed</span>
                      </div>
                      <div className="tl">
                        {/* Live checklog notifications simulation */}
                        <div className="tli">
                          <div className="tld" style={{ background: '#dcfce7', color: '#15803d' }}><Check size={11} /></div>
                          <div className="tlb">
                            <div className="tlt">Rahul Kumar checked in successfully</div>
                            <div className="tlti">09:30 AM · Today · Main Entrance Gate</div>
                          </div>
                        </div>
                        <div className="tli">
                          <div className="tld" style={{ background: '#fef3c7', color: '#d97706' }}><Mail size={11} /></div>
                          <div className="tlb">
                            <div className="tlt">Pass verification email dispatched to visitor</div>
                            <div className="tlti">Yesterday · 5:00 PM · Automated mailer</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: Invite Visitor Panel */}
              {activeTab === 'invite' && (
                <div className="secc">
                  <div className="sech">
                    <span className="sect"><UserPlus style={{ color: '#0ea5e9' }} />Pre-Authorize Visitor / Client</span>
                  </div>
                  
                  <form onSubmit={handleInviteSubmit} style={{ padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                      <div className="fg" style={{ margin: 0 }}>
                        <label>Visitor Email (Required)</label>
                        <div className="iw">
                          <Mail size={16} />
                          <input 
                            type="email" 
                            required
                            value={inviteForm.visitorEmail}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, visitorEmail: e.target.value }))}
                            placeholder="visitor@client.com"
                            style={{ padding: '9px 12px 9px 34px' }}
                          />
                        </div>
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        <label>Visitor Name (Optional)</label>
                        <div className="iw">
                          <input 
                            type="text"
                            value={inviteForm.visitorName}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, visitorName: e.target.value }))}
                            placeholder="Rahul Kumar"
                            style={{ padding: '9px 12px' }}
                          />
                        </div>
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        <label>Visitor Phone (Optional)</label>
                        <div className="iw">
                          <input 
                            type="text"
                            value={inviteForm.visitorPhone}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, visitorPhone: e.target.value }))}
                            placeholder="+91 98765 00000"
                            style={{ padding: '9px 12px' }}
                          />
                        </div>
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        <label>Purpose of Visit (Required)</label>
                        <div className="iw">
                          <Briefcase size={16} />
                          <input 
                            type="text"
                            required
                            value={inviteForm.purpose}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, purpose: e.target.value }))}
                            placeholder="e.g. Project onboarding / Interview"
                            style={{ padding: '9px 12px 9px 34px' }}
                          />
                        </div>
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        <label>Visit Date & Time (Required)</label>
                        <div className="iw">
                          <Clock size={16} />
                          <input 
                            type="datetime-local" 
                            required
                            value={inviteForm.scheduledTime}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                            style={{ padding: '9px 12px 9px 34px' }}
                          />
                        </div>
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        <label>Meeting Location (Optional)</label>
                        <div className="iw">
                          <input 
                            type="text"
                            value={inviteForm.location}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="e.g. Floor 3, Lab Room"
                            style={{ padding: '9px 12px' }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button type="submit" className="btn-login" style={{ maxWidth: '200px' }} disabled={inviteLoading}>
                      {inviteLoading ? 'Processing...' : <>Send Invitation</>}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: Pending Approvals */}
              {activeTab === 'pending' && (
                <div className="secc">
                  <div className="sech">
                    <span className="sect"><Clock style={{ color: '#d97706' }} />Pending Approvals Directory</span>
                    <span className="pill pa">{pendingList.length} Waiting</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Visitor</th>
                          <th>Purpose</th>
                          <th>Scheduled Date & Time</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingList.map((app, i) => (
                          <tr key={i}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div className="av" style={{ background: '#7c3aed', width: '24px', height: '24px', fontSize: '9px' }}>
                                  {app.visitor?.name?.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{app.visitor?.name}</div>
                                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{app.visitor?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{app.purpose}</td>
                            <td style={{ color: 'var(--muted)' }}>{new Date(app.scheduledTime).toLocaleString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => handleStatusUpdate(app._id, 'approved')} className="bsm" style={{ background: '#dcfce7', borderColor: '#86efac', color: '#15803d', padding: '4px 8px', fontSize: '10px' }}>
                                  <Check size={10} /> Approve
                                </button>
                                <button onClick={() => handleStatusUpdate(app._id, 'declined')} className="bsm" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626', padding: '4px 8px', fontSize: '10px' }}>
                                  <X size={10} /> Deny
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {pendingList.length === 0 && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No pending approvals found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: Past Visitors / History */}
              {(activeTab === 'history' || activeTab === 'reports') && (
                <div className="secc">
                  <div className="sech">
                    <span className="sect"><History style={{ color: 'var(--text)' }} />My Visitor Pass History</span>
                    <button onClick={fetchHostData} className="bsm bout">Refresh</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Visitor Name</th>
                          <th>Purpose</th>
                          <th>Meeting Time</th>
                          <th>Meeting Location</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.filter(a => a.status !== 'pending').map((app, i) => (
                          <tr key={i}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div 
                                  className="av" 
                                  style={{ 
                                    background: '#0ea5e9', 
                                    width: '24px', 
                                    height: '24px', 
                                    fontSize: '9px',
                                    backgroundImage: app.visitor?.profilePhoto ? `url(${app.visitor.profilePhoto})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }}
                                >
                                  {!app.visitor?.profilePhoto && app.visitor?.name?.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{app.visitor?.name}</div>
                                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{app.visitor?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{app.purpose}</td>
                            <td>{new Date(app.scheduledTime).toLocaleString()}</td>
                            <td>{app.location || 'Main Reception'}</td>
                            <td>
                              <span className={`pill ${app.status === 'approved' ? 'pg' : 'pr'}`}>
                                {app.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {appointments.filter(a => a.status !== 'pending').length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No completed or processed invitations yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Placeholder handler */}
              {!['overview', 'invite', 'pending', 'history', 'reports'].includes(activeTab) && (
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                  <Calendar size={32} style={{ color: 'var(--slate2)', marginBottom: '12px' }} />
                  <h3>Overview module active</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>Click the "Overview" link in the sidebar to view visitor checklists and approvals.</p>
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

export default EmployeeDashboard;
