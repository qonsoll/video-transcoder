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

/**
 * @api {post} /application Create new application document in database
 * @apiName CreateApplication
 * @apiGroup Application
 *
 * @apiParam {String} name - Name of new application
 *
 * @apiSuccess {Object} - object that contains message and appId of created application
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "data":
 *              {
 *                "message": "created",
 *                "appId": "241WDa-dsAWW2ads-dsW"
 *              }
 *    }
 *
 * @apiError ApplicationError error that occurs during creation of application document in db
 *
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 400 Error
 *    {
 *      "data":
 *              {
 *                "message": "error",
 *                "error": "Error occurred during application creation"
 *              }
 *    }
 */

/**
 * @api {delete} /application/:id Delete application document with id from database
 * @apiName DeleteApplication
 * @apiGroup Application
 *
 * @apiParam {String} id - Id of application that must be deleted
 *
 * @apiSuccess {Object} - object that contains message and appId of deleted application
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "data":
 *              {
 *                "message": "deleted",
 *                "appId": "241WDa-dsAWW2ads-dsW"
 *              }
 *    }
 *
 * @apiError ApplicationError error that occurs during delete of application document from db
 *
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 400 Error
 *    {
 *      "data":
 *              {
 *                "message": "error",
 *                "error": "Error occurred during application delete"
 *              }
 *    }
 */

module.exports = router
