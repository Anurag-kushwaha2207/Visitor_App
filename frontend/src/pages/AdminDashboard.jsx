import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import ProfileModal from '../components/ProfileModal';
import NotificationsDropdown from '../components/NotificationsDropdown';
import { 
  Users, CheckCircle, Clock, Building, Download, BarChart2, 
  Search, Bell, Settings, Filter, Plus, ShieldAlert, Key, UserCheck,
  FileSpreadsheet, Calendar, Sun, Moon, Monitor, Activity, LogOut
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ totalVisitors: 0, activeToday: 0, pendingApproval: 0, totalDepartments: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // User creation form states
  const [userForm, setUserForm] = useState({ name: '', email: '', password: 'password123', phone: '', role: 'employee', department: 'IT', organization: 'VPMS Corporate HQ' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Advanced States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Analytics & Settings Custom States
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('all');
  const [requirePreApproval, setRequirePreApproval] = useState(true);
  const [autoVerifyDomains, setAutoVerifyDomains] = useState(false);
  const [autoGeneratePDF, setAutoGeneratePDF] = useState(true);

  const { user, logout, showToast } = useAuth();

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await axios.get('/admin/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setWeeklyData(statsRes.data.weeklyData);
        setDeptData(statsRes.data.byDepartment);
      }

      // Fetch logs
      const logsRes = await axios.get('/admin/logs');
      if (logsRes.data.success) {
        setLogs(logsRes.data.logs);
      }

      // Fetch users
      const usersRes = await axios.get('/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }

      // Fetch all appointments
      const appointmentsRes = await axios.get('/appointments');
      if (appointmentsRes.data.success) {
        setAppointments(appointmentsRes.data.appointments);
      }
    } catch (err) {
      console.error(err);
      showToast('Error fetching admin dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/admin/users', userForm);
      if (res.data.success) {
        showToast(`User ${userForm.name} created successfully!`);
        setShowAddForm(false);
        setUserForm({ name: '', email: '', password: 'password123', phone: '', role: 'employee', department: 'IT', organization: 'VPMS Corporate HQ' });
        fetchDashboardData(); // reload
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user and all associated records?')) return;
    try {
      const res = await axios.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        showToast('User deleted successfully');
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const handleVerifyPass = async (passId) => {
    showToast('Direct pass auditing is simulated.');
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.visitor?.name || '').toLowerCase().includes(searchLower) ||
      (log.visitor?.email || '').toLowerCase().includes(searchLower) ||
      (log.pass?.passCode || '').toLowerCase().includes(searchLower)
    );
  });

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      (user.role || '').toLowerCase().includes(searchLower) ||
      (user.department || '').toLowerCase().includes(searchLower)
    );
  });

  const filteredAppointments = appointments.filter(app => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (app.visitor?.name || '').toLowerCase().includes(searchLower) ||
      (app.visitor?.email || '').toLowerCase().includes(searchLower) ||
      (app.host?.name || '').toLowerCase().includes(searchLower) ||
      (app.host?.department || '').toLowerCase().includes(searchLower) ||
      (app.purpose || '').toLowerCase().includes(searchLower) ||
      (app.status || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="dw">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onProfileClick={() => setShowProfileModal(true)} 
        onNotificationsClick={() => setShowNotiDropdown(!showNotiDropdown)} 
      />
      
      <div className="mc">
        {/* Topbar Header */}
        <div className="tb">
          <div className="tbl">
            <div className="ptitle">
              {activeTab === 'dashboard' && 'Admin Dashboard'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'visitors' && 'Visitor Audits'}
              {activeTab === 'appointments' && 'Appointment Schedules'}
              {activeTab === 'analytics' && 'Traffic Analytics'}
              {activeTab === 'logs' && 'Logs and Exports'}
              {activeTab === 'settings' && 'System Settings'}
            </div>
            
            <div className="sbox">
              <Search size={14} />
              <input 
                placeholder={activeTab === 'users' ? 'Search users...' : 'Search logs, visitors, pass codes...'} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="tbr" style={{ position: 'relative' }}>
            <div className="ibtn" onClick={fetchDashboardData} title="Refresh Logs"><BarChart2 size={15} /></div>
            <div className="ibtn" onClick={() => setShowNotiDropdown(!showNotiDropdown)} style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={15} />
              <div className="ndot"></div>
            </div>
            <div 
              className="av" 
              onClick={() => setShowProfileModal(true)}
              style={{ 
                background: '#7c3aed', 
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
              logs={logs}
            />
          </div>
        </div>

        {/* Dashboard Content Areas */}
        <div className="ca">
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <div className="loading-spinner" />
            </div>
          ) : (
            <>
              {/* TAB 1: Core Dashboard View */}
              {activeTab === 'dashboard' && (
                <>
                  {/* KPI Cards Grid */}
                  <div className="sg">
                    <div className="sc">
                      <div className="si" style={{ background: '#ede9fe', color: '#7c3aed' }}><Users /></div>
                      <div className="sv" style={{ color: '#7c3aed' }}>{stats.totalVisitors}</div>
                      <div className="sl">Total Visitors</div>
                      <div className="sch up"><Users size={10} />+12% this month</div>
                    </div>
                    <div className="sc">
                      <div className="si" style={{ background: '#dcfce7', color: '#15803d' }}><CheckCircle /></div>
                      <div className="sv" style={{ color: '#15803d' }}>{stats.activeToday}</div>
                      <div className="sl">Active Today</div>
                      <div className="sch up"><Users size={10} />In building</div>
                    </div>
                    <div className="sc">
                      <div className="si" style={{ background: '#fef3c7', color: '#92400e' }}><Clock /></div>
                      <div className="sv" style={{ color: '#d97706' }}>{stats.pendingApproval}</div>
                      <div className="sl">Pending Approval</div>
                      <div className="sch dn"><ShieldAlert size={10} />Needs host action</div>
                    </div>
                    <div className="sc">
                      <div className="si" style={{ background: '#dbeafe', color: '#1d4ed8' }}><Building /></div>
                      <div className="sv" style={{ color: '#1d4ed8' }}>{stats.totalDepartments}</div>
                      <div className="sl">Departments</div>
                      <div className="sch up"><UserCheck size={10} />All active</div>
                    </div>
                  </div>

                  {/* Chart Layout row */}
                  <div className="two">
                    <div className="secc">
                      <div className="sech">
                        <span className="sect"><BarChart2 style={{ color: '#7c3aed' }} />Weekly Visitor Entries</span>
                        <button onClick={() => showToast('Weekly report downloaded!')} className="bsm bout"><Download size={11} />Export</button>
                      </div>
                      
                      {/* Bar graph visualizer */}
                      <div style={{ padding: '12px', display: 'flex', alignItems: 'flex-end', gap: '5px', height: '140px' }}>
                        {weeklyData.map((d, i) => {
                          const maxCount = Math.max(...weeklyData.map(w => w.count), 1);
                          const barHeight = Math.round((d.count / maxCount) * 100);
                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                              <div 
                                style={{ 
                                  width: '100%', 
                                  background: d.count === maxCount ? '#7c3aed' : '#ede9fe', 
                                  borderRadius: '4px 4px 0 0', 
                                  height: `${Math.max(barHeight, 10)}%`, 
                                  transition: 'height 0.5s ease',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'center',
                                  paddingTop: '2px'
                                }}
                              >
                                <span style={{ fontSize: '8px', color: d.count === maxCount ? '#fff' : '#7c3aed', fontWeight: 600 }}>{d.count}</span>
                              </div>
                              <span style={{ fontSize: '9px', color: 'var(--muted)' }}>{d.day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="secc">
                      <div className="sech">
                        <span className="sect"><Building style={{ color: '#0ea5e9' }} />By Department Tractions</span>
                      </div>
                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {deptData.map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <div style={{ flex: 1.2, fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.department}</div>
                            <div style={{ flex: 3, background: '#f1f5f9', borderRadius: '3px', height: '5px', overflow: 'hidden' }}>
                              <div style={{ width: `${d.percentage}%`, height: '100%', background: '#7c3aed', borderRadius: '3px' }}></div>
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 500, minWidth: '26px', textAlign: 'right' }}>{d.percentage}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Logs Table */}
                  <div className="secc">
                    <div className="sech">
                      <span className="sect"><Users style={{ color: 'var(--text)' }} />Recent Checked-In Logs</span>
                      <button onClick={() => setActiveTab('logs')} className="bsm bpri">View all logs</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '25%' }}>Visitor</th>
                            <th style={{ width: '20%' }}>Host / Company</th>
                            <th style={{ width: '15%' }}>Purpose</th>
                            <th style={{ width: '18%' }}>Status</th>
                            <th style={{ width: '22%' }}>Entry Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogs.slice(0, 4).map((log, i) => (
                            <tr key={i}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                  <div className="av" style={{ background: '#7c3aed', width: '24px', height: '24px', fontSize: '9px' }}>
                                    {log.visitor?.name?.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{log.visitor?.name}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{log.visitor?.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td>{log.pass?.appointment?.host?.name || 'Security Desk'}</td>
                              <td>{log.pass?.appointment?.purpose || 'N/A'}</td>
                              <td>
                                <span className={`pill ${log.status === 'inside' ? 'pg' : 'pgr'}`}>
                                  {log.status === 'inside' ? 'Checked in' : 'Checked out'}
                                </span>
                              </td>
                              <td style={{ color: 'var(--muted)' }}>{new Date(log.checkInTime).toLocaleString()}</td>
                            </tr>
                          ))}
                          {filteredLogs.length === 0 && (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No logs captured yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: User management view */}
              {activeTab === 'users' && (
                <div className="secc">
                  <div className="sech">
                    <span className="sect"><Users style={{ color: 'var(--text)' }} />System User directory ({filteredUsers.length})</span>
                    <button onClick={() => setShowAddForm(!showAddForm)} className="bsm bpri">
                      <Plus size={12} /> {showAddForm ? 'Hide panel' : 'Add employee / Guard'}
                    </button>
                  </div>

                  {/* Add direct user form panel */}
                  {showAddForm && (
                    <form onSubmit={handleCreateUser} style={{ padding: '16px', background: '#fafbfc', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div className="fg" style={{ margin: 0 }}>
                          <label>Full name</label>
                          <div className="iw">
                            <input 
                              type="text" 
                              required
                              value={userForm.name}
                              onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g. Ramesh Singh"
                              style={{ padding: '8px 12px' }}
                            />
                          </div>
                        </div>
                        <div className="fg" style={{ margin: 0 }}>
                          <label>Email address</label>
                          <div className="iw">
                            <input 
                              type="email" 
                              required
                              value={userForm.email}
                              onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="ramesh@company.com"
                              style={{ padding: '8px 12px' }}
                            />
                          </div>
                        </div>
                        <div className="fg" style={{ margin: 0 }}>
                          <label>Phone number</label>
                          <div className="iw">
                            <input 
                              type="text" 
                              required
                              value={userForm.phone}
                              onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+91 98765 00000"
                              style={{ padding: '8px 12px' }}
                            />
                          </div>
                        </div>
                        <div className="fg" style={{ margin: 0 }}>
                          <label>Role</label>
                          <div className="iw">
                            <select 
                              value={userForm.role}
                              onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                              style={{ padding: '8px 12px' }}
                            >
                              <option value="employee">Employee / Host</option>
                              <option value="security">Security / Frontdesk</option>
                              <option value="admin">System Admin</option>
                            </select>
                          </div>
                        </div>
                        
                        {userForm.role === 'employee' && (
                          <div className="fg" style={{ margin: 0 }}>
                            <label>Department</label>
                            <div className="iw">
                              <select 
                                value={userForm.department}
                                onChange={(e) => setUserForm(prev => ({ ...prev, department: e.target.value }))}
                                style={{ padding: '8px 12px' }}
                              >
                                <option value="IT">IT Department</option>
                                <option value="HR">Human Resources</option>
                                <option value="Finance">Finance</option>
                                <option value="Legal">Legal</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                      <button type="submit" className="bsm bpri"><Plus size={12} /> Create user account</button>
                    </form>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Department / Organization</th>
                          <th>Phone</th>
                          <th>Verified</th>
                          <th style={{ width: '80px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u, i) => (
                          <tr key={i}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div className="av" style={{ background: u.role === 'admin' ? '#7c3aed' : u.role === 'security' ? '#f43f5e' : u.role === 'employee' ? '#0ea5e9' : '#00c9a7', width: '24px', height: '24px', fontSize: '9px' }}>
                                  {u.name?.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{u.name}</div>
                                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`pill ${u.role === 'admin' ? 'pv' : u.role === 'security' ? 'pr' : u.role === 'employee' ? 'pb' : 'pg'}`}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td>{u.role === 'employee' ? `${u.department} Department` : u.organization}</td>
                            <td>{u.phone}</td>
                            <td>{u.isVerified ? 'Yes' : 'No'}</td>
                            <td>
                              {u._id !== user.id && (
                                <button 
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="bsm bout"
                                  style={{ color: '#f43f5e', borderColor: '#fca5a5', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: Logs view */}
              {activeTab === 'logs' && (
                <div className="secc">
                  <div className="sech">
                    <span className="sect"><FileSpreadsheet style={{ color: 'var(--text)' }} />Log files & Entry History</span>
                    <button onClick={() => showToast('CSV Exported!')} className="bsm bpri"><Download size={12} /> Export CSV</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Pass Code</th>
                          <th>Visitor</th>
                          <th>Host</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Security Guard</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'monospace', color: '#7c3aed', fontWeight: 600 }}>
                              {log.pass?.passCode || 'N/A'}
                            </td>
                            <td>{log.visitor?.name}</td>
                            <td>{log.pass?.appointment?.host?.name || 'Security desk'}</td>
                            <td>{new Date(log.checkInTime).toLocaleString()}</td>
                            <td>
                              {log.checkOutTime 
                                ? new Date(log.checkOutTime).toLocaleString() 
                                : <span className="pill pg" style={{ fontSize: '9px' }}>Still inside</span>
                              }
                            </td>
                            <td>{log.securityOfficer?.name || 'Desk Guard'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: Appointments view */}
              {activeTab === 'appointments' && (
                <div className="secc">
                  <div className="sech">
                    <span className="sect"><Calendar style={{ color: 'var(--text)' }} />System Appointments Audit ({filteredAppointments.length})</span>
                    <button onClick={fetchDashboardData} className="bsm bout">Refresh</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Visitor</th>
                          <th>Host / Employee</th>
                          <th>Purpose</th>
                          <th>Scheduled Time</th>
                          <th>Location</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((app, i) => (
                          <tr key={i}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div 
                                  className="av" 
                                  style={{ 
                                    background: '#7c3aed', 
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
                                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{app.visitor?.name || 'Deleted Visitor'}</div>
                                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{app.visitor?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '12px', fontWeight: 500 }}>{app.host?.name || 'Staff'}</div>
                              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{app.host?.department || 'N/A'} Dept</div>
                            </td>
                            <td>{app.purpose}</td>
                            <td style={{ color: 'var(--muted)' }}>{new Date(app.scheduledTime).toLocaleString()}</td>
                            <td>{app.location || 'Reception desk'}</td>
                            <td>
                              <span className={`pill ${app.status === 'approved' ? 'pg' : app.status === 'pending' ? 'pa' : 'pgr'}`}>
                                {app.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {filteredAppointments.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No appointments found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: Visitors Directory */}
              {activeTab === 'visitors' && (
                <div className="secc">
                  <div className="sech">
                    <span className="sect"><Users style={{ color: 'var(--text)' }} />Visitor Directory ({users.filter(u => u.role === 'visitor').length})</span>
                    <button onClick={fetchDashboardData} className="bsm bout">Refresh</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name / Contact</th>
                          <th>Phone</th>
                          <th>Company / Org</th>
                          <th>Verification</th>
                          <th>Registered Date</th>
                          <th style={{ width: '80px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === 'visitor').filter(u => {
                          const searchLower = searchTerm.toLowerCase();
                          return (u.name || '').toLowerCase().includes(searchLower) || (u.email || '').toLowerCase().includes(searchLower);
                        }).map((v, i) => (
                          <tr key={i}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div 
                                  className="av" 
                                  style={{ 
                                    background: '#00c9a7', 
                                    width: '28px', 
                                    height: '28px', 
                                    fontSize: '10px',
                                    backgroundImage: v.profilePhoto ? `url(${v.profilePhoto})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }}
                                >
                                  {!v.profilePhoto && v.name?.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{v.name}</div>
                                  <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{v.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{v.phone}</td>
                            <td>{v.organization || 'Guest'}</td>
                            <td>
                              <span className={`pill ${v.isVerified ? 'pg' : 'pr'}`}>
                                {v.isVerified ? 'Verified' : 'Pending OTP'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td>
                              <button 
                                onClick={() => handleDeleteUser(v._id)}
                                className="bsm bout"
                                style={{ color: '#f43f5e', borderColor: '#fca5a5', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {users.filter(u => u.role === 'visitor').length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No visitors registered in the database.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: Traffic Analytics */}
              {activeTab === 'analytics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Timeframe selector header */}
                  <div className="secc" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={16} style={{ color: '#7c3aed' }} /> System Traffic Analytics
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Real-time gate pass check-ins and check-outs metrics</p>
                    </div>
                    
                    <div style={{ display: 'flex', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)', gap: '4px' }}>
                      {['all', 'today', '7days', '30days'].map((tf) => (
                        <button 
                          key={tf}
                          onClick={() => setAnalyticsTimeframe(tf)}
                          style={{
                            padding: '5px 12px',
                            fontSize: '11px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            background: analyticsTimeframe === tf ? 'var(--card)' : 'transparent',
                            color: analyticsTimeframe === tf ? '#7c3aed' : 'var(--muted)',
                            boxShadow: analyticsTimeframe === tf ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          {tf === 'all' && 'All Time'}
                          {tf === 'today' && 'Today'}
                          {tf === '7days' && '7 Days'}
                          {tf === '30days' && '30 Days'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Analytic Stats KPI */}
                  {(() => {
                    const filteredLogsForAnalytics = logs.filter(log => {
                      const logDate = new Date(log.checkInTime);
                      const now = new Date();
                      if (analyticsTimeframe === 'today') {
                        return logDate.toDateString() === now.toDateString();
                      } else if (analyticsTimeframe === '7days') {
                        const diffTime = Math.abs(now - logDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 7;
                      } else if (analyticsTimeframe === '30days') {
                        const diffTime = Math.abs(now - logDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 30;
                      }
                      return true; // all
                    });

                    let morningCount = 0;
                    let afternoonCount = 0;
                    let eveningCount = 0;

                    filteredLogsForAnalytics.forEach(log => {
                      const hour = new Date(log.checkInTime).getHours();
                      if (hour >= 6 && hour < 12) {
                        morningCount++;
                      } else if (hour >= 12 && hour < 17) {
                        afternoonCount++;
                      } else {
                        eveningCount++;
                      }
                    });

                    const totalAnalyticsLogs = filteredLogsForAnalytics.length;
                    const maxPeakCount = Math.max(morningCount, afternoonCount, eveningCount, 1);
                    const checkedOutCount = filteredLogsForAnalytics.filter(log => log.status === 'completed' || log.checkOutTime).length;
                    const successRate = totalAnalyticsLogs > 0 ? Math.round((checkedOutCount / totalAnalyticsLogs) * 100) : 100;

                    return (
                      <>
                        <div className="sg" style={{ marginBottom: 0 }}>
                          <div className="sc">
                            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 600 }}>Total Entries Captured</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 2px', color: '#7c3aed' }}>{totalAnalyticsLogs}</div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Gate scans in selected period</div>
                          </div>
                          <div className="sc">
                            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 600 }}>Morning (06:00 - 12:00)</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 2px', color: '#0ea5e9' }}>{morningCount}</div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{Math.round((morningCount / (totalAnalyticsLogs || 1)) * 100)}% of total entries</div>
                          </div>
                          <div className="sc">
                            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 600 }}>Afternoon (12:00 - 17:00)</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 2px', color: '#00c9a7' }}>{afternoonCount}</div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{Math.round((afternoonCount / (totalAnalyticsLogs || 1)) * 100)}% of total entries</div>
                          </div>
                          <div className="sc">
                            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 600 }}>Checkout Completion Rate</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 2px', color: '#16a34a' }}>{successRate}%</div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Exited / Total check-ins</div>
                          </div>
                        </div>

                        <div className="two">
                          <div className="secc" style={{ padding: '20px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Clock size={14} style={{ color: '#7c3aed' }} /> Entry Time Peak Distribution
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                  <span>Morning (06:00 AM - 12:00 PM)</span>
                                  <span style={{ fontWeight: 600 }}>{morningCount} entries ({Math.round((morningCount / (totalAnalyticsLogs || 1)) * 100)}%)</span>
                                </div>
                                <div style={{ background: 'var(--surface)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.round((morningCount / maxPeakCount) * 100)}%`, background: '#0ea5e9', height: '100%', borderRadius: '4px', transition: 'width 0.5s' }}></div>
                                </div>
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                  <span>Afternoon (12:00 PM - 05:00 PM)</span>
                                  <span style={{ fontWeight: 600 }}>{afternoonCount} entries ({Math.round((afternoonCount / (totalAnalyticsLogs || 1)) * 100)}%)</span>
                                </div>
                                <div style={{ background: 'var(--surface)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.round((afternoonCount / maxPeakCount) * 100)}%`, background: '#00c9a7', height: '100%', borderRadius: '4px', transition: 'width 0.5s' }}></div>
                                </div>
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                  <span>Evening & Night (05:00 PM - 06:00 AM)</span>
                                  <span style={{ fontWeight: 600 }}>{eveningCount} entries ({Math.round((eveningCount / (totalAnalyticsLogs || 1)) * 100)}%)</span>
                                </div>
                                <div style={{ background: 'var(--surface)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.round((eveningCount / maxPeakCount) * 100)}%`, background: '#f59e0b', height: '100%', borderRadius: '4px', transition: 'width 0.5s' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="secc" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '14px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <CheckCircle size={14} style={{ color: '#16a34a' }} /> Gate Operations Health
                            </div>
                            
                            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
                              <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '8px solid var(--surface)' }}></div>
                              <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '8px solid transparent', borderTopColor: '#16a34a', borderRightColor: successRate > 25 ? '#16a34a' : 'transparent', borderBottomColor: successRate > 50 ? '#16a34a' : 'transparent', borderLeftColor: successRate > 75 ? '#16a34a' : 'transparent', transform: 'rotate(-45deg)', transition: 'border-color 0.5s' }}></div>
                              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>{successRate}%</span>
                            </div>
                            
                            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', marginTop: '10px' }}>
                              <strong>{checkedOutCount} out of {totalAnalyticsLogs}</strong> visitors have checked out. Low exit counts trigger overnight gate system audits.
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB 7: System Settings */}
              {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* General Configuration Card */}
                  <div className="secc" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Settings size={18} style={{ color: '#7c3aed' }} /> General System Configuration
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>Require Host Pre-Approval</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Visitors must wait for employee host approval before QR pass generation.</div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={requirePreApproval} 
                          onChange={(e) => {
                            setRequirePreApproval(e.target.checked);
                            showToast(`Host approval requirement ${e.target.checked ? 'enabled' : 'disabled'}`);
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>Auto-Verify Organization Domains</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Skip OTP verification for corporate employees using registered whitelist domains.</div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={autoVerifyDomains} 
                          onChange={(e) => {
                            setAutoVerifyDomains(e.target.checked);
                            showToast(`Auto-verify domains ${e.target.checked ? 'enabled' : 'disabled'}`);
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>Auto-Generate PDF Passes</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Instantly compile PDF pass badges on server and attach to email alerts.</div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={autoGeneratePDF} 
                          onChange={(e) => {
                            setAutoGeneratePDF(e.target.checked);
                            showToast(`PDF pass generation ${e.target.checked ? 'enabled' : 'disabled'}`);
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Danger Zone Card */}
                  <div className="secc" style={{ padding: '20px', border: '1.5px solid #fee2e2', background: '#fff8f8' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#991b1b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldAlert size={18} style={{ color: '#ef4444' }} /> Danger Zone - Reset Database
                    </div>
                    <p style={{ fontSize: '12px', color: '#7f1d1d', lineHeight: '1.5', marginBottom: '16px' }}>
                      Resetting the database will delete **all appointments, pass badges, visitor records, and scan history**. Only the 4 pre-configured system accounts (Admin, Security, Priya, and your Visitor account) will be preserved. This action is permanent and cannot be undone.
                    </p>
                    
                    <button 
                      type="button" 
                      onClick={async () => {
                        const confirm1 = window.confirm('Are you absolutely sure you want to RESET the database? This will wipe out all visitor data, appointments, passes, and check logs.');
                        if (!confirm1) return;
                        
                        const confirm2 = window.confirm('WARNING: This action is completely irreversible. Please confirm once more that you want to delete everything and start fresh.');
                        if (!confirm2) return;

                        setLoading(true);
                        try {
                          const res = await axios.post('/admin/reset-database');
                          if (res.data.success) {
                            showToast('Database reset successfully! Kept only the 4 core accounts.');
                            window.location.reload();
                          }
                        } catch (err) {
                          showToast(err.response?.data?.message || 'Failed to reset database', 'error');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="bsm" 
                      style={{ 
                        background: '#dc2626', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '10px 16px', 
                        borderRadius: '8px', 
                        fontWeight: 600, 
                        fontSize: '12px', 
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ShieldAlert size={14} /> Clear System Data (Reset Database)
                    </button>
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

export default AdminDashboard;
