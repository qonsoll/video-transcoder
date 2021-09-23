const Joi = require('joi')

const uploadVideo = Joi.object({
  body: Joi.object().keys({
    toFormat: Joi.string().required()
  }),
  files: Joi.object().keys({
    data: Joi.object().required()
  })
})

const convertVideo = Joi.object({
  params: Joi.object().keys({
    id: Joi.required()
  })
})

const addSubtitles = Joi.object({
  params: Joi.object().keys({
    id: Joi.required()
  })
})

module.exports = {
  uploadVideo,
  convertVideo,
  addSubtitles
}
