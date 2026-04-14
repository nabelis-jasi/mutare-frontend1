
import React from 'react';
import PropTypes from 'prop-types';

const ModalViewEntry = ({ isOpen, onClose, entry, headers, answers }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3>View Entry</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <table className="table">
            <thead>
              <tr>
                {headers?.map((header, idx) => <th key={idx}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                {answers?.map((answer, idx) => <td key={idx}>{answer}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

ModalViewEntry.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  entry: PropTypes.object,
  headers: PropTypes.array,
  answers: PropTypes.array,
};

export default ModalViewEntry;
