import React from 'react';
import { Bell, LogIn, LogOut, Clock, Mail, CheckCircle } from 'lucide-react';

const NotificationsDropdown = ({ isOpen, onClose, logs = [] }) => {
  if (!isOpen) return null;

  // Derive notifications from recent checkin/checkout logs
  const notificationsList = logs.slice(0, 5).map((log, index) => {
    const isCheckin = log.status === 'inside';
    const hasCheckedOut = log.checkOutTime !== undefined && log.checkOutTime !== null;
    
    let text = '';
    let icon = null;
    let timeStr = '';
    
    if (isCheckin) {
      text = `${log.visitor?.name || 'Visitor'} arrived & checked in`;
      icon = <LogIn size={12} style={{ color: '#15803d' }} />;
      timeStr = new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hasCheckedOut || log.status === 'completed') {
      text = `${log.visitor?.name || 'Visitor'} checked out & departed`;
      icon = <LogOut size={12} style={{ color: '#dc2626' }} />;
      timeStr = new Date(log.checkOutTime || log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      text = `${log.visitor?.name || 'Visitor'} pass verified`;
      icon = <CheckCircle size={12} style={{ color: '#7c3aed' }} />;
      timeStr = new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return {
      id: index,
      text,
      icon,
      time: timeStr,
      date: new Date(log.checkInTime).toLocaleDateString()
    };
  });

  // Fallback notifications if DB logs are empty
  const displayNotifications = notificationsList.length > 0 ? notificationsList : [
    {
      id: 'mock-1',
      text: 'Super Admin Suresh logged in',
      icon: <CheckCircle size={12} style={{ color: '#7c3aed' }} />,
      time: 'Just Now',
      date: 'Today'
    },
    {
      id: 'mock-2',
      text: 'Pass verification email system active',
      icon: <Mail size={12} style={{ color: '#0ea5e9' }} />,
      time: '1 hour ago',
      date: 'Today'
    },
    {
      id: 'mock-3',
      text: 'Gate check-in alert logs enabled',
      icon: <Clock size={12} style={{ color: '#d97706' }} />,
      time: 'Yesterday',
      date: 'Yesterday'
    }
  ];

  return (
    <>
      {/* Invisible backdrop to close dropdown on outer click */}
      <div 
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 90 }} 
        onClick={onClose} 
      />
      
      {/* Floating glass dropdown block */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '48px', 
          right: '20px', 
          background: 'var(--card)', 
          border: '1px solid var(--border)', 
          borderRadius: '12px', 
          width: '320px', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', 
          zIndex: 99, 
          overflow: 'hidden' 
        }}
      >
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Bell size={13} style={{ color: '#00c9a7' }} /> Recent Alerts
          </span>
          <span style={{ fontSize: '9px', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>Active</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '280px', overflowY: 'auto' }}>
          {displayNotifications.map((noti) => (
            <div 
              key={noti.id} 
              style={{ 
                padding: '10px 14px', 
                borderBottom: '1px solid var(--border)', 
                display: 'flex', 
                gap: '8px', 
                alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0 }}>
                {noti.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text)', lineHeight: '1.3', fontWeight: 500 }}>{noti.text}</span>
                <span style={{ fontSize: '9px', color: 'var(--muted)' }}>{noti.time} · {noti.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NotificationsDropdown;
