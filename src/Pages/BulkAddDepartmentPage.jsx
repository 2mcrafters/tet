import React from 'react';
import { useNavigate } from 'react-router-dom';
import BulkAddDepartmentForm from '../components/forms/BulkAddDepartmentForm';

const BulkAddDepartmentPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to departments list after a short delay
    setTimeout(() => {
      navigate('/departments');
    }, 2000);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-flex align-items-center justify-content-between">
            <h4 className="mb-0">Ajouter plusieurs départements</h4>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <BulkAddDepartmentForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
};

export default BulkAddDepartmentPage; 