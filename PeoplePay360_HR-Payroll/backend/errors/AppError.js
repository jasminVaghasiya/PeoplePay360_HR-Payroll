const ERROR_CODES = require('./errorCodes');

class AppError extends Error {
  constructor({
    message = 'An error occurred while processing your request',
    statusCode = 500,
    code = ERROR_CODES.INTERNAL_ERROR,
    fields = null,
    details = null,
    isOperational = true,
    cause = null,
    requestId = null
  } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.details = details;
    this.isOperational = isOperational;
    this.cause = cause;
    this.requestId = requestId;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Invalid request payload', fields = null, code = ERROR_CODES.INVALID_INPUT) {
    return new AppError({ message, statusCode: 400, code, fields });
  }

  static validation(message = 'Please correct the highlighted fields.', fields = null) {
    return new AppError({ message, statusCode: 422, code: ERROR_CODES.VALIDATION_ERROR, fields });
  }

  static unauthorized(message = 'Authentication required. Please sign in to continue.', code = ERROR_CODES.UNAUTHORIZED) {
    return new AppError({ message, statusCode: 401, code });
  }

  static forbidden(message = "You don't have permission to perform this action.", code = ERROR_CODES.FORBIDDEN) {
    return new AppError({ message, statusCode: 403, code });
  }

  static notFound(message = 'The requested resource could not be found.', code = ERROR_CODES.RESOURCE_NOT_FOUND) {
    return new AppError({ message, statusCode: 404, code });
  }

  static conflict(message = 'Resource conflict detected.', code = ERROR_CODES.RESOURCE_CONFLICT) {
    return new AppError({ message, statusCode: 409, code });
  }

  static invalidWorkflow(message = "This step isn't available yet. Please complete the previous step first.") {
    return new AppError({ message, statusCode: 400, code: ERROR_CODES.INVALID_WORKFLOW_STEP });
  }

  static internal(message = 'Something went wrong. Please try again later.', cause = null) {
    return new AppError({ message, statusCode: 500, code: ERROR_CODES.INTERNAL_ERROR, isOperational: false, cause });
  }
}

module.exports = AppError;
