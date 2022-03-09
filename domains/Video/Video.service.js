const admin = require('firebase-admin')
const ffmpeg = require('fluent-ffmpeg')
const { COLLECTIONS, FOLDERS } = require('../../constants')
const { DatabaseService } = require('../Database')
const { FileService } = require('../File')
const { Storage } = require('../ServerStorage')
const { v4: uuidv4 } = require('uuid')
const Handlers = require('./handlers')
const moment = require('moment')

/**
 * This class helps to work with video. Convert to another format, extract audio from video
 * @module Video
 */

class VideoService {
  /**
   * VideoService constructor doesn't require any params to be initialized
   *
   * @constructor
   */
  constructor() {
    ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
    ffmpeg.setFfprobePath('/usr/bin/ffprobe')
    // ffmpeg.setFfmpegPath('D:\\FFMPEG\\bin\\ffmpeg.exe')
    // ffmpeg.setFfprobePath('D:\\FFMPEG\\bin\\ffprobe.exe')
  }

  async getVideos(appId) {
    const dbService = new DatabaseService()

    const dbQuery = await dbService
      .getCollectionRef(COLLECTIONS.VIDEOS)
      .where('appId', '==', appId)
      .get()
    return dbQuery.docs.map((item) => item.data())
  }

  async getVideo(appId, videoId) {
    const dbService = new DatabaseService()
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
    return responseData
  }

  async deleteVideo(appId, videoId) {
    const dbService = new DatabaseService()
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
  }

  async upload(
    appId,
    toFormat,
    withSubtitles,
    language,
    videoDuration,
    chapters,
    file
  ) {
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
    return sessionId
  }

  async convertFile(id, res) {
    // Extracting request data from storage for this session
    const storageItem = Storage.findItem(id)

    // Catching error if there is no items in storage for this session
    // and closing SSE channel
    if (storageItem instanceof Error) {
      throw storageItem
    }

    // Initializing all necessary services and constants for this endpoint
    const { toFormat, file, videoDuration } = storageItem
    const fileService = new FileService(file)
    const dbService = new DatabaseService()

    try {
      // Moving uploaded file to processing folder
      fileService.moveFileToAnotherFolder(FOLDERS.UPLOAD_DIRECTORY)
      this.getPosterImage(
        FOLDERS.UPLOAD_DIRECTORY,
        FOLDERS.POSTERS_DIRECTORY,
        file
      )
      // Converting video using request data
      this.convert(
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
          await this.clearTemporaryFiles(fileService, toFormat)
        })
    } catch (err) {
      console.log(err)
      await this.clearTemporaryFiles(fileService, toFormat)
    }
  }

  addSubtitles(id, res) {
    // Extracting request data from storage for this session
    const storageItem = Storage.findItem(id)

    // Catching error if there is no items in storage for this session
    // and closing SSE channel
    if (storageItem instanceof Error) {
      throw storageItem
    }

    // Initializing all necessary services and constants for this endpoint
    const { file, appName, appId, videoId } = storageItem
    const fileService = new FileService(file)
    const dbService = new DatabaseService()

    try {
      // Moving uploaded file to processing folder
      // fileService.moveFileToAnotherFolder(FOLDERS.UPLOAD_DIRECTORY)
      // Extracting audio from video file
      this.getAudio(FOLDERS.UPLOAD_DIRECTORY, FOLDERS.RESULT_DIRECTORY, file)
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
          await this.clearTemporaryFiles(fileService, 'wav')
        })
    } catch (err) {
      console.log(err)
    }
  }

  /**
   * This function converts video to another format and saves formatted video into local folder
   *
   * @method
   * @param {string} sourceFolderPath - path where video that will be converted is stored
   * @param {string} processedFolderPath - path where to save converted video
   * @param {Blob} file - file Blob object that will be converted
   * @param {string} to - string that represents to which format video should be converted (mp4 by default)
   * @param {string} outputOptions - some options that should be used during converting, for example:
   * choose subtitles file to add to video
   * @returns {ffmpeg.FfmpegCommand} result of ffmpeg command
   */
  convert(
    sourceFolderPath,
    processedFolderPath,
    file,
    to = 'mp4',
    onProgressListener,
    outputOptions
  ) {
    // outputOptions is unnecessary param so if we have it - we run ffmpeg command with it
    // otherwise we run ffmpeg without it
    return outputOptions
      ? ffmpeg(`${sourceFolderPath}${file.name}`)
          .withOutputFormat(to)
          .outputOptions(outputOptions)
          .saveToFile(`${processedFolderPath}${file.name}.${to}`)
      : ffmpeg(`${sourceFolderPath}${file.name}`)
          .withOutputFormat(to)
          .on('progress', onProgressListener)
          .saveToFile(`${processedFolderPath}${file.name}.${to}`)
  }

  getPosterImage(sourceFolderPath, processedFolderPath, file) {
    return ffmpeg(`${sourceFolderPath}${file.name}`).screenshots({
      timestamps: [0.5],
      filename: '%f-poster.png',
      folder: processedFolderPath
    })
  }
  /**
   * This function extract audio from video file and saves new audio file into local folder
   *
   * @method
   * @param {string} sourceFolderPath - path to folder where video is stored
   * @param {string} processedFolderPath - path where to save extracted audio file
   * @param {Blob} file - video file Blob object which audio will be extracted from
   * @returns {ffmpeg.FfmpegCommand} result of ffmpeg command
   */
  getAudio(sourceFolderPath, processedFolderPath, file) {
    return ffmpeg(`${sourceFolderPath}${file.name}`)
      .outputOptions([
        '-f s16le',
        '-acodec pcm_s16le',
        '-vn',
        '-ac 1',
        '-ar 16k',
        '-map_metadata -1'
      ])
      .saveToFile(`${processedFolderPath}${file.name}.wav`)
  }

  async clearTemporaryFiles(fileService, toFormat) {
    await fileService.deleteFileFromFolder(FOLDERS.UPLOAD_DIRECTORY)
    await fileService.deleteFileFromFolder(
      FOLDERS.RESULT_DIRECTORY,
      `${fileService.file.name}.${toFormat}`
    )
  }
}

module.exports = VideoService
