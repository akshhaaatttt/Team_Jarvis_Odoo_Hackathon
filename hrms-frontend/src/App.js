import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import EmployeeInfo from './components/EmployeeInfo';
import Attendance from './components/Attendance';
import Leave from './components/Leave';
import CreateUser from './components/CreateUser';
import Documents from './components/Documents';
import PayrollReports from './components/PayrollReports';
import SalarySlip from './components/SalarySlip';
import SalaryStructure from './components/SalaryStructure';
import { authService } from './services';
import './App.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = authService.getCurrentUser();
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (user?.first_login) {
    return <Navigate to="/change-password" />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        
        <Route path="/employee/:id" element={
          <PrivateRoute>
            <EmployeeInfo />
          </PrivateRoute>
        } />
        
        <Route path="/attendance" element={
          <PrivateRoute>
            <Attendance />
          </PrivateRoute>
        } />
        
        <Route path="/leave" element={
          <PrivateRoute>
            <Leave />
          </PrivateRoute>
        } />
        
        <Route path="/create-user" element={
          <PrivateRoute>
            <CreateUser />
          </PrivateRoute>
        } />
        
        <Route path="/documents" element={
          <PrivateRoute>
            <Documents />
          </PrivateRoute>
        } />
        
        <Route path="/payroll" element={
          <PrivateRoute>
            <PayrollReports />
          </PrivateRoute>
        } />
        
        <Route path="/salary-slip" element={
          <PrivateRoute>
            <SalarySlip />
          </PrivateRoute>
        } />
        
        <Route path="/salary-structure" element={
          <PrivateRoute>
            <SalaryStructure />
          </PrivateRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
