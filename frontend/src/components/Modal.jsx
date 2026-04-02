import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card">
        <div className="modal-header">
          <h3 className="outfit-font">{title}</h3>
          <button onClick={(e) => { e.preventDefault(); onClose(); }} className="modal-close">
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
