const AppError = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

const generateRequestId = () => {
  return `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
};

// Middleware to assign Request ID to incoming request
const assignRequestId = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || generateRequestId();
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
};

const globalErrorHandler = (err, req, res, next) => {
  const requestId = req.requestId || generateRequestId();

  // Log detailed server-side error with stack trace (server log only)
  console.error(`[SERVER_ERROR] [${new Date().toISOString()}] [ID: ${requestId}] Path: ${req.originalUrl} | Code: ${err.code || 'UNKNOWN'} | Message: ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  let errorResponse = {
    statusCode: 500,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'Something went wrong while processing your request. Please try again later.',
    fields: null
  };

  // 1. AppError Operational Class
  if (err instanceof AppError) {
    errorResponse.statusCode = err.statusCode || 500;
    errorResponse.code = err.code || ERROR_CODES.INTERNAL_ERROR;
    errorResponse.message = err.message;
    errorResponse.fields = err.fields || null;
  }
  // 2. Mongoose Duplicate Key Error (E11000)
  else if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    const fieldName = keys[0] || 'record';
    errorResponse.statusCode = 409;
    errorResponse.code = ERROR_CODES.DUPLICATE_RESOURCE;
    errorResponse.message = `A ${fieldName} with this value already exists in the system.`;
    errorResponse.fields = { [fieldName]: `This ${fieldName} is already registered.` };
  }
  // 3. Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    const fields = {};
    Object.keys(err.errors).forEach((key) => {
      fields[key] = err.errors[key].message;
    });
    errorResponse.statusCode = 422;
    errorResponse.code = ERROR_CODES.VALIDATION_ERROR;
    errorResponse.message = 'Please correct the highlighted fields.';
    errorResponse.fields = fields;
  }
  // 4. Mongoose Cast Error (Invalid Mongo ID)
  else if (err.name === 'CastError') {
    errorResponse.statusCode = 400;
    errorResponse.code = ERROR_CODES.INVALID_INPUT;
    errorResponse.message = `Invalid format for resource identifier '${err.path}'.`;
  }
  // 5. JWT Auth Errors
  else if (err.name === 'JsonWebTokenError') {
    errorResponse.statusCode = 401;
    errorResponse.code = ERROR_CODES.UNAUTHORIZED;
    errorResponse.message = 'Invalid authentication token. Please sign in again.';
  } else if (err.name === 'TokenExpiredError') {
    errorResponse.statusCode = 401;
    errorResponse.code = ERROR_CODES.SESSION_EXPIRED;
    errorResponse.message = 'Your session has expired. Please sign in again to continue.';
  }
  // 6. Generic Operational Message attached to standard Error
  else if (err.statusCode || err.status) {
    errorResponse.statusCode = err.statusCode || err.status;
    errorResponse.code = err.statusCode === 409 ? ERROR_CODES.RESOURCE_CONFLICT : ERROR_CODES.OPERATION_FAILED;
    errorResponse.message = err.message || 'Operation could not be completed.';
  }

  // Construct Sanitized Client Payload (No stack traces, no internal database details)
  const clientPayload = {
    success: false,
    error: {
      code: errorResponse.code,
      message: errorResponse.message,
      requestId
    }
  };

  if (errorResponse.fields && Object.keys(errorResponse.fields).length > 0) {
    clientPayload.error.fields = errorResponse.fields;
  }

  return res.status(errorResponse.statusCode).json(clientPayload);
};

module.exports = {
  assignRequestId,
  globalErrorHandler
};
