import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDepartments } from '../Redux/Slices/departementSlice';
import UpdateDepartmentForm from '../Components/forms/UpdateDepartmentForm';
import { Icon } from '@iconify/react/dist/iconify.js';
import Swal from 'sweetalert2';

const DepartmentUpdatePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { items: departments, status: loading, error } = useSelector((state) => state.departments);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const department = departments.find(d => d.id === parseInt(id));

  const handleSuccess = () => {
    Swal.fire(
      'Succès!',
      'Le département a été mis à jour avec succès.',
      'success'
    ).then(() => {
      navigate('/departments');
    });
  };

  if (loading === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    Swal.fire(
      'Erreur!',
      'Une erreur est survenue lors du chargement des données.',
      'error'
    ).then(() => {
      navigate('/departments');
    });
    return null;
  }

  if (!department) {
    Swal.fire(
      'Attention!',
      'Le département demandé n\'existe pas.',
      'warning'
    ).then(() => {
      navigate('/departments');
    });
    return null;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h4 className="page-title mb-0">Modifier le département</h4>
              </div>
              <div className="col-md-4">
                <div className="float-end">
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/departments')}
                  >
                    <Icon icon="mdi:arrow-left" className="me-1" />
                    Retour
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <UpdateDepartmentForm
                department={department}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentUpdatePage; 