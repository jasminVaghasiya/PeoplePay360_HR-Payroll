const AppError = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: {
          label: ''
        }
      }
    });

    if (error) {
      const fieldErrors = {};
      error.details.forEach((detail) => {
        const fieldName = detail.path.join('.');
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = detail.message.replace(/['"]/g, '');
        }
      });

      return next(
        new AppError({
          message: 'Please correct the highlighted fields before submitting.',
          statusCode: 422,
          code: ERROR_CODES.VALIDATION_ERROR,
          fields: fieldErrors
        })
      );
    }

    req[property] = value;
    next();
  };
};

module.exports = validate;
