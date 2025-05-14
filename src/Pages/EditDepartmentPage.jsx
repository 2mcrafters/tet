import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDepartments, updateDepartment } from '../Redux/Slices/departementSlice';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Icon } from '@iconify/react/dist/iconify.js';
import Swal from 'sweetalert2';

const EditDepartmentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { items: departments, status: loading } = useSelector((state) => state.departments);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const department = departments.find(dept => dept.id === parseInt(id));

  if (loading === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              Département non trouvé
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/departments')}>
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  const validationSchema = Yup.object({
    nom: Yup.string()
      .required('Le nom du département est requis')
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await dispatch(updateDepartment({ 
        id: department.id, 
        nom: values.nom 
      })).unwrap();
      
      if (result) {
        Swal.fire({
          title: 'Succès!',
          text: 'Le département a été modifié avec succès.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          navigate('/departments');
        });
      }
    } catch (error) {
      console.error('Update error:', error);
      Swal.fire({
        title: 'Erreur!',
        text: error.message || 'Une erreur est survenue lors de la modification.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h4 className="page-title mb-0">Modifier le département</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <Formik
                initialValues={{
                  nom: department.nom
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, errors, touched }) => (
                  <Form className="row gy-3 needs-validation" noValidate>
                    <div className="col-md-12">
                      <label className="form-label">Nom du département</label>
                      <div className="icon-field has-validation">
                        <span className="icon">
                          <Icon icon="solar:building-outline" />
                        </span>
                        <Field
                          type="text"
                          name="nom"
                          className={`form-control ${errors.nom && touched.nom ? 'is-invalid' : ''}`}
                          placeholder="Entrez le nom du département"
                          required
                        />
                        {errors.nom && touched.nom && (
                          <div className="invalid-feedback">{errors.nom}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                      >
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary ms-2"
                        onClick={() => navigate('/departments')}
                      >
                        Annuler
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDepartmentPage; 