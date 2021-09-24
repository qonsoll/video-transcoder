const Joi = require('joi')

const createApp = Joi.object({
  body: Joi.object().keys({
    name: Joi.string().required()
  })
})

const deleteApp = Joi.object({
  params: Joi.object().keys({
    id: Joi.required()
  })
})

module.exports = {
  createApp,
  deleteApp
}
