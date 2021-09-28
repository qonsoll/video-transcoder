const { COLLECTIONS, FOLDERS } = require('../../../constants')

module.exports = (
  response,
  fileService,
  dbService,
  appName,
  appId,
  toFormat
) => {
  return async (stdout, stderr) => {
    // Uploading converted video to cloud storage and getting link
    const link = (
      await fileService.uploadFileToStorage(
        FOLDERS.RESULT_DIRECTORY,
        `${fileService.file.name}.${toFormat}`,
        {
          destination: `${appName}_${appId}/videos/${fileService.file.name}.${toFormat}`
        }
      )
    ).link
    // Adding metadata about video to database collection
    await dbService.createDocument(
      COLLECTIONS.VIDEOS,
      {
        appId,
        link,
        path: `${appName}_${appId}/videos/${fileService.file.name}.${toFormat}`,
        filename: `${fileService.file.name}.${toFormat}`
      },
      { withoutUndefOrNull: true }
    )
    // Sending video link to client and closing SSE channel
    response.write(`event: link\ndata: ${link}\n\n`)
    response.end()
    // Deleting files from local folders
    await fileService.deleteFileFromFolder(FOLDERS.UPLOAD_DIRECTORY)
    await fileService.deleteFileFromFolder(
      FOLDERS.RESULT_DIRECTORY,
      `${fileService.file.name}.${toFormat}`
    )
  }
}
