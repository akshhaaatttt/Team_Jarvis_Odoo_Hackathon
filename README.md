# 🏢 Odoo India - HR Management System

A full-stack HRMS application with employee management, attendance tracking, leave management, payroll, and document management.

## 🛠️ Tech Stack

- **Frontend:** React.js, React Router, Axios
- **Backend:** Node.js, Express.js, MySQL
- **Auth:** JWT, bcrypt

## 📁 Project Structure

```
Odoo/
├── hrms-backend/          # Node.js API
│   ├── server.js
│   ├── controllers/       # Business logic
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth middleware
│   └── config/           # Database config
│
└── hrms-frontend/        # React app
    └── src/
        ├── components/   # React components
        └── services/     # API services
```

## ⚡ Quick Start

### 1. Database Setup
```bash
mysql -u root -p
CREATE DATABASE hrms_db;
USE hrms_db;
SOURCE hrms-backend/config/schema.sql;
```

### 2. Backend Setup
```bash
cd hrms-backend
npm install
# Create .env file (see .env.example)
node server.js
# Runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd hrms-frontend
npm install
# Create .env file (see .env.example)
npm start
# Runs on http://localhost:3000
```

## 🔑 Default Login

**Admin:**
- ID: `ADMIN001`
- Password: `Admin@123`

## ✨ Features

- 🔐 Authentication & Authorization
- 👥 Employee Management
- ⏰ Attendance Tracking
- 🏖️ Leave Management
- 💰 Payroll & Salary
- 📄 Document Management
- 📊 Dashboard & Reports

## 📝 API Endpoints

```
Auth:       POST /api/auth/login
Employees:  GET/POST/PUT /api/employees
Attendance: POST /api/attendance/check-in
Leave:      GET/POST /api/leave
Payroll:    GET/POST /api/payroll
Documents:  POST /api/documents/upload
```

## 🎨 Design

Modern purple gradient theme with wave animations, glassmorphism effects, and smooth micro-interactions.

## 📄 License

Proprietary Software

---

**Version:** 2.0.0  
**Updated:** January 2026
