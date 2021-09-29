const { COLLECTIONS, FOLDERS } = require('../../../constants')
const { Storage } = require('../../ServerStorage')

module.exports = (response, fileService, dbService, storageItem, sessionId) => {
  return async (stdout, stderr) => {
    const { toFormat, file, appName, appId, withSubtitles } = storageItem
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
    // Adding metadata about video to database collection
    const newDoc = await dbService.createDocument(
      COLLECTIONS.VIDEOS,
      {
        appId,
        link,
        path: `${appName}_${appId}/videos/${file.name}.${toFormat}`,
        filename: `${file.name}.${toFormat}`
      },
      { withoutUndefOrNull: true }
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
    response.write(`event: link\ndata: ${link}\n\n`)
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
