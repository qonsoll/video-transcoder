const { COLLECTIONS, FOLDERS } = require('../../../constants')
const { Storage } = require('../../ServerStorage')
const createGeneralVideoStatisticEntry = require('./createGeneralVideoStatisticEntry')
const addSubtitles = require('../Service/handlers/addSubtitles')

module.exports = (response, fileService, dbService, storageItem, sessionId) => {
  return async (stdout, stderr) => {
    const {
      toFormat,
      file,
      appName,
      appId,
      withSubtitles,
      chapters,
      videoDuration
    } = storageItem
    // Uploading converted video to cloud storage and getting link
    const link = (
      await fileService.uploadFileToStorage(
        FOLDERS.RESULT_DIRECTORY,
        `${file.name}.${toFormat}`,
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

    await fileService.deleteFileFromFolder(
      FOLDERS.POSTERS_DIRECTORY,
      `${file.name}-poster.png`
    )
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
    withSubtitles &&
      Storage.addItem({
        toFormat,
        file,
        sessionId,
        appName,
        appId,
        videoId: newDoc
      })

    // Sending video link to client
    response.write(`event: videoId\ndata: ${newDoc}\n\n`)

    // Deleting files from local folders
    if (!withSubtitles) {
      // closing SSE channel
      response.end()
      await fileService.deleteFileFromFolder(FOLDERS.UPLOAD_DIRECTORY)
    } else {
      await addSubtitles(sessionId, response)
    }
    await fileService.deleteFileFromFolder(
      FOLDERS.RESULT_DIRECTORY,
      `${file.name}.${toFormat}`
    )
  }
}
