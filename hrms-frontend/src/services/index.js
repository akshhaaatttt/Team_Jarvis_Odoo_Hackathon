import api from './api';

export const authService = {
  login: async (login_id, password) => {
    const response = await api.post('/auth/login', { login_id, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  changePassword: async (old_password, new_password) => {
    const response = await api.post('/auth/change-password', { old_password, new_password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const employeeService = {
  getAllEmployees: async () => {
    const response = await api.get('/employees');
    return response.data;
  },

  getEmployeeById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  getMyProfile: async () => {
    const response = await api.get('/employees/me');
    return response.data;
  },

  updateProfile: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  createUser: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  }
};

export const attendanceService = {
  checkIn: async () => {
    const response = await api.post('/attendance/check-in');
    return response.data;
  },

  checkOut: async () => {
    const response = await api.post('/attendance/check-out');
    return response.data;
  },

  getMyAttendance: async (month, year, view) => {
    const response = await api.get('/attendance/me', { params: { month, year, view } });
    return response.data;
  },

  getAllAttendance: async (date, employee_id) => {
    const response = await api.get('/attendance', { params: { date, employee_id } });
    return response.data;
  }
};

export const leaveService = {
  createLeaveRequest: async (formData) => {
    const response = await api.post('/leave', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getLeaveRequests: async () => {
    const response = await api.get('/leave');
    return response.data;
  },

  updateLeaveStatus: async (id, status, rejection_reason) => {
    const response = await api.put(`/leave/${id}`, { status, rejection_reason });
    return response.data;
  },

  getLeaveAllocation: async () => {
    const response = await api.get('/leave/allocation');
    return response.data;
  }
};

export const salaryService = {
  getSalaryInfo: async (employee_id) => {
    const response = await api.get(`/salary/${employee_id}`);
    return response.data;
  },

  updateSalaryInfo: async (employee_id, data) => {
    const response = await api.put(`/salary/${employee_id}`, data);
    return response.data;
  },

  getPayableDays: async (employee_id, month, year) => {
    const response = await api.get(`/salary/${employee_id}/payable-days`, { params: { month, year } });
    return response.data;
  }
};

export const documentService = {
  uploadDocument: async (formData) => {
    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getDocuments: async (employee_id) => {
    const response = await api.get('/documents', { params: { employee_id } });
    return response.data;
  },

  downloadDocument: async (id) => {
    const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    return response.data;
  },

  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  }
};

export const payrollService = {
  generatePayroll: async (month, year) => {
    const response = await api.post('/payroll-summary/generate', { month, year });
    return response.data;
  },

  getSalarySlip: async (month, year) => {
    const response = await api.get('/payroll-summary/salary-slip', { params: { month, year } });
    return response.data;
  },

  getPayrollReports: async (month, year) => {
    const response = await api.get('/payroll-summary/reports', { params: { month, year } });
    return response.data;
  },

  approvePayroll: async (id) => {
    const response = await api.put(`/payroll-summary/${id}/approve`);
    return response.data;
  }
};

export const salaryStructureService = {
  createOrUpdateSalary: async (data) => {
    const response = await api.post('/salary-structure/structure', data);
    return response.data;
  },

  getAllSalaryStructures: async () => {
    const response = await api.get('/salary-structure/structure');
    return response.data;
  },

  getSalaryStructure: async (employee_id) => {
    const response = await api.get(`/salary-structure/structure/${employee_id}`);
    return response.data;
  },

  createRevision: async (data) => {
    const response = await api.post('/salary-structure/revision', data);
    return response.data;
  },

  getRevisionHistory: async (employee_id) => {
    const response = await api.get(`/salary-structure/revision/${employee_id}`);
    return response.data;
  },

  deleteSalaryStructure: async (employee_id) => {
    const response = await api.delete(`/salary-structure/structure/${employee_id}`);
    return response.data;
  }
};
