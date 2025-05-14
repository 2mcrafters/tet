import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateDepartment } from '../../Redux/Slices/departementSlice';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Icon } from "@iconify/react/dist/iconify.js";
import Swal from 'sweetalert2';

const UpdateDepartmentForm = ({ department, onSuccess }) => {
  const dispatch = useDispatch();
  const { status } = useSelector(state => state.departements);
  const validationSchema = Yup.object({
    nom: Yup.string()
      .required('Le nom du département est requis')
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
    description: Yup.string()
      .max(500, 'La description ne peut pas dépasser 500 caractères'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Create the department update data
      const departmentUpdate = {
        id: department.id,
        nom: values.nom,
        description: values.description || null
      };

      await dispatch(updateDepartment(departmentUpdate)).unwrap();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating department:', error);
      Swal.fire(
        'Erreur!',
        'Une erreur est survenue lors de la mise à jour du département.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        nom: department.nom || '',
        description: department.description || '',
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
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
                className="form-control"
                placeholder="Entrez le nom du département"
                required
              />
              <ErrorMessage name="nom" component="div" className="invalid-feedback" />
            </div>
          </div>

          <div className="col-md-12">
            <label className="form-label">Description</label>
            <div className="icon-field has-validation">
              <span className="icon">
                <Icon icon="solar:document-text-outline" />
              </span>
              <Field
                as="textarea"
                name="description"
                className="form-control"
                placeholder="Entrez la description du département"
                rows="3"
              />
              <ErrorMessage name="description" component="div" className="invalid-feedback" />
            </div>
          </div>

          <div className="col-12">
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onSuccess()}
                disabled={isSubmitting || status === 'loading'}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || status === 'loading'}
              >
                {isSubmitting || status === 'loading' ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default UpdateDepartmentForm; 