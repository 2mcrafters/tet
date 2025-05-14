import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAbsenceRequests } from '../Redux/Slices/absenceRequestSlice';
import AbsenceRequestForm from '../Components/forms/AbsenceRequestForm';
import { Icon } from '@iconify/react/dist/iconify.js';

const EditAbsenceRequestPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { items: absenceRequests, status: loading } = useSelector((state) => state.absenceRequests);

  useEffect(() => {
    dispatch(fetchAbsenceRequests());
  }, [dispatch]);

  const request = absenceRequests.find(req => req.id === parseInt(id));

  if (loading === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              <div className="d-flex align-items-center">
                <Icon icon="mdi:alert-circle" className="me-2" />
                <div>
                  <h5 className="alert-heading">Demande non trouvée</h5>
                  <p className="mb-0">La demande d'absence que vous recherchez n'existe pas.</p>
                </div>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/absences')}>
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h4 className="page-title mb-0">Modifier la demande d'absence</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <AbsenceRequestForm 
                initialValues={request}
                isEdit={true}
                onSuccess={() => navigate('/absences')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAbsenceRequestPage; 