const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().min(3).required(),
  username: Joi.string().alphanum().min(3).max(20).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role_id: Joi.number().required()
});

module.exports = {
  createUserSchema
};