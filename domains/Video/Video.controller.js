const VideoService = require('./Video.service')
const { FileService } = require('../File')
const { TranscriptionService } = require('../Transcription')
const { StorageService } = require('../ServerStorage')
const { v4: uuidv4 } = require('uuid')
const { DatabaseService } = require('../Database')
const { COLLECTIONS } = require('../../constants')

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
    // toFormat - is required body field
    const { toFormat } = req.body
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
    StorageService.addItem({
      toFormat,
      file,
      sessionId,
      appName: appData.name,
      appId: appData.id
    })

    // Sending successful response
    res.status(200).send({ data: sessionId })
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
    const storageItem = StorageService.findItem(id)

    // Catching error if there is no items in storage for this session
    // and closing SSE channel
    if (storageItem instanceof Error) {
      res.write(`event: error\ndata: ${err.message}\n\n`)
      res.end()
      return
    }

    // Initializing all necessary services and constants for this endpoint
    const { toFormat, file, appName, appId } = storageItem
    const videoService = new VideoService()
    const fileService = new FileService(file)
    const UPLOAD_DIRECTORY = 'uploadBuffer/'
    const RESULT_DIRECTORY = 'transcodedVideos/'
    const dbService = new DatabaseService()

    try {
      // Moving uploaded file to processing folder
      fileService.moveFileToAnotherFolder(UPLOAD_DIRECTORY)
      // Converting video using request data
      videoService
        .convert(UPLOAD_DIRECTORY, RESULT_DIRECTORY, file, toFormat)
        // On convert progress event listener
        .on('progress', (progress) => {
          const percent = (progress.targetSize * 100) / (file.size / 1024)
          // Sending progress to client
          res.write(`event: progress\ndata: ${percent}\n\n`)
        })
        // On convert process end
        .on('end', async (stdout, stderr) => {
          // Uploading converted video to cloud storage and getting link
          const link = (
            await fileService.uploadFileToStorage(
              RESULT_DIRECTORY,
              `${file.name}.${toFormat}`,
              {
                destination: `${appName}_${appId}/videos/${file.name}.${toFormat}`
              }
            )
          ).link
          // Adding metadata about video to database collection
          await dbService.createDocument(
            COLLECTIONS.VIDEOS,
            {
              appId,
              link,
              path: `${appName}_${appId}/videos/${file.name}.${toFormat}`,
              filename: `${file.name}.${toFormat}`
            },
            { withoutUndefOrNull: true }
          )
          // Sending video link to client and closing SSE channel
          res.write(`event: link\ndata: ${link}\n\n`)
          res.end()
          // Deleting files from local folders
          await fileService.deleteFileFromFolder(UPLOAD_DIRECTORY)
          await fileService.deleteFileFromFolder(
            RESULT_DIRECTORY,
            `${file.name}.${toFormat}`
          )
        })
        // On error event listener
        .on('error', async (err) => {
          // Send client information that error occurred and close SSE channel
          res.write(`event: error\ndata: ${err.message}\n\n`)
          res.end()
          // Deleting files from local folders
          await fileService.deleteFileFromFolder(UPLOAD_DIRECTORY)
          await fileService.deleteFileFromFolder(
            RESULT_DIRECTORY,
            `${file.name}.${toFormat}`
          )
        })
    } catch (err) {
      console.log(err)
      await fileService.deleteFileFromFolder(UPLOAD_DIRECTORY)
      await fileService.deleteFileFromFolder(
        RESULT_DIRECTORY,
        `${file.name}.${toFormat}`
      )
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
    const storageItem = StorageService.findItem(id)

    // Catching error if there is no items in storage for this session
    // and closing SSE channel
    if (storageItem instanceof Error) {
      res.write(`event: error\ndata: ${err.message}\n\n`)
      res.end()
      return
    }

    // Initializing all necessary services and constants for this endpoint
    const { toFormat, file, appName, appId } = storageItem
    const videoService = new VideoService()
    const fileService = new FileService(file)
    const dbService = new DatabaseService()
    const UPLOAD_DIRECTORY = 'uploadBuffer/'
    const RESULT_DIRECTORY = 'transcodedVideos/'
    // const SUBTITLES_OPTIONS = `-vf subtitles=./transcriptions/${file.name}.srt`

    try {
      // Moving uploaded file to processing folder
      fileService.moveFileToAnotherFolder(UPLOAD_DIRECTORY)
      // Extracting audio from video file
      videoService
        .getAudio(UPLOAD_DIRECTORY, RESULT_DIRECTORY, file)
        // On convert progress event listener
        .on('progress', (progress) => {
          const percent = (progress.targetSize * 100) / (file.size / 1024)
          // Sending progress to client
          res.write(`event: progress\ndata: ${percent}\n\n`)
        })
        // On audio extraction process end
        .on('end', async (stdout, stderr) => {
          // Upload audio file to cloud storage
          const audioFile = await fileService.uploadFileToStorage(
            RESULT_DIRECTORY,
            `${file.name}.wav`,
            {
              destination: `${appName}_${appId}/audios/${file.name}.wav`
            }
          )
          // Deleting audio file from local folder
          await fileService.deleteFileFromFolder(UPLOAD_DIRECTORY)
          await fileService.deleteFileFromFolder(
            RESULT_DIRECTORY,
            `${file.name}.wav`
          )
          // Initialization of transcription service
          const transcriptionService = new TranscriptionService(
            audioFile.gcsUri
          )
          // Speech-to-text API call
          const transcription =
            await transcriptionService.shortVideoSpeechRecognize()
          // Creation of subtitles from API-call result
          transcriptionService.createSubtitlesFile(
            transcription,
            `${file.name}.srt`
          )
          // Uploading subtitles file to cloud storage
          const subtitlesLink = (
            await fileService.uploadFileToStorage(
              'transcriptions/',
              `${file.name}.srt`,
              {
                destination: `${appName}_${appId}/subtitles/${file.name}.srt`
              }
            )
          ).link
          // creating db document with subtitles metadata
          await dbService.createDocument(
            COLLECTIONS.SUBTITLES,
            {
              appId,
              link: subtitlesLink,
              filename: `${file.name}.srt`,
              path: `${appName}_${appId}/subtitles/${file.name}.srt`
            },
            { withoutUndefOrNull: true }
          )
          // Sending file link and closing sse channel
          res.write(`event: link\ndata: ${subtitlesLink}\n\n`)
          res.end()
          // Deleting unnecessary files
          await fileService.deleteFileFromStorage(
            `${appName}_${appId}/audios/${file.name}.wav`
          )
          await fileService.deleteFileFromFolder(
            `transcriptions/`,
            `${file.name}.srt`
          )
        })
        // On error listener
        .on('error', async (err) => {
          // Sending info to user that error occurred and closing SSE channel
          res.write(`event: error\ndata: ${err.message}\n\n`)
          res.end()
          // Deleting files from local folders
          await fileService.deleteFileFromFolder(UPLOAD_DIRECTORY)
          await fileService.deleteFileFromFolder(
            RESULT_DIRECTORY,
            `${file.name}.wav`
          )
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
