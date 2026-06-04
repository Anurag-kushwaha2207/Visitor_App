# Visitor Pass Management System (VPMS)

A production-grade, secure, and visually stunning role-based Visitor Pass Management System built using the **MERN Stack** (MongoDB, Express.js, React, Node.js). 

This project digitizes traditional paper entry registers into a seamless flow featuring pre-registration, host approvals, secure cryptographic QR passes, live camera verification, check-in/out logging, and instant notification mocks.

---

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Restricts UI interfaces and API endpoints using JWT authentication across four roles:
    1.  **Super Admin:** Overall analytics dashboard, user CRUD (creating employees/guards), and historical check-in spreadsheets.
    2.  **Security Officer (Frontdesk):** Live camera QR-code scanner, manual passcode check-in, check-out logs, and print badges.
    3.  **Host Employee:** Direct approval console (Approve/Deny) and pre-authorized visitor invitations.
    4.  **Visitor:** Self-service pre-registration requests, digital pass dashboard, dynamic QR generator, and PDF badge downloads.
*   **Secure QR Cryptography:** Auto-generates a signed JWT payload containing pass metadata, rendering it as a QR code to prevent duplication or pass manipulation.
*   **Dynamic Analytics Charts:** High-performance, clean charts mapping weekly entries and departmental traffic.
*   **PDF Badge Engine:** Backend implementation compiling PDF visitor badges with layout grid markers.
*   **Verification Timeline:** Complete audit log details logging check-ins, check-outs, and scanner locations.
*   **Docker Containerization:** Fully containerized setup for deployment using Docker Compose.

---

## 🛠️ Tech Stack

*   **Backend:** Node.js, Express.js, Mongoose ODM, JWT (`jsonwebtoken`), Password encryption (`bcryptjs`), File uploads (`multer`), PDF generation (`pdfkit`).
*   **Frontend:** React, Vite, React Router v6, Axios, Lucide Icons, Browser camera scanning (`html5-qrcode`), QR canvas renderer (`qrcode.react`).
*   **Database:** MongoDB.
*   **DevOps:** Docker, Docker Compose, Nginx.

---

## 📂 Project Structure

```text
visiter_app/
├── backend/
│   ├── config/          # DB connection configurations
│   ├── controllers/     # API controllers (MVC layout)
│   ├── middleware/      # JWT & RBAC protection middlewares
│   ├── models/          # Mongoose database models
│   ├── routes/          # Express routing endpoints
│   ├── uploads/         # Static visitor profile pictures
│   ├── server.js        # Main entrypoint
│   └── seed.js          # Database seed script
├── frontend/
│   ├── src/
│   │   ├── components/  # Shared layouts (Sidebar)
│   │   ├── context/     # Global state (Auth, Toast alerts)
│   │   ├── pages/       # Dashboard pages for each role
│   │   ├── App.jsx      # React router configuration
│   │   └── index.css    # Unified visual styling
│   └── index.html       # Base HTML config
└── docker-compose.yml   # Multi-container conductor
```

---

## 💻 Local Setup Guide

Follow these steps to run the application on your computer:

### Prerequisites
*   Node.js (v18 or higher)
*   MongoDB running locally (e.g. `mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### Step 1: Clone & Configure Backend
1. Open a terminal inside the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify your connection parameters in `.env` (it is pre-configured to check local MongoDB at `mongodb://127.0.0.1:27017/vpms`).

### Step 2: Seed the Database
Before starting the server, run the seeding script to populate mock accounts and analytics statistics. This makes the dashboards instantly look complete and ready to test:
```bash
node seed.js
```

### Step 3: Run the Backend
Start the server in hot-reload development mode:
```bash
npm run dev
```
The server will boot up at `http://localhost:5000`.

### Step 4: Setup & Run Frontend
1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
The application will open at `http://localhost:5173`.

---

## 🔑 Pre-Configured Demo Accounts

For easy testing and grading, use these seed accounts. You can also use the **demo shortcut buttons** on the login page to auto-fill these credentials:

| Role | Email Address | Password | Name | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@visitorpass.com` | `password123` | Suresh Agrawal | Manages users and visualizes weekly statistics. |
| **Security Guard** | `security@visitorpass.com` | `password123` | Ravi Guard | Live camera scanning and manual checkout console. |
| **Host Employee** | `priya@visitorpass.com` | `password123` | Priya Sharma | Approves visitor requests and schedules invites. |
| **Visitor** | `visitor@visitorpass.com` | `password123` | Rahul Kumar | View active QR code and download PDF badges. |

---

## 🐳 Docker Deployment

To build and run the entire multi-container stack (database, backend, frontend, and reverse proxy) using Docker Compose:

1. Run the following command in the root workspace directory:
   ```bash
   docker-compose up --build
   ```
2. The services will start:
   * **Frontend Application:** `http://localhost:3000`
   * **Backend API Gateway:** `http://localhost:5000`
   * **Database Instance:** `mongodb://localhost:27017`
3. Stop the containers:
   ```bash
   docker-compose down
   ```

---

## 🛡️ Security Implementation
1.  **Password Safety:** Password hashes are encrypted using `bcryptjs` before insertion into MongoDB.
2.  **JWT Authentication:** Client-side requests attach a `Bearer <token>` authorization header.
3.  **Role Protection:** Route request middleware filters endpoint access matching user status (Admin, Host, Security, Visitor).
4.  **Anti-QR Tampering:** The QR payload is a cryptographic token signed by the server's private secret. Copying or manual generation of QR data will fail validation checks.
