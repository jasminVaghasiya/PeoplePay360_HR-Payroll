import React from 'react';
import { AlertOctagon, X, HelpCircle } from 'lucide-react';

export const FormErrorBanner = ({ error, onClose }) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : (error.message || 'An error occurred. Please check inputs and try again.');
  const errorCode = typeof error === 'object' ? error.code : null;
  const requestId = typeof error === 'object' ? error.requestId : null;

  return (
    <div className="error-banner">
      <div className="error-banner-icon">
        <AlertOctagon size={20} />
      </div>

      <div className="error-banner-content">
        <div className="error-banner-title">
          <span>{errorCode ? `Error (${errorCode})` : 'Action Failed'}</span>
          {requestId && (
            <span className="error-banner-request-id" title="Support Correlation Reference">
              ID: {requestId}
            </span>
          )}
        </div>
        <div className="error-banner-message">{errorMessage}</div>
      </div>

      {onClose && (
        <button type="button" className="error-banner-close" onClick={onClose} aria-label="Dismiss error">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default FormErrorBanner;
