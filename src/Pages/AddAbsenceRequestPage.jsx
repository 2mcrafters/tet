import React from 'react';
import { useNavigate } from 'react-router-dom';
import AbsenceRequestForm from '../Components/forms/AbsenceRequestForm';

const AddAbsenceRequestPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to absence requests list after a short delay
    setTimeout(() => {
      navigate('/absences');
    }, 2000);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-flex align-items-center justify-content-between">
            <h4 className="mb-0">Ajouter une demande d'absence</h4>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <AbsenceRequestForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
};

export default AddAbsenceRequestPage; 