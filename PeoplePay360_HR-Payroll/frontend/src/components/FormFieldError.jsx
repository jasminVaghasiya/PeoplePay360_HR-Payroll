import React from 'react';
import { AlertCircle } from 'lucide-react';

export const FormFieldError = ({ error }) => {
  if (!error) return null;
  const message = typeof error === 'object' ? (error.message || JSON.stringify(error)) : String(error);

  return (
    <div className="form-field-error">
      <AlertCircle size={14} className="form-field-error-icon" />
      <span>{message}</span>
    </div>
  );
};

export default FormFieldError;
