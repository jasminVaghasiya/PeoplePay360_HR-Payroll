import React from 'react';
import { AlertCircle } from 'lucide-react';

export const FormFieldError = ({ error }) => {
  if (!error) return null;

  return (
    <div className="form-field-error">
      <AlertCircle size={14} className="form-field-error-icon" />
      <span>{error}</span>
    </div>
  );
};

export default FormFieldError;
