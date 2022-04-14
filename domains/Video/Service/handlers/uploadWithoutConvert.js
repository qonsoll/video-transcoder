const { FOLDERS, COLLECTIONS } = require('../../../../constants')
const { DatabaseService } = require('../../../Database')
const { FileService } = require('../../../File')
const { v4: uuidv4 } = require('uuid')
const { createGeneralVideoStatisticEntry } = require('../../handlers')
const ffmpeg = require('fluent-ffmpeg')
const getPosterImage = require('./getPosterImage')

const uploadWithoutConvert = async (
  file,
  appId,
  toFormat,
  chapters,
  withSubtitles,
  videoDuration
) => {
  // Generate unique id for this request
  const sessionId = uuidv4()
  // Changing file name to fit session id
  file.name = sessionId

  const fileService = new FileService(file)

  // Moving uploaded file to processing folder
  fileService.moveFileToAnotherFolder(FOLDERS.UPLOAD_DIRECTORY)

  const dbService = new DatabaseService()
  const appData = (
    await dbService.getDocumentRef(COLLECTIONS.APPLICATIONS, appId).get()
  ).data()
  const appName = appData.name

  ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
  ffmpeg.setFfprobePath('/usr/bin/ffprobe')
  //   ffmpeg.setFfmpegPath('D:\\FFMPEG\\bin\\ffmpeg.exe')
  //   ffmpeg.setFfprobePath('D:\\FFMPEG\\bin\\ffprobe.exe')
  getPosterImage(
    ffmpeg,
    FOLDERS.UPLOAD_DIRECTORY,
    FOLDERS.POSTERS_DIRECTORY,
    file
  )

  const link = (
    await fileService.uploadFileToStorage(
      FOLDERS.UPLOAD_DIRECTORY,
      `${file.name}`,
      {
        destination: `${appName}_${appId}/videos/${file.name}.${toFormat}`
      }
    )
  ).link

  const posterLink = (
    await fileService.uploadFileToStorage(
      FOLDERS.POSTERS_DIRECTORY,
      `${file.name}-poster.png`,
      {
        destination: `${appName}_${appId}/posters/${file.name}-poster.png`
      }
    )
  ).link

  // Adding metadata about video to database collection
  const newDoc = await dbService.createDocument(
    COLLECTIONS.VIDEOS,
    {
      appId,
      chapters,
      link,
      withSubtitles,
      posterLink,
      posterPath: `${appName}_${appId}/posters/${file.name}-poster.png`,
      path: `${appName}_${appId}/videos/${file.name}.${toFormat}`,
      filename: `${file.name}.${toFormat}`,
      format: `video/${toFormat}`
    },
    { withoutUndefOrNull: true }
  )

  await createGeneralVideoStatisticEntry(
    {
      size: null,
      duration: videoDuration,
      chapters,
      videoId: newDoc
    },
    dbService
  )

  await fileService.deleteFileFromFolder(
    FOLDERS.POSTERS_DIRECTORY,
    `${file.name}-poster.png`
  )

  await fileService.deleteFileFromFolder(FOLDERS.UPLOAD_DIRECTORY)

  return newDoc
}

module.exports = uploadWithoutConvert
