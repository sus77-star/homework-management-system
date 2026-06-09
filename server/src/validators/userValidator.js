const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters',
      'any.required': 'Name is required'
    }),

  username: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 20 characters',
      'string.alphanum':
        'Username can only contain letters and numbers',
      'any.required': 'Username is required'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),

  role_id: Joi.number()
    .required()
    .messages({
      'number.base': 'Please select a role',
      'any.required': 'Please select a role'
    })
});

const updateProfileSchema = Joi.object({

  username: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required(),

  email: Joi.string()
    .email()
    .required(),

  phone: Joi.string()
    .pattern(/^\+[1-9]\d{8,14}$/)
    .allow('')
    .messages({
      'string.pattern.base':
        'Phone number must use international format'
    }),

  github: Joi.string()
    .uri()
    .allow('')
    .custom((value, helpers) => {

      if (
        value &&
        !value.includes('github.com')
      ) {
        return helpers.error('any.invalid');
      }

      return value;
    })
    .messages({
      'any.invalid':
        'Github URL must contain github.com'
    }),

  linkedin: Joi.string()
    .uri()
    .allow('')
    .custom((value, helpers) => {

      if (
        value &&
        !value.includes('linkedin.com')
      ) {
        return helpers.error('any.invalid');
      }

      return value;
    })
    .messages({
      'any.invalid':
        'LinkedIn URL must contain linkedin.com'
    }),

  bio: Joi.string()
    .max(500)
    .allow('')

});

module.exports = {
  createUserSchema,updateProfileSchema
};