import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, UserCheck, Crown, Scan, Users, Contact, Calendar, 
  BarChart2, FileSpreadsheet, Building, Settings, LogOut, Printer, 
  AlertTriangle, Clock, History, FileText, Bell, UserPlus, HelpCircle,
  FileCheck, ArrowLeft, ArrowRight
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onProfileClick, onNotificationsClick }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Get initials for user avatar
  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
  };

  // Define role characteristics (color, label, icon)
  const roleMeta = {
    admin: { color: '#7c3aed', label: 'Super Admin', bg: 'rgba(124, 58, 237, 0.15)' },
    security: { color: '#f43f5e', label: 'Security Officer', bg: 'rgba(244, 63, 94, 0.15)' },
    employee: { color: '#0ea5e9', label: 'Host Employee', bg: 'rgba(14, 165, 233, 0.15)' },
    visitor: { color: '#00c9a7', label: 'Visitor Portal', bg: 'rgba(0, 201, 167, 0.15)' }
  };

  const currentMeta = roleMeta[user.role] || roleMeta.visitor;

  // Render navigation links based on user role
  const renderNavLinks = () => {
    switch (user.role) {
      case 'admin':
        return (
          <>
            <div className="sb-sec">Main</div>
            <div className={`sbl ${activeTab === 'dashboard' ? 'on' : ''}`} style={activeTab === 'dashboard' ? { background: '#f5f3ff', fontWeight: 600, color: '#7c3aed' } : {}} onClick={() => setActiveTab('dashboard')}>
              <Crown style={{ color: activeTab === 'dashboard' ? '#7c3aed' : 'inherit' }} />
              <span>Dashboard</span>
            </div>
            <div className={`sbl ${activeTab === 'users' ? 'on' : ''}`} onClick={() => setActiveTab('users')}>
              <Users />
              <span>User management</span>
            </div>
            <div className={`sbl ${activeTab === 'visitors' ? 'on' : ''}`} onClick={() => setActiveTab('visitors')}>
              <Contact />
              <span>All visitors</span>
              <span className="bdg" style={{ background: '#ede9fe', color: '#6d28d9' }}>Live</span>
            </div>
            <div className={`sbl ${activeTab === 'appointments' ? 'on' : ''}`} onClick={() => setActiveTab('appointments')}>
              <Calendar />
              <span>Appointments</span>
            </div>
            
            <div className="sb-sec">Reports</div>
            <div className={`sbl ${activeTab === 'analytics' ? 'on' : ''}`} onClick={() => setActiveTab('analytics')}>
              <BarChart2 />
              <span>Analytics</span>
            </div>
            <div className={`sbl ${activeTab === 'logs' ? 'on' : ''}`} onClick={() => setActiveTab('logs')}>
              <FileSpreadsheet />
              <span>Export logs</span>
            </div>
            
          </>
        );

      case 'security':
        return (
          <>
            <div className="sb-sec">Operations</div>
            <div className={`sbl ${activeTab === 'scanner' ? 'on' : ''}`} style={activeTab === 'scanner' ? { background: '#fff1f2', fontWeight: 600, color: '#f43f5e' } : {}} onClick={() => setActiveTab('scanner')}>
              <Scan style={{ color: activeTab === 'scanner' ? '#f43f5e' : 'inherit' }} />
              <span>QR scanner</span>
            </div>
            <div className={`sbl ${activeTab === 'issue' ? 'on' : ''}`} onClick={() => setActiveTab('issue')}>
              <Contact />
              <span>Issue pass</span>
            </div>
            <div className={`sbl ${activeTab === 'active' ? 'on' : ''}`} onClick={() => setActiveTab('active')}>
              <Users />
              <span>Active visitors</span>
            </div>
            <div className={`sbl ${activeTab === 'logs' ? 'on' : ''}`} onClick={() => setActiveTab('logs')}>
              <FileCheck />
              <span>Scan log</span>
            </div>

            <div className="sb-sec">Tools</div>
            <div className={`sbl ${activeTab === 'printer' ? 'on' : ''}`} onClick={() => setActiveTab('printer')}>
              <Printer />
              <span>Print badge</span>
            </div>
            <div className={`sbl ${activeTab === 'alerts' ? 'on' : ''}`} onClick={() => setActiveTab('alerts')}>
              <AlertTriangle />
              <span>Alerts</span>
              <span className="bdg" style={{ background: '#fee2e2', color: '#991b1b' }}>2</span>
            </div>
          </>
        );

      case 'employee':
        return (
          <>
            <div className="sb-sec">My visitors</div>
            <div className={`sbl ${activeTab === 'overview' ? 'on' : ''}`} style={activeTab === 'overview' ? { background: '#f0f9ff', fontWeight: 600, color: '#0ea5e9' } : {}} onClick={() => setActiveTab('overview')}>
              <BarChart2 style={{ color: activeTab === 'overview' ? '#0ea5e9' : 'inherit' }} />
              <span>Overview</span>
            </div>
            <div className={`sbl ${activeTab === 'invite' ? 'on' : ''}`} onClick={() => setActiveTab('invite')}>
              <UserPlus />
              <span>Invite visitor</span>
            </div>
            <div className={`sbl ${activeTab === 'pending' ? 'on' : ''}`} onClick={() => setActiveTab('pending')}>
              <Clock />
              <span>Pending approvals</span>
            </div>

            <div className="sb-sec">History</div>
            <div className={`sbl ${activeTab === 'history' ? 'on' : ''}`} onClick={() => setActiveTab('history')}>
              <History />
              <span>Past visitors</span>
            </div>
            <div className={`sbl ${activeTab === 'reports' ? 'on' : ''}`} onClick={() => setActiveTab('reports')}>
              <FileText />
              <span>My reports</span>
            </div>

            <div className={`sbl ${activeTab === 'notifications' ? 'on' : ''}`} onClick={() => setActiveTab('notifications')}>
              <Bell />
              <span>Notifications</span>
            </div>
          </>
        );

      case 'visitor':
      default:
        return (
          <>
            <div className="sb-sec">My pass</div>
            <div className={`sbl ${activeTab === 'pass' ? 'on' : ''}`} style={activeTab === 'pass' ? { background: '#f0fdf9', fontWeight: 600, color: '#00c9a7' } : {}} onClick={() => setActiveTab('pass')}>
              <Contact style={{ color: activeTab === 'pass' ? '#00c9a7' : 'inherit' }} />
              <span>Digital pass</span>
            </div>
            <div className={`sbl ${activeTab === 'register-visit' ? 'on' : ''}`} onClick={() => setActiveTab('register-visit')}>
              <UserPlus />
              <span>Pre-register</span>
            </div>
            <div className={`sbl ${activeTab === 'appointments' ? 'on' : ''}`} onClick={() => setActiveTab('appointments')}>
              <Calendar />
              <span>My appointment</span>
            </div>

            <div className="sb-sec">History</div>
            <div className={`sbl ${activeTab === 'history' ? 'on' : ''}`} onClick={() => setActiveTab('history')}>
              <History />
              <span>Visit history</span>
            </div>

            <div className="sb-sec">Help</div>
            <div className={`sbl ${activeTab === 'help' ? 'on' : ''}`} onClick={() => setActiveTab('help')}>
              <HelpCircle />
              <span>FAQ / Help</span>
            </div>
          </>
        );
    }
  };

  // Render navigation buttons for mobile bottom bar
  const renderMobileNavLinks = () => {
    const navItem = (tab, icon, label) => {
      const isActive = activeTab === tab;
      return (
        <button 
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`mn-item ${isActive ? 'active' : ''}`}
          style={isActive ? { color: currentMeta.color } : {}}
        >
          {icon}
          <span className="mn-label">{label}</span>
        </button>
      );
    };

    const links = [];

    // 1. Back Navigation Arrow
    links.push(
      <button 
        key="back-nav"
        onClick={() => window.history.back()}
        className="mn-item"
        style={{ color: 'var(--muted)' }}
        title="Back"
      >
        <ArrowLeft size={18} />
        <span className="mn-label">Back</span>
      </button>
    );

    // 2. Next/Forward Navigation Arrow
    links.push(
      <button 
        key="forward-nav"
        onClick={() => window.history.forward()}
        className="mn-item"
        style={{ color: 'var(--muted)' }}
        title="Forward"
      >
        <ArrowRight size={18} />
        <span className="mn-label">Next</span>
      </button>
    );

    // 3. Primary Dashboard Home Button
    switch (user.role) {
      case 'admin':
        links.push(navItem('dashboard', <Crown size={18} />, 'Home'));
        links.push(navItem('analytics', <BarChart2 size={18} />, 'Stats'));
        break;
      case 'security':
        links.push(navItem('scanner', <Scan size={18} />, 'Scanner'));
        links.push(navItem('active', <Users size={18} />, 'Active'));
        break;
      case 'employee':
        links.push(navItem('overview', <BarChart2 size={18} />, 'Home'));
        links.push(navItem('invite', <UserPlus size={18} />, 'Invite'));
        break;
      case 'visitor':
      default:
        links.push(navItem('pass', <Contact size={18} />, 'Pass'));
        links.push(navItem('register-visit', <UserPlus size={18} />, 'Register'));
        break;
    }

    // 4. Alerts/Notifications Bell
    if (['admin', 'security', 'employee'].includes(user.role)) {
      links.push(
        <button 
          key="notifications-nav"
          onClick={onNotificationsClick}
          className="mn-item"
          style={{ color: 'var(--muted)', position: 'relative' }}
          title="Notifications"
        >
          <Bell size={18} />
          <span className="mn-label">Alerts</span>
          <div className="ndot" style={{ top: '2px', right: '14px', width: '6px', height: '6px' }}></div>
        </button>
      );
    }

    // 5. User Profile Avatar Trigger
    links.push(
      <button 
        key="profile-nav"
        onClick={onProfileClick}
        className="mn-item"
        style={{ color: 'var(--muted)' }}
        title="My Profile"
      >
        <div 
          className="av" 
          style={{ 
            width: '18px', 
            height: '18px', 
            fontSize: '8px', 
            background: currentMeta.color,
            backgroundImage: user.profilePhoto ? `url(${user.profilePhoto})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(0,0,0,0.15)'
          }}
        >
          {!user.profilePhoto && user.name?.slice(0, 2).toUpperCase()}
        </div>
        <span className="mn-label">Profile</span>
      </button>
    );

    return links;
  };

  return (
    <>
      <div className="sb">
        {/* Brand Header */}
        <div className="sb-brand">
          <div className="sb-bicon" style={{ background: currentMeta.color }}>
            <ShieldCheck size={18} />
          </div>
          <div className="sb-btext">
            VisitorPass
            <div className="sb-bsub">{currentMeta.label}</div>
          </div>
        </div>

        {/* User Session Info */}
        <div className="sb-user">
          <div 
            className="av" 
            style={{ 
              background: currentMeta.color, 
              width: '32px', 
              height: '32px', 
              fontSize: '11px',
              backgroundImage: user.profilePhoto ? `url(${user.profilePhoto})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!user.profilePhoto && getInitials(user.name)}
          </div>
          <div className="user-info" style={{ minWidth: 0, flex: 1 }}>
            <div className="uname" title={user.name}>{user.name}</div>
            <div className="urole" style={{ color: currentMeta.color }}>
              {user.role.toUpperCase()} {user.department && `· ${user.department}`}
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="sb-nav" style={{ overflowY: 'auto' }}>
          {renderNavLinks()}
          
          {/* Universal Logout */}
          <div className="sbl" onClick={logout} style={{ marginTop: '15px', color: '#f43f5e' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        {renderMobileNavLinks()}
      </div>
    </>
  );
};

export default Sidebar;
