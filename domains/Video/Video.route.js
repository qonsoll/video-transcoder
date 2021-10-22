const express = require('express')
const VideoController = require('./Video.controller')
const {
  validate,
  appRestrictor,
  accessTimeMetrics
} = require('../../middlewares')
const Validation = require('./Video.validation')
const { MonitoringInstance } = require('../Monitoring')

const router = express.Router()
const Controller = new VideoController()

router.use(appRestrictor)

router.route('/').get(validate(Validation.getVideos), Controller.getVideos)

router
  .route('/:id')
  .get(validate(Validation.getVideo), Controller.getVideo)
  .delete(validate(Validation.deleteVideo), Controller.deleteVideo)

router
  .route('/upload')
  .post(
    validate(Validation.uploadVideo),
    accessTimeMetrics(Controller.upload, MonitoringInstance)
  )

router
  .route('/convert/:id')
  .get(
    validate(Validation.convertVideo),
    accessTimeMetrics(Controller.convert, MonitoringInstance)
  )

router
  .route('/createSubtitles/:id')
  .get(
    validate(Validation.addSubtitles),
    accessTimeMetrics(Controller.addSubtitles, MonitoringInstance)
  )

/**
 * @api {get} /video Get all videos for this application
 * @apiName GetVideos
 * @apiGroup Video
 *
 * @apiParam {String} appid Application id which for we are getting list of videos.
 *
 * @apiSuccess {Array} data - array of videos metadata db-entries that current app has
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "data": [
 *                {
 *                  "appId": "12345ab-cd",
 *                  "filename": "video.mp4",
 *                  "id": "dASDQAdsafCBVds",
 *                  "link": "https://link.to.video.com",
 *                  "path": "appName_12345ab-cd/videos/video.mp4"
 *                }
 *              ]
 *    }
 *
 * @apiError AppIdNotFoundError - cannot find such app id registred.
 * Caused because there is no application registred in database with such appId
 *
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 422 Not Found
 *    {
 *      "data": "There is no such application registred"
 *    }
 *
 * @apiError TypeError - cannot map of undefined.
 * Caused because there is no videos metadata entries in db for this app
 *
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 404 Not Found
 *    {
 *      "data": "Cannot map of undefined"
 *    }
 */

/**
 * @api {post} /video/upload Upload video to the server
 * @apiName UploadVideo
 * @apiGroup Video
 *
 * @apiParam {String} appid Application id which for we are getting list of videos.
 * @apiParam {String} toFormat Format that we want video to be converted to
 * @apiParam {Boolean} withSubtitles Flag that indicates whether video needs to extract subtitles after convert or no
 * @apiParam {Blob} data Video blob that will be processed
 *
 * @apiSuccess {String} data - id which is used to get uploaded data from processing Storage for convert/subtitles processes
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "data": "r32feWd312214waDS"
 *    }
 *
 * @apiErrorExample Error-Response:
 *    HTTP/1.1 422 Not Found
 *    {
 *      "data": "There is no such application registred"
 *    }
 */

/**
 * @api {get} /video/convert/:id Convert video that stored in Storage by certain id
 * @apiName ConvertVideo
 * @apiGroup Video
 *
 * @apiParam {String} id Id of item in Storage where request data is stored
 *
 * @apiSuccess {Event} progress Progress of video conversion by ffmpeg
 *
 * @apiSuccessExample Success-Response:
 *    {
 *      "data": "25.5"
 *    }
 *
 * @apiSuccess {Event} link Link to converted video in cloud storage
 *
 * @apiSuccessExample Success-Response:
 *    {
 *      "data": "https://link.to.video.com"
 *    }
 *
 * @apiError {Event} error Error of video conversion by ffmpeg
 *
 * @apiErrorExample Error-Response:
 *    {
 *      "data": "Error ocurred during ffmpeg process"
 *    }
 */

/**
 * @api {get} /video/createSubtitles/:id Create subtitles to a video that was uploaded and converted
 * @apiName CreateSubtitles
 * @apiGroup Video
 *
 * @apiParam {String} id Id of item in Storage where request data is stored
 *
 * @apiSuccess {Event} progress Progress of audio extraction from video
 *
 * @apiSuccessExample Success-Response:
 *    {
 *      "data": "25.5"
 *    }
 *
 * @apiSuccess {Event} link Link to subtitles file that was created and is stored in cloud storage
 *
 * @apiSuccessExample Success-Response:
 *    {
 *      "data": "https://link.to.video.com"
 *    }
 *
 * @apiError {Event} error Error of audio extraction using ffmpeg
 *
 * @apiErrorExample Error-Response:
 *    {
 *      "data": "Error ocurred during ffmpeg process"
 *    }
 */

module.exports = router
