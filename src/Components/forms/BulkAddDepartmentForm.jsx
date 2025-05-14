import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createDepartment } from '../../Redux/Slices/departementSlice';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Icon } from "@iconify/react/dist/iconify.js";

const BulkAddDepartmentForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { status } = useSelector(state => state.departments);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const initialValues = {
    departments: [{ nom: '' }]
  };

  const validationSchema = Yup.object({
    departments: Yup.array().of(
      Yup.object().shape({
        nom: Yup.string()
          .required('Le nom du département est requis')
          .min(2, 'Le nom doit contenir au moins 2 caractères')
          .max(50, 'Le nom ne peut pas dépasser 50 caractères')
      })
    )
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    let success = 0;
    let errors = 0;

    for (const dept of values.departments) {
      try {
        await dispatch(createDepartment(dept));
        success++;
      } catch (error) {
        errors++;
      }
    }

    setSuccessCount(success);
    setErrorCount(errors);
    resetForm();
    if (onSuccess) onSuccess();
    setSubmitting(false);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, isSubmitting, errors, touched }) => (
        <Form className="row gy-3 needs-validation" noValidate>
          <FieldArray name="departments">
            {({ push, remove }) => (
              <>
                {values.departments.map((_, index) => (
                  <div key={index} className="col-12">
                    <div className="row align-items-center">
                      <div className="col-md-10">
                        <div className="icon-field has-validation">
                          <span className="icon">
                            <Icon icon="solar:building-outline" />
                          </span>
                          <Field
                            type="text"
                            name={`departments.${index}.nom`}
                            className={`form-control ${errors.departments?.[index]?.nom && touched.departments?.[index]?.nom ? 'is-invalid' : ''}`}
                            placeholder="Entrez le nom du département"
                            required
                          />
                          {errors.departments?.[index]?.nom && touched.departments?.[index]?.nom && (
                            <div className="invalid-feedback">{errors.departments[index].nom}</div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-2">
                        {index > 0 && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => remove(index)}
                          >
                            <Icon icon="mdi:delete" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="col-12">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={() => push({ nom: '' })}
                  >
                    <Icon icon="mdi:plus" className="me-1" />
                    Ajouter un autre
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer tout'}
                  </button>
                </div>
              </>
            )}
          </FieldArray>
          {(successCount > 0 || errorCount > 0) && (
            <div className="col-12">
              <div className={`alert ${errorCount > 0 ? 'alert-warning' : 'alert-success'}`}>
                {successCount} département(s) créé(s) avec succès.
                {errorCount > 0 && ` ${errorCount} département(s) n'a(ont) pas pu être créé(s).`}
              </div>
            </div>
          )}
        </Form>
      )}
    </Formik>
  );
};

export default BulkAddDepartmentForm; 