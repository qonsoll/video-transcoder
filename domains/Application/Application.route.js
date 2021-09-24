const express = require('express')
const ApplicationController = require('./Application.controller')
const ApplicationValidation = require('./Application.validation')
const { validate } = require('../../middlewares')

const router = express.Router()
const Controller = new ApplicationController()

router
  .route('/')
  .post(validate(ApplicationValidation.createApp), Controller.create)

router
  .route('/:id')
  .delete(validate(ApplicationValidation.deleteApp), Controller.delete)

module.exports = router
