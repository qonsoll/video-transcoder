const { FOLDERS } = require('../../../../constants')

const clearTemporaryFiles = async (fileService, toFormat) => {
  await fileService.deleteFileFromFolder(FOLDERS.UPLOAD_DIRECTORY)
  await fileService.deleteFileFromFolder(
    FOLDERS.RESULT_DIRECTORY,
    `${fileService.file.name}.${toFormat}`
  )
}

module.exports = clearTemporaryFiles
