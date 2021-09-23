const express = require('express')
const VideoController = require('./Video.controller')
const validate = require('../../middlewares/validate')
const Validation = require('./Video.validation')

const router = express.Router()
const Controller = new VideoController()

router
  .route('/upload')
  .post(validate(Validation.uploadVideo), Controller.upload)

router
  .route('/convert/:id')
  .get(validate(Validation.convertVideo), Controller.convert)

router
  .route('/createSubtitles/:id')
  .get(validate(Validation.addSubtitles), Controller.addSubtitles)

module.exports = router
