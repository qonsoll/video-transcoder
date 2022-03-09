const VideoService = require('./Video.service')
const { FileService } = require('../File')
const { Storage } = require('../ServerStorage')
const { v4: uuidv4 } = require('uuid')
const { DatabaseService } = require('../Database')
const { COLLECTIONS, FOLDERS } = require('../../constants')
const admin = require('firebase-admin')
const Handlers = require('./handlers')
const moment = require('moment')

/**
 * This Controller helps to process requests to video domain of server.
 * @module Video
 */

class VideoController {
  /**
   * VideoController could be initialized without attributes
   * @constructor
   */
  constructor() {}

  /**
   * This method helps to upload video to server
   * @method
   */
  async upload(req, res) {
    // toFormat, withSubtitles - are required body fields
    const { toFormat, withSubtitles, language, videoDuration, chapters } =
      JSON.parse(req.body.uploadProps)
    // file - is required to be in request files array
    const file = req.files.data
    // appId - is required to be in request header
    const appId = req.headers.appid

    try {
      const videoService = new VideoService()
      const sessionId = await videoService.upload(
        appId,
        toFormat,
        withSubtitles,
        language,
        videoDuration,
        chapters,
        file
      )

      // Sending successful response
      res.status(200).send({ data: sessionId })
    } catch (err) {
      const message = err.message
      res.status(500).send({ data: message })
    }
  }

  async deleteVideo(req, res) {
    const appId = req.headers.appid
    const videoId = req.params.id

    try {
      const videoService = new VideoService()
      await videoService.deleteVideo(appId, videoId)
      res.status(200).send({ data: 'deleted' })
    } catch (err) {
      const message = err.message
      res.status(500).send({ data: message })
    }
  }

  async getVideo(req, res) {
    const appId = req.headers.appid
    const videoId = req.params.id

    try {
      const videoService = new VideoService()
      const responseData = await videoService.getVideo(appId, videoId)
      res.status(200).send({ data: responseData })
    } catch (err) {
      const message = err.message
      res.status(404).send({ data: message })
    }
  }

  async getVideos(req, res) {
    // appId - is required to be in request header
    const appId = req.headers.appid

    try {
      const videoService = new VideoService()
      const videoData = await videoService.getVideos(appId)
      res.status(200).send({ data: videoData })
    } catch (err) {
      const message = err.message
      res.status(404).send({ data: message })
    }
  }

  /**
   * This method helps to handle video converting requests
   * @method
   */
  async convert(req, res) {
    // Extracting session id from request params
    const id = req.params.id

    // Initializing Server-Sent-Events channel by adding headers to response object
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    })

    try {
      const videoService = new VideoService()
      await videoService.convertFile(id, res)
    } catch (err) {
      res.write(`event: error\ndata: ${err.message}\n\n`)
      res.end()
      return
    }
    // Listener if client closes SSE connection channel manually
    req.on('close', () => {
      res.end()
    })
  }

  /**
   * This method helps to extract audio from video, then recognize text
   * using speech-to-text API, creates subtitles file from API-call result,
   * embeds subtitles into video and uploads it to cloud storage
   * @method
   */
  async addSubtitles(req, res) {
    // Extracting session id from request params
    const id = req.params.id

    // Initializing Server-Sent-Events channel by adding headers to response object
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    })

    try {
      const videoService = new VideoService()
      await videoService.addSubtitles(id, res)
    } catch (err) {
      res.write(`event: error\ndata: ${err.message}\n\n`)
      res.end()
      return
    }
    // Listener if client closes SSE connection channel manually
    req.on('close', () => {
      res.end()
    })
  }
}

module.exports = VideoController
