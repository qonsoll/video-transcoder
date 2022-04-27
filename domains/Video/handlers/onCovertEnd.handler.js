const { COLLECTIONS, FOLDERS } = require('../../../constants')
const { Storage } = require('../../ServerStorage')
const uploadSeveralPosters = require('../Service/handlers/uploadSeveralPosters')
const createGeneralVideoStatisticEntry = require('./createGeneralVideoStatisticEntry')

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

    const posterLinksAndPaths = await uploadSeveralPosters(
      file.name,
      fileService,
      appName,
      appId
    )

    // Adding metadata about video to database collection
    const newDoc = await dbService.createDocument(
      COLLECTIONS.VIDEOS,
      {
        appId,
        chapters,
        link,
        withSubtitles,
        posterLink: posterLinksAndPaths[0].link,
        posterPath: posterLinksAndPaths[0].path,
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
    // Sending video link to client and closing SSE channel
    response.write(
      `event: videoId\ndata: ${JSON.stringify({
        videoId: newDoc,
        posters: posterLinksAndPaths
      })}\n\n`
    )
    response.end()
    // Deleting files from local folders
    if (!withSubtitles) {
      await fileService.deleteFileFromFolder(FOLDERS.UPLOAD_DIRECTORY)
    }
    await fileService.deleteFileFromFolder(
      FOLDERS.RESULT_DIRECTORY,
      `${file.name}.${toFormat}`
    )
  }
}
