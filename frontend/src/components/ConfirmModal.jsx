import React from 'react';
import Modal from './Modal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1rem' }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button onClick={onClose} className="btn-primary" style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-light)', boxShadow: 'none' }}>
          Hủy
        </button>
        <button onClick={() => { onConfirm(); onClose(); }} className="btn-primary" style={{ background: 'var(--color-danger)' }}>
          Đồng ý
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
