const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().min(3).required(),
  username: Joi.string().alphanum().min(3).max(20).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role_id: Joi.number().required()
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