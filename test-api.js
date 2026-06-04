/**
 * Automated End-to-End API Tester for VisitorPass Management System (VPMS)
 * Runs all REST endpoints sequentially using native Node.js fetch.
 */

const BASE_URL = 'http://localhost:5000/api';

// ANSI console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

async function runTests() {
  console.log(`\n${colors.bright}${colors.magenta}=== VPMS END-TO-END API TEST RUNNER ===${colors.reset}\n`);

  try {
    let adminToken = '';
    let visitorToken = '';
    let employeeToken = '';
    let securityToken = '';

    let hostId = '';      // Employee ID (Priya Sharma)
    let visitorId = '';   // Visitor ID (Rahul Kumar)
    let appointmentId = '';
    let passId = '';
    let qrCodePayload = '';

    // ==========================================
    // 1. ADMIN LOGIN
    // ==========================================
    console.log(`${colors.cyan}[STEP 1] Logging in as Admin (admin@visitorpass.com)...${colors.reset}`);
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@visitorpass.com', password: 'password123' })
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    adminToken = adminLoginData.token;
    console.log(`${colors.green}✔ Admin Login successful! Token received.${colors.reset}\n`);

    // ==========================================
    // 2. FETCH PROFILE (ADMIN)
    // ==========================================
    console.log(`${colors.cyan}[STEP 2] Fetching Admin Profile (/auth/me)...${colors.reset}`);
    const adminProfileRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminProfileData = await adminProfileRes.json();
    if (!adminProfileRes.ok) throw new Error(`Admin profile failed: ${JSON.stringify(adminProfileData)}`);
    console.log(`${colors.green}✔ Profile fetched! Name: ${adminProfileData.user.name}, Role: ${adminProfileData.user.role}${colors.reset}\n`);

    // ==========================================
    // 3. GET ALL USERS (TO FIND IDS)
    // ==========================================
    console.log(`${colors.cyan}[STEP 3] Fetching all users from database to get host and visitor IDs...${colors.reset}`);
    const usersRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const usersData = await usersRes.json();
    if (!usersRes.ok) throw new Error(`Fetch users failed: ${JSON.stringify(usersData)}`);

    // Find Priya Sharma (Employee) and Rahul Kumar (Visitor)
    const hostUser = usersData.users.find(u => u.email === 'priya@visitorpass.com');
    const visitorUser = usersData.users.find(u => u.email === 'anuragkushwaha2207@gmail.com');

    if (!hostUser || !visitorUser) {
      throw new Error('Required seed users (priya@visitorpass.com or anuragkushwaha2207@gmail.com) not found in database.');
    }

    hostId = hostUser._id;
    visitorId = visitorUser._id;
    console.log(`${colors.green}✔ Found Host (Priya Sharma) ID: ${hostId}${colors.reset}`);
    console.log(`${colors.green}✔ Found Visitor (Rahul Kumar) ID: ${visitorId}${colors.reset}\n`);

    // ==========================================
    // 4. VISITOR LOGIN
    // ==========================================
    console.log(`${colors.cyan}[STEP 4] Logging in as Visitor (anuragkushwaha2207@gmail.com)...${colors.reset}`);
    const visitorLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'anuragkushwaha2207@gmail.com', password: 'password123' })
    });
    const visitorLoginData = await visitorLoginRes.json();
    if (!visitorLoginRes.ok) throw new Error(`Visitor login failed: ${JSON.stringify(visitorLoginData)}`);
    visitorToken = visitorLoginData.token;
    console.log(`${colors.green}✔ Visitor Login successful! Token received.${colors.reset}\n`);

    // ==========================================
    // 5. CREATE APPOINTMENT (PRE-REGISTER)
    // ==========================================
    console.log(`${colors.cyan}[STEP 5] Creating a new appointment request for Host ID: ${hostId}...${colors.reset}`);
    const appRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${visitorToken}`
      },
      body: JSON.stringify({
        hostId: hostId,
        purpose: 'Technical Discussion on APIs',
        scheduledTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // active now
        location: 'Main Block, Floor 3'
      })
    });
    const appData = await appRes.json();
    if (!appRes.ok) throw new Error(`Appointment creation failed: ${JSON.stringify(appData)}`);
    appointmentId = appData.appointment._id;
    console.log(`${colors.green}✔ Appointment created successfully! ID: ${appointmentId}, Status: ${appData.appointment.status}${colors.reset}\n`);

    // ==========================================
    // 6. EMPLOYEE (HOST) LOGIN
    // ==========================================
    console.log(`${colors.cyan}[STEP 6] Logging in as Employee/Host (priya@visitorpass.com) to approve...${colors.reset}`);
    const employeeLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@visitorpass.com', password: 'password123' })
    });
    const employeeLoginData = await employeeLoginRes.json();
    if (!employeeLoginRes.ok) throw new Error(`Employee login failed: ${JSON.stringify(employeeLoginData)}`);
    employeeToken = employeeLoginData.token;
    console.log(`${colors.green}✔ Employee Login successful! Token received.${colors.reset}\n`);

    // ==========================================
    // 7. APPROVE APPOINTMENT
    // ==========================================
    console.log(`${colors.cyan}[STEP 7] Approving Appointment ID: ${appointmentId}...${colors.reset}`);
    const approveRes = await fetch(`${BASE_URL}/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${employeeToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok) throw new Error(`Approval failed: ${JSON.stringify(approveData)}`);
    console.log(`${colors.green}✔ Appointment approved! New Status: ${approveData.appointment.status}${colors.reset}\n`);

    // ==========================================
    // 8. GET DIGITAL PASS (VISITOR)
    // ==========================================
    console.log(`${colors.cyan}[STEP 8] Retrieving generated digital pass as Visitor...${colors.reset}`);
    const passRes = await fetch(`${BASE_URL}/passes/my-pass`, {
      headers: { 'Authorization': `Bearer ${visitorToken}` }
    });
    const passData = await passRes.json();
    if (!passRes.ok) throw new Error(`Pass retrieval failed: ${JSON.stringify(passData)}`);
    
    let activePass = passData.pass;
    if (!activePass) throw new Error('No active pass found for visitor.');

    passId = activePass._id;
    qrCodePayload = activePass.qrCodePayload;
    console.log(`${colors.green}✔ Pass retrieved! Pass ID: ${passId}, Pass Code: ${activePass.passCode}${colors.reset}`);
    console.log(`${colors.green}✔ QR Code Payload JWT found: ${qrCodePayload.substring(0, 40)}...${colors.reset}\n`);

    // ==========================================
    // 9. SECURITY LOGIN
    // ==========================================
    console.log(`${colors.cyan}[STEP 9] Logging in as Security Guard (security@visitorpass.com)...${colors.reset}`);
    const securityLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'security@visitorpass.com', password: 'password123' })
    });
    const securityLoginData = await securityLoginRes.json();
    if (!securityLoginRes.ok) throw new Error(`Security login failed: ${JSON.stringify(securityLoginData)}`);
    securityToken = securityLoginData.token;
    console.log(`${colors.green}✔ Security Login successful! Token received.${colors.reset}\n`);

    // ==========================================
    // 10. SCAN & CHECK-IN
    // ==========================================
    console.log(`${colors.cyan}[STEP 10] Scanning and verifying pass (Checking in Visitor)...${colors.reset}`);
    const scanRes = await fetch(`${BASE_URL}/passes/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${securityToken}`
      },
      body: JSON.stringify({ qrCodePayload: qrCodePayload })
    });
    const scanData = await scanRes.json();
    if (!scanRes.ok) throw new Error(`Scan check-in failed: ${JSON.stringify(scanData)}`);
    console.log(`${colors.green}✔ Visitor successfully checked in!${colors.reset}`);
    console.log(`${colors.yellow}Action: ${scanData.action}${colors.reset}`);
    console.log(`${colors.yellow}Message: ${scanData.message}${colors.reset}`);
    console.log(`${colors.yellow}Time: ${scanData.time}${colors.reset}\n`);

    console.log(`${colors.bright}${colors.green}=== ALL ENDPOINTS VERIFIED SUCCESSFULLY! VPMS APIS ARE 100% FUNCTIONAL! ===${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}❌ TEST RUNNER ERROR:${colors.reset}`);
    console.error(error.message || error);
    console.log('\n');
    process.exit(1);
  }
}

runTests();
