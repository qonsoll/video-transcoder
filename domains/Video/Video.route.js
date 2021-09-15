const express = require('express')
const VideoController = require('./Video.controller')

const router = express.Router()
const Controller = new VideoController()

router.post('/upload', Controller.upload)

router.get('/convert/:id', Controller.convert)
// TODO add validation middleware for endpoint function validation
// i.e. 'joi'
//
// router
//   .route("/convert")
//   .post(validate(Validation.convertVideo), Controller.convert)

module.exports = router
