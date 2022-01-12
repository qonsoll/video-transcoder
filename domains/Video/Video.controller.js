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
    const dbService = new DatabaseService()

    const appData = (
      await dbService.getDocumentRef(COLLECTIONS.APPLICATIONS, appId).get()
    ).data()
    // Generate unique id for this request
    const sessionId = uuidv4()
    // Changing file name to fit session id
    file.name = sessionId
    // Adding request data to server storage to process it further
    Storage.addItem({
      toFormat,
      file,
      sessionId,
      withSubtitles,
      language,
      videoDuration,
      chapters,
      appName: appData.name,
      appId: appData.id
    })

    // Sending successful response
    res.status(200).send({ data: sessionId })
  }

  async deleteVideo(req, res) {
    const dbService = new DatabaseService()
    const videoId = req.params.id

    try {
      const fileData = await dbService
        .getDocumentRef(COLLECTIONS.VIDEOS, videoId)
        .get()
      const filePath = fileData.data().path
      const posterPath = fileData.data().posterPath
      // Video file delete from storage
      await admin.storage().bucket().file(filePath).delete()
      // Poster file delete from storage
      await admin.storage().bucket().file(posterPath).delete()
      // Video metadata document delete from firestore
      await dbService.deleteDocument(COLLECTIONS.VIDEOS, videoId)
      // Video statistics delete from firestore
      const videoStatisticQuery = await dbService
        .getCollectionRef(COLLECTIONS.VIDEO_STATISTICS)
        .where('videoInfo.videoId', '==', videoId)
        .get()
      const videoStatisticId = videoStatisticQuery.docs.map(
        (doc) => doc.data().id
      )[0]
      await dbService.deleteDocument(
        COLLECTIONS.VIDEO_STATISTICS,
        videoStatisticId
      )
      res.status(200).send({ data: 'deleted' })
    } catch (err) {
      res.status(501).send({ data: err.message })
    }
  }

  async getVideo(req, res) {
    const appId = req.headers.appid
    const dbService = new DatabaseService()
    const videoId = req.params.id

    try {
      const getVideoQuery = await dbService
        .getDocumentRef(COLLECTIONS.VIDEOS, videoId)
        .get()
      const videoData = getVideoQuery.data()
      const responseData = {
        link: videoData.link,
        format: videoData.format,
        withSubtitles: videoData.withSubtitles
      }
      if (videoData.withSubtitles) {
        const getSubtitlesQuery = await dbService
          .getCollectionRef(COLLECTIONS.SUBTITLES)
          .where('videoId', '==', videoId)
          .get()
        const subtitlesData = getSubtitlesQuery.docs.map((item) => ({
          link: item.data().link,
          language: item.data().language,
          languageLabel: item.data().languageLabel
        }))
        responseData.subtitles = subtitlesData
      }
      res.status(200).send({ data: responseData })
    } catch (err) {
      res.status(404).send({ data: err.message })
    }
  }

  async getVideos(req, res) {
    // appId - is required to be in request header
    const appId = req.headers.appid
    const dbService = new DatabaseService()

    try {
      const dbQuery = await dbService
        .getCollectionRef(COLLECTIONS.VIDEOS)
        .where('appId', '==', appId)
        .get()
      const videoData = dbQuery.docs.map((item) => item.data())
      res.status(200).send({ data: videoData })
    } catch (err) {
      res.status(404).send({ data: err.message })
    }
  }

  /**
   * This method helps to handle video converting requests
   * @method
   */
  async convert(req, res) {
    // Initializing Server-Sent-Events channel by adding headers to response object
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    })

    // Extracting session id from request params
    const id = req.params.id

    // Extracting request data from storage for this session
    const storageItem = Storage.findItem(id)

    // Catching error if there is no items in storage for this session
    // and closing SSE channel
    if (storageItem instanceof Error) {
      res.write(`event: error\ndata: ${err.message}\n\n`)
      res.end()
      return
    }

    // Initializing all necessary services and constants for this endpoint
    const { toFormat, file, videoDuration } = storageItem
    const videoService = new VideoService()
    const fileService = new FileService(file)
    const dbService = new DatabaseService()

    try {
      // Moving uploaded file to processing folder
      fileService.moveFileToAnotherFolder(FOLDERS.UPLOAD_DIRECTORY)
      videoService.getPosterImage(
        FOLDERS.UPLOAD_DIRECTORY,
        FOLDERS.POSTERS_DIRECTORY,
        file
      )
      // Converting video using request data
      videoService
        .convert(
          FOLDERS.UPLOAD_DIRECTORY,
          FOLDERS.RESULT_DIRECTORY,
          file,
          toFormat,
          (progress) => {
            const percent =
              (moment.duration(progress.timemark).asSeconds() * 100) /
              Number.parseInt(videoDuration)
            // Sending progress to client
            res.write(`event: progress\ndata: ${percent}\n\n`)
          }
        )
        // On convert process end
        .on(
          'end',
          Handlers.onConvertEndHandler(
            res,
            fileService,
            dbService,
            storageItem,
            id
          )
        )
        // On error event listener
        .on('error', async (err) => {
          // Send client information that error occurred and close SSE channel
          res.write(`event: error\ndata: ${err.message}\n\n`)
          res.end()
          // Deleting files from local folders
          await videoService.clearTemporaryFiles(fileService, toFormat)
        })
    } catch (err) {
      console.log(err)
      await videoService.clearTemporaryFiles(fileService, toFormat)
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
  addSubtitles(req, res) {
    // Initializing Server-Sent-Events channel by adding headers to response object
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    })

    // Extracting session id from request params
    const id = req.params.id

    // Extracting request data from storage for this session
    const storageItem = Storage.findItem(id)

    // Catching error if there is no items in storage for this session
    // and closing SSE channel
    if (storageItem instanceof Error) {
      res.write(`event: error\ndata: ${err.message}\n\n`)
      res.end()
      return
    }

    // Initializing all necessary services and constants for this endpoint
    const { file, appName, appId, videoId } = storageItem
    const videoService = new VideoService()
    const fileService = new FileService(file)
    const dbService = new DatabaseService()

    try {
      // Moving uploaded file to processing folder
      // fileService.moveFileToAnotherFolder(FOLDERS.UPLOAD_DIRECTORY)
      // Extracting audio from video file
      videoService
        .getAudio(FOLDERS.UPLOAD_DIRECTORY, FOLDERS.RESULT_DIRECTORY, file)
        // On convert progress event listener
        .on('progress', (progress) => {
          const percent = (progress.targetSize * 100) / (file.size / 1024)
          // Sending progress to client
          res.write(`event: progress\ndata: ${percent}\n\n`)
        })
        // On audio extraction process end
        .on(
          'end',
          Handlers.onSubtitlesCreationEndHandler(
            res,
            fileService,
            dbService,
            appName,
            appId,
            videoId
          )
        )
        // On error listener
        .on('error', async (err) => {
          // Sending info to user that error occurred and closing SSE channel
          res.write(`event: error\ndata: ${err.message}\n\n`)
          res.end()
          // Deleting files from local folders
          await videoService.clearTemporaryFiles(fileService, 'wav')
        })
    } catch (err) {
      console.log(err)
    }

    // Listener if client closes SSE connection channel manually
    req.on('close', () => {
      res.end()
    })
  }
}

module.exports = VideoController
