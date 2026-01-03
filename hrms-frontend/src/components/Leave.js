import React, { useState, useEffect } from 'react';
import Header from './Header';
import { leaveService, authService } from '../services';

const Leave = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [allocation, setAllocation] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  const [formData, setFormData] = useState({
    leave_type_id: '1',
    from_date: '',
    to_date: '',
    reason: '',
    remarks: '',
    attachment: null
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const reqData = await leaveService.getLeaveRequests();
      setRequests(reqData);
      
      if (activeTab === 'allocation') {
        const allocData = await leaveService.getLeaveAllocation();
        setAllocation(allocData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (formData.from_date && formData.to_date) {
      const start = new Date(formData.from_date);
      const end = new Date(formData.to_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('leave_type_id', formData.leave_type_id);
    data.append('from_date', formData.from_date);
    data.append('to_date', formData.to_date);
    data.append('reason', formData.reason);
    if (formData.remarks) {
      data.append('remarks', formData.remarks);
    }
    if (formData.attachment) {
      data.append('attachment', formData.attachment);
    }

    try {
      await leaveService.createLeaveRequest(data);
      setShowModal(false);
      setFormData({ leave_type_id: '1', from_date: '', to_date: '', reason: '', remarks: '', attachment: null });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit request');
    }
  };

  const handleApprove = async (id) => {
    const comment = prompt('Approval comment (optional):');
    try {
      await leaveService.updateLeaveStatus(id, 'approved', comment || '');
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    
    try {
      await leaveService.updateLeaveStatus(id, 'rejected', reason);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to reject');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <div className="attendance-container">
        <div className="dashboard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1>Time Off</h1>
          {!isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Request Leave
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Time Off
            </button>
            <button 
              className={`tab ${activeTab === 'allocation' ? 'active' : ''}`}
              onClick={() => setActiveTab('allocation')}
            >
              Allocation
            </button>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  <th>Comment</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    {isAdmin && <td>{request.employee_name}</td>}
                    <td>{request.leave_type_name}</td>
                    <td>{request.from_date}</td>
                    <td>{request.to_date}</td>
                    <td>{request.days}</td>
                    <td style={{maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word'}}>{request.reason}</td>
                    <td style={{maxWidth: '150px', whiteSpace: 'normal', wordWrap: 'break-word'}}>{request.remarks || '-'}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: request.status === 'approved' ? '#d1fae5' : 
                                   request.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color: request.status === 'approved' ? '#065f46' : 
                               request.status === 'rejected' ? '#991b1b' : '#92400e'
                      }}>
                        {request.status}
                      </span>
                    </td>
                    <td style={{maxWidth: '150px', whiteSpace: 'normal', wordWrap: 'break-word'}}>{request.approval_comment || '-'}</td>
                    {isAdmin && (
                      <td>
                        {request.status === 'pending' && (
                          <>
                            <button 
                              className="btn btn-success" 
                              style={{marginRight: '0.5rem', padding: '0.4rem 0.8rem'}}
                              onClick={() => handleApprove(request.id)}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-danger"
                              style={{padding: '0.4rem 0.8rem'}}
                              onClick={() => handleReject(request.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'allocation' && isAdmin && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Allocated</th>
                  <th>Used</th>
                  <th>Remaining</th>
                  <th>Year</th>
                </tr>
              </thead>
              <tbody>
                {allocation.map((alloc, index) => (
                  <tr key={index}>
                    <td>{alloc.employee_name}</td>
                    <td>{alloc.leave_type_name}</td>
                    <td>{alloc.allocated_days}</td>
                    <td>{alloc.used_days}</td>
                    <td>{alloc.remaining_days}</td>
                    <td>{alloc.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Request Leave</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Leave Type</label>
                  <select
                    value={formData.leave_type_id}
                    onChange={(e) => setFormData({...formData, leave_type_id: e.target.value})}
                    required
                  >
                    <option value="1">Paid Time Off</option>
                    <option value="2">Sick Leave</option>
                    <option value="3">Unpaid Leave</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>From Date</label>
                  <input
                    type="date"
                    value={formData.from_date}
                    onChange={(e) => setFormData({...formData, from_date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>To Date</label>
                  <input
                    type="date"
                    value={formData.to_date}
                    onChange={(e) => setFormData({...formData, to_date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Days: {calculateDays()}</label>
                </div>

                <div className="form-group">
                  <label>Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Remarks (optional)</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    rows="2"
                    placeholder="Additional notes or context"
                  />
                </div>

                {formData.leave_type_id === '2' && (
                  <div className="form-group">
                    <label>Attachment (Required for Sick Leave)</label>
                    <input
                      type="file"
                      onChange={(e) => setFormData({...formData, attachment: e.target.files[0]})}
                      required
                    />
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Leave;
