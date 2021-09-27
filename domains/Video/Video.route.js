const express = require('express')
const VideoController = require('./Video.controller')
const { validate, appRestrictor } = require('../../middlewares')
const Validation = require('./Video.validation')

const router = express.Router()
const Controller = new VideoController()

router.use(appRestrictor)

router.route('/').get(validate(Validation.getVideos), Controller.getVideos)

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
