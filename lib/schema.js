import Joi from 'joi';

export function getSchema () {
  const schema = Joi.object({
    expireIn: Joi.number().integer().optional(),
    url: Joi.string().optional()
  });

  return schema;
}
