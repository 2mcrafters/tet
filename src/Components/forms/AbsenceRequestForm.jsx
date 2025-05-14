import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createAbsenceRequest, updateAbsenceRequest } from '../../Redux/Slices/absenceRequestSlice';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';

const AbsenceRequestForm = ({ initialValues = {}, isEdit = false, onSuccess }) => {
  const dispatch = useDispatch();
  const { status } = useSelector(state => state.absenceRequests);
  const { user, isLoading: authLoading } = useSelector(state => state.auth);
  const role = useSelector(state => state.auth.roles);
  // Debug initialValues
  useEffect(() => {
    console.log('Initial values:', initialValues);
    console.log('Is edit mode:', isEdit);
    console.log('Current user:', user);
  }, [initialValues, isEdit, user]);

  useEffect(() => {
    if (!isEdit && !user) {
      Swal.fire('Erreur', 'Vous devez être connecté pour créer une demande d\'absence', 'error');
    }
  }, [user, isEdit]);

  const validationSchema = Yup.object({
    type: Yup.string()
      .required('Le type d\'absence est requis')
      .oneOf(['Congé', 'maladie', 'autre'], 'Type d\'absence invalide'),
    dateDebut: Yup.date().required('La date de début est requise'),
    dateFin: Yup.date()
      .required('La date de fin est requise')
      .min(Yup.ref('dateDebut'), 'La date de fin doit être postérieure à la date de début'),
    motif: Yup.string().nullable(),
    justification: Yup.mixed()
      .nullable()
      .test('fileSize', 'Le fichier est trop volumineux (max 2MB)', value => {
        if (!value || typeof value === 'string') return true;
        return value.size <= 2048 * 1024;
      })
      .test('fileType', 'Format de fichier non supporté (jpg, jpeg, png, pdf uniquement)', value => {
        if (!value || typeof value === 'string') return true;
        return ['image/jpeg', 'image/png', 'application/pdf'].includes(value.type);
      })
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (isEdit) {
        // For update
        const userId = initialValues?.user_id;
        if (!userId) {
          throw new Error('Impossible de déterminer l\'utilisateur pour la mise à jour');
        }
        
        // Create FormData
        const formData = new FormData();
        
        // Add required fields with fallback to initialValues
        formData.append('user_id', String(userId));
        formData.append('type', values.type || initialValues.type);
        formData.append('dateDebut', new Date(values.dateDebut || initialValues.dateDebut).toISOString().split('T')[0]);
        formData.append('dateFin', new Date(values.dateFin || initialValues.dateFin).toISOString().split('T')[0]);
        formData.append('statut', values.statut || initialValues.statut || 'en_attente');
        
        // Add optional fields if they exist
        if (values.motif || initialValues.motif) {
          formData.append('motif', values.motif || initialValues.motif);
        }

        // Handle justification file
        if (values.justification instanceof File) {
          console.log('Adding file to FormData:', values.justification);
          formData.append('justification', values.justification);
        } else if (values.justification === null || values.justification === '') {
          formData.append('justification', '');
        } else if (values.justification && !(values.justification instanceof File)) {
            formData.append('justification', values.justification);
        }

        // Log FormData contents
        console.log('FormData contents for update:');
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }

        // Convert FormData to plain object
        const requestData = {};
        for (let [key, value] of formData.entries()) {
          requestData[key] = value;
        }

        console.log('Sending request data:', requestData);

        const response = await dispatch(
          updateAbsenceRequest({ id: initialValues.id, data: requestData })
        ).unwrap();

        if (response && response.error) {
          throw new Error(response.error);
        }

        resetForm();
        if (onSuccess) onSuccess();
      } else {
        // For create
        if (!user) {
          throw new Error('Utilisateur non authentifié');
        }

        const formData = new FormData();
        
        // Add required fields
        formData.append('user_id', String(user.id));
        formData.append('type', values.type);
        formData.append('dateDebut', new Date(values.dateDebut).toISOString().split('T')[0]);
        formData.append('dateFin', new Date(values.dateFin).toISOString().split('T')[0]);
        formData.append('statut', 'en_attente');
        
        // Add optional fields if they exist
        if (values.motif) {
          formData.append('motif', values.motif);
        }

        if (values.justification instanceof File) {
          console.log('Adding file to FormData:', values.justification);
          formData.append('justification', values.justification);
        } else if (values.justification === null || values.justification === '') {
          formData.append('justification', '');
        } else if (values.justification) {
          formData.append('justification', values.justification);
        }

        const response = await dispatch(createAbsenceRequest(formData)).unwrap();

        if (response && response.error) {
          throw new Error(response.error);
        }

        resetForm();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      let errorMessage = 'Une erreur est survenue lors de la mise à jour de la demande d\'absence.';
      
      if (error.error) {
        errorMessage = Object.entries(error.error)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire('Erreur!', errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <Formik
          initialValues={{
            type: 'Congé',
            dateDebut: '',
            dateFin: '',
            motif: '',
            justification: null,
            ...initialValues
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form>
              {!isEdit && user && (
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Employé</label>
                      <input
                        type="text"
                        className="form-control"
                        value={`${user.name} ${user.prenom}`}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="type" className="form-label">Type d'absence</label>
                    <Field as="select" name="type" className="form-control">
                      <option value="Congé">Congé</option>
                      <option value="maladie">Maladie</option>
                      <option value="autre">Autre</option>
                    </Field>
                    <ErrorMessage name="type" component="div" className="text-danger" />
                  </div>
                </div>
                <div className="col-md-6">
                  {isEdit && role && !role.includes('Employe') && (
                    <div className="mb-3">
                      <label htmlFor="statut" className="form-label">Statut</label>
                      <Field as="select" name="statut" className="form-control">
                        <option value="en_attente">En attente</option>
                        <option value="rejeté">Rejeté</option>
                        <option value="validé">Validé</option>
                        <option value="approuvé">Approuvé</option>

                      </Field>
                      <ErrorMessage name="statut" component="div" className="text-danger" />
                    </div>
                  )}
                </div>
                </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="dateDebut" className="form-label">Date de début</label>
                    <Field
                      type="date"
                      name="dateDebut"
                      id="dateDebut"
                      className="form-control"
                    />
                    <ErrorMessage name="dateDebut" component="div" className="text-danger" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="dateFin" className="form-label">Date de fin</label>
                    <Field
                      type="date"
                      name="dateFin"
                      id="dateFin"
                      className="form-control"
                    />
                    <ErrorMessage name="dateFin" component="div" className="text-danger" />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <div className="mb-3">
                    <label htmlFor="motif" className="form-label">Motif</label>
                    <Field
                      as="textarea"
                      name="motif"
                      id="motif"
                      className="form-control"
                      rows="3"
                      placeholder="Entrez le motif de votre absence"
                    />
                    <ErrorMessage name="motif" component="div" className="text-danger" />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="justification" className="form-label">Justification</label>
                    <input
                      type="file"
                      name="justification"
                      id="justification"
                      className="form-control"
                      onChange={(event) => {
                        setFieldValue("justification", event.currentTarget.files[0]);
                      }}
                    />
                    {values.justification && typeof values.justification === 'string' && (
                      <div className="mt-2">
                        <span>Fichier actuel: {values.justification}</span>
                      </div>
                    )}
                    <ErrorMessage name="justification" component="div" className="text-danger" />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    {isSubmitting ? 'Enregistrement...' : 'Soumettre'}
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AbsenceRequestForm;