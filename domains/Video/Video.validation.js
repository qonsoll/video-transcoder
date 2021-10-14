const Joi = require('joi')

const getVideos = Joi.object({
  headers: Joi.object().keys({
    appid: Joi.string().required()
  })
})

const getVideo = Joi.object({
  headers: Joi.object().keys({
    appid: Joi.string().required()
  }),
  params: Joi.object().keys({
    id: Joi.required()
  })
})

const uploadVideo = Joi.object({
  body: Joi.object().keys({
    uploadProps: Joi.string().required()
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
  addSubtitles,
  getVideos,
  getVideo
}
