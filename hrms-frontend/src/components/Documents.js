import React, { useState, useEffect } from 'react';
import Header from './Header';
import { documentService, authService } from '../services';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  const [uploadData, setUploadData] = useState({
    document_type: 'certificate',
    description: '',
    file: null
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('document_type', uploadData.document_type);
    formData.append('description', uploadData.description);
    formData.append('file', uploadData.file);

    try {
      await documentService.uploadDocument(formData);
      setMessage('Document uploaded successfully');
      setShowUpload(false);
      setUploadData({ document_type: 'certificate', description: '', file: null });
      loadDocuments();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentService.deleteDocument(id);
      setMessage('Document deleted successfully');
      loadDocuments();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Delete failed');
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const blob = await documentService.downloadDocument(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setMessage('Download failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <div className="attendance-container">
        <div className="dashboard-header" style={{display: 'flex', justifyContent: 'space-between'}}>
          <h1>My Documents</h1>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            Upload Document
          </button>
        </div>

        {message && (
          <div className={message.includes('failed') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                {isAdmin && <th>Employee</th>}
                <th>Document Type</th>
                <th>File Name</th>
                <th>Description</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  {isAdmin && <td>{doc.first_name} {doc.last_name}</td>}
                  <td style={{textTransform: 'capitalize'}}>{doc.document_type}</td>
                  <td>{doc.file_name}</td>
                  <td>{doc.description || '-'}</td>
                  <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-secondary"
                      style={{padding: '0.4rem 0.8rem', marginRight: '0.5rem'}}
                      onClick={() => handleDownload(doc.id, doc.file_name)}
                    >
                      Download
                    </button>
                    <button 
                      className="btn btn-danger"
                      style={{padding: '0.4rem 0.8rem'}}
                      onClick={() => handleDelete(doc.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showUpload && (
          <div className="modal-overlay" onClick={() => setShowUpload(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Upload Document</h2>
              
              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label>Document Type</label>
                  <select
                    value={uploadData.document_type}
                    onChange={(e) => setUploadData({...uploadData, document_type: e.target.value})}
                    required
                  >
                    <option value="salary">Salary Document</option>
                    <option value="certificate">Certificate</option>
                    <option value="profile">Profile Attachment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>File</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Upload
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

export default Documents;
