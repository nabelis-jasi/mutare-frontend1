
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import UploadTable from '../components/shared/UploadTable';

const ModalUploadEntries = ({ isOpen, onClose, onUpload, uploadData }) => {
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    setUploading(true);
    await onUpload();
    setUploading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3>Upload Entries</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <UploadTable {...uploadData} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

ModalUploadEntries.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  uploadData: PropTypes.object,
};

export default ModalUploadEntries;
