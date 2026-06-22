import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import ProfileModal from '../components/ProfileModal';
import NotificationsDropdown from '../components/NotificationsDropdown';
import { 
  Scan, LogIn, LogOut, Clock, AlertTriangle, Hash, Check, 
  Search, Bell, Settings, RefreshCw, Printer, AlertOctagon,
  Sun, Moon, Monitor
} from 'lucide-react';

const SecurityDashboard = () => {
  const [activeTab, setActiveTab] = useState('scanner');
  const [insideCount, setInsideCount] = useState(0);
  const [inCount, setInCount] = useState(0);
  const [outCount, setOutCount] = useState(0);
  const [manualCode, setManualCode] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [insideVisitors, setInsideVisitors] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Advanced Dashboard States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const { user, showToast, logout } = useAuth();
  const scannerRef = useRef(null);

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

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/logs');
      if (res.data.success) {
        const logs = res.data.logs;
        setLogs(logs);
        
        // Count inside today
        const inside = logs.filter(l => l.status === 'inside');
        setInsideVisitors(inside);
        setInsideCount(inside.length);
        
        const completed = logs.filter(l => l.status === 'completed');
        setOutCount(completed.length);
        setInCount(inside.length + completed.length);

        // Map recent logs to scan history timeline format
        const scans = logs.slice(0, 5).map(log => ({
          name: log.visitor?.name || 'Unknown visitor',
          action: log.status === 'inside' ? 'checkin' : 'checkout',
          time: new Date(log.checkOutTime || log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(log.checkInTime).toLocaleDateString(),
          code: log.pass?.passCode || '#N/A'
        }));
        setRecentScans(scans);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading guard console log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      setScanResult(null);
      
      // Allow DOM to update and mount the container
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode("qr-reader-container");
          html5QrCodeRef.current = html5QrCode;
          
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 150, height: 150 }
            },
            async (decodedText) => {
              // Successfully decoded QR code! Stop camera and verify
              if (html5QrCodeRef.current) {
                try {
                  await html5QrCodeRef.current.stop();
                } catch (e) {
                  console.error(e);
                }
                html5QrCodeRef.current = null;
              }
              setIsScanning(false);
              await handleScanVerify({ qrCodePayload: decodedText });
            },
            (error) => {
              // Parsing errors, can be ignored as scanning loops continuously
            }
          );
        } catch (err) {
          console.error("Scanner startup failed:", err);
          showToast("Camera access denied or error starting camera", "error");
          setIsScanning(false);
        }
      }, 200);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Scanner stop failed:", err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  // Clean up scanner on unmount or tab switch
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(err => console.log(err));
      }
    };
  }, [activeTab]);

  const handleScanVerify = async (body) => {
    try {
      setScanResult(null);
      const res = await axios.post('/passes/verify', body);
      if (res.data.success) {
        setScanResult(res.data);
        showToast(res.data.message);
        fetchSecurityData(); // reload stats
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired QR code';
      showToast(msg, 'error');
      setScanResult({
        error: true,
        message: msg
      });
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode) return;
    handleScanVerify({ passCode: manualCode });
    setManualCode('');
  };

  const handleQuickCheckout = (passCode) => {
    handleScanVerify({ passCode });
  };

  return (
    <div className="dw">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onProfileClick={() => setShowProfileModal(true)} 
        onNotificationsClick={() => setShowNotiDropdown(!showNotiDropdown)} 
      />
      
      <div className="mc">
        {/* Header toolbar */}
        <div className="tb">
          <div className="tbl">
            <div className="ptitle">Security Gate Console</div>
            <div className="sbox">
              <Search size={14} />
              <input placeholder="Search by name or pass ID..." />
            </div>
          </div>
          <div className="tbr" style={{ position: 'relative' }}>
            <div className="ibtn" onClick={fetchSecurityData} title="Refresh Statistics"><RefreshCw size={15} /></div>
            <div className="ibtn" style={{ color: '#f43f5e' }}><AlertTriangle size={15} /><div className="ndot"></div></div>
            <div className="ibtn" onClick={() => setShowNotiDropdown(!showNotiDropdown)} style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={15} />
              <div className="ndot"></div>
            </div>
            <div 
              className="av" 
              onClick={() => setShowProfileModal(true)}
              style={{ 
                background: '#f43f5e', 
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

        {/* Console layout body */}
        <div className="ca">
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <div className="loading-spinner" />
            </div>
          ) : (
            <>
              {/* Core metrics counters */}
              <div className="sg">
                <div className="sc">
                  <div className="si" style={{ background: '#dcfce7', color: '#15803d' }}><LogIn /></div>
                  <div className="sv" style={{ color: '#15803d' }}>{inCount}</div>
                  <div className="sl">Total Entries</div>
                </div>
                <div className="sc">
                  <div className="si" style={{ background: '#fee2e2', color: '#991b1b' }}><LogOut /></div>
                  <div className="sv" style={{ color: '#dc2626' }}>{outCount}</div>
                  <div className="sl">Total Exits</div>
                </div>
                <div className="sc">
                  <div className="si" style={{ background: '#fef3c7', color: '#92400e' }}><Clock /></div>
                  <div className="sv" style={{ color: '#d97706' }}>{insideCount}</div>
                  <div className="sl">Still Inside</div>
                </div>
                <div className="sc">
                  <div className="si" style={{ background: '#fee2e2', color: '#991b1b' }}><AlertTriangle /></div>
                  <div className="sv" style={{ color: '#dc2626' }}>2</div>
                  <div className="sl">Gate Alerts</div>
                </div>
              </div>

              {/* TAB: QR Camera Scanner */}
              {activeTab === 'scanner' && (
                <>
                  <div className="two">
                    
                    {/* Live Scanner column */}
                    <div className="secc">
                      <div className="sech">
                        <span className="sect"><Scan style={{ color: '#f43f5e' }} />QR scan gate</span>
                        <span className={`pill ${isScanning ? 'pg' : 'pr'}`} style={{ fontSize: '10px' }}>
                          {isScanning ? '🟢 Camera Active' : '🔴 Camera Offline'}
                        </span>
                      </div>
                      
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                        
                        {/* QR scan camera frame */}
                        <div className="qr-frame" style={{ width: '180px', height: '180px', background: '#0a1628', border: '2.5px solid #f43f5e', position: 'relative', overflow: 'hidden' }}>
                          <div className="qc tl" style={{ borderColor: '#f43f5e' }}></div>
                          <div className="qc tr" style={{ borderColor: '#f43f5e' }}></div>
                          <div className="qc bl" style={{ borderColor: '#f43f5e' }}></div>
                          <div className="qc br" style={{ borderColor: '#f43f5e' }}></div>
                          {isScanning && <div className="qsl" style={{ background: 'linear-gradient(90deg, transparent, #f43f5e, transparent)' }}></div>}
                          
                          {isScanning ? (
                            <div id="qr-reader-container" style={{ width: '100%', height: '100%', border: 'none' }}></div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.4)', padding: '20px', textAlign: 'center' }}>
                              <Scan size={36} style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.15)' }} />
                              <span style={{ fontSize: '10px' }}>Camera is offline</span>
                            </div>
                          )}
                        </div>

                        {/* Highly Highlighted Scanner Activation Button */}
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                          {isScanning ? (
                            <button 
                              type="button" 
                              onClick={stopScanner} 
                              className="btn-login" 
                              style={{ background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '10px 18px', borderRadius: '8px', maxWidth: '240px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)', border: 'none' }}
                            >
                              <LogOut size={14} />
                              <span>Stop Camera Scanner</span>
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              onClick={startScanner} 
                              className="btn-login scanner-pulse-btn" 
                              style={{ background: '#f43f5e', color: '#fff', fontSize: '14px', fontWeight: 700, padding: '12px 24px', borderRadius: '8px', maxWidth: '260px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', transition: 'all 0.2s' }}
                            >
                              <Scan size={16} />
                              <span>START CAMERA SCANNER</span>
                            </button>
                          )}
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', margin: '4px 0 0' }}>
                          {isScanning ? "Point camera at visitor's QR pass to scan" : "Click the button above to start verification scanner"}
                        </p>

                        {/* Manual entry fallback */}
                        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '7px', width: '100%', marginTop: '4px' }}>
                          <div className="sbox" style={{ flex: 1, maxWidth: '100%' }}>
                            <Hash size={14} />
                            <input 
                              placeholder="Or enter pass ID manually (e.g. VP-2451)" 
                              value={manualCode}
                              onChange={(e) => setManualCode(e.target.value)}
                            />
                          </div>
                          <button type="submit" className="bsm bpri" style={{ padding: '7px 12px' }}>
                            <Check size={11} /> Verify
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Timeline logs column */}
                    <div className="secc">
                      <div className="sech">
                        <span className="sect">Recent scan events</span>
                        <button onClick={fetchSecurityData} className="bsm bout"><RefreshCw size={11} /></button>
                      </div>
                      
                      <div className="tl">
                        {recentScans.map((scan, i) => (
                          <div className="tli" key={i}>
                            <div 
                              className="tld" 
                              style={{ 
                                background: scan.action === 'checkin' ? '#dcfce7' : '#fee2e2', 
                                color: scan.action === 'checkin' ? '#15803d' : '#dc2626' 
                              }}
                            >
                              {scan.action === 'checkin' ? <LogIn size={11} /> : <LogOut size={11} />}
                            </div>
                            <div className="tlb">
                              <div className="tlt">
                                {scan.name} — <span style={{ color: scan.action === 'checkin' ? '#15803d' : '#dc2626' }}>
                                  {scan.action === 'checkin' ? 'Check in' : 'Check out'}
                                </span>
                              </div>
                              <div className="tlti">{scan.time} · Pass Code: {scan.code}</div>
                            </div>
                          </div>
                        ))}
                        {recentScans.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '12px' }}>
                            No scans processed today
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Scan Result Overlay Modal (if scanned successfully) */}
                  {scanResult && (
                    <div style={{ margin: '14px 0', background: scanResult.error ? '#fef2f2' : '#f0fdf4', border: '1.5px solid', borderColor: scanResult.error ? '#fca5a5' : '#86efac', borderRadius: '12px', padding: '16px' }}>
                      {scanResult.error ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <AlertOctagon style={{ color: '#dc2626' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#991b1b', fontSize: '13px' }}>Scan Failed</div>
                            <div style={{ fontSize: '12px', color: '#b91c1c' }}>{scanResult.message}</div>
                          </div>
                          <button onClick={() => setScanResult(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: '#991b1b', fontSize: '11px', fontWeight: 600 }}>Close</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <div 
                            className="av" 
                            style={{ 
                              width: '48px', 
                              height: '48px', 
                              background: '#00c9a7',
                              backgroundImage: scanResult.visitor.profilePhoto ? `url(${scanResult.visitor.profilePhoto})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            {!scanResult.visitor.profilePhoto && scanResult.visitor.name.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#14532d', fontSize: '15px' }}>
                              {scanResult.action === 'checkin' ? 'Check-In Approved' : 'Check-Out Approved'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#166534', fontWeight: 500 }}>
                              {scanResult.visitor.name} · {scanResult.visitor.organization}
                            </div>
                            <div style={{ fontSize: '11px', color: '#15803d' }}>
                              Host: {scanResult.host.name} ({scanResult.host.department} dept) · Pass: {scanResult.passCode}
                            </div>
                          </div>
                            <button onClick={() => {
                              const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                                ? 'http://localhost:5000'
                                : 'https://visitor-app-69ei.onrender.com';
                              window.open(`${backendUrl}/api/passes/${scanResult.passCode}/pdf?token=${localStorage.getItem('vpms_token')}`);
                            }} className="bsm bpri" style={{ fontSize: '11px', padding: '6px 12px' }}>
                              <Printer size={12} /> Print Badge
                            </button>
                            <button onClick={() => setScanResult(null)} className="bsm bout" style={{ fontSize: '11px', padding: '6px 12px' }}>Dismiss</button>
                          </div>
                        )
                      }
                    </div>
                  )}

                  {/* Inside Visitors Table */}
                  <div className="secc">
                    <div className="sech">
                      <span className="sect">Currently inside building ({insideVisitors.length})</span>
                      <button onClick={fetchSecurityData} className="bsm bout"><RefreshCw size={11} /> Refresh list</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '25%' }}>Visitor</th>
                            <th style={{ width: '15%' }}>Pass ID</th>
                            <th style={{ width: '20%' }}>Host / Department</th>
                            <th style={{ width: '15%' }}>Check-In Time</th>
                            <th style={{ width: '13%' }}>Duration</th>
                            <th style={{ width: '12%' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insideVisitors.map((v, i) => {
                            const entryTime = new Date(v.checkInTime);
                            const durationMs = new Date() - entryTime;
                            const hours = Math.floor(durationMs / 3600000);
                            const mins = Math.floor((durationMs % 3600000) / 60000);
                            
                            return (
                              <tr key={i}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div 
                                      className="av" 
                                      style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        background: '#0ea5e9', 
                                        fontSize: '9px',
                                        backgroundImage: v.visitor?.profilePhoto ? `url(${v.visitor.profilePhoto})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                      }}
                                    >
                                      {!v.visitor?.profilePhoto && v.visitor?.name?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span>{v.visitor?.name}</span>
                                  </div>
                                </td>
                                <td style={{ fontFamily: 'monospace', color: '#7c3aed', fontSize: '11px' }}>
                                  {v.pass?.passCode}
                                </td>
                                <td>{v.pass?.appointment?.host?.name || 'Desk Guard'} ({v.pass?.appointment?.host?.department || 'Main'})</td>
                                <td>{entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td>
                                  <span className="pill pg">{hours > 0 ? `${hours}h ` : ''}{mins}m</span>
                                </td>
                                <td>
                                  <button 
                                    onClick={() => handleQuickCheckout(v.pass?.passCode)} 
                                    className="bsm bout" 
                                    style={{ padding: '4px 7px', fontSize: '10px' }}
                                  >
                                    <LogOut size={10} /> Out
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {insideVisitors.length === 0 && (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                                No visitors currently logged inside
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Other panels showing placeholder layout */}
              {activeTab !== 'scanner' && (
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                  <Scan size={32} style={{ color: 'var(--slate2)', marginBottom: '12px' }} />
                  <h3>Console operations active</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>Click the "QR scanner" link in the sidebar to return to verification console.</p>
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

export default SecurityDashboard;
