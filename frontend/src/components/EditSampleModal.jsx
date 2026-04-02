import React from 'react';
import Modal from './Modal';
import SampleForm from './SampleForm';

const EditSampleModal = ({ isOpen, onClose, onEditSample, sample }) => {
  const handleEdit = async (formData, id) => {
    await onEditSample(formData, id);
    onClose();
  };

  if (!sample) return null;

  return (
    <Modal title={`Chỉnh sửa: [${sample.productName}]`} isOpen={isOpen} onClose={onClose}>
      <SampleForm onSubmit={handleEdit} isModal={true} initialData={sample} />
    </Modal>
  );
};

export default EditSampleModal;
