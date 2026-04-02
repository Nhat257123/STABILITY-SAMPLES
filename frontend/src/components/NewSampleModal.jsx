import React from 'react';
import Modal from './Modal';
import SampleForm from './SampleForm';

const NewSampleModal = ({ isOpen, onClose, onAddSample }) => {
  const handleAdd = async (formData) => {
    await onAddSample(formData);
    onClose();
  };

  return (
    <Modal title="Thêm mẫu thử mới" isOpen={isOpen} onClose={onClose}>
      <SampleForm onSubmit={handleAdd} isModal={true} />
    </Modal>
  );
};

export default NewSampleModal;
