const { FOLDERS } = require('../../../../constants')
const { DatabaseService } = require('../../../Database')
const { Storage } = require('../../../ServerStorage')
const { FileService } = require('../../../File')
const Handlers = require('../../handlers')

const getAudio = require('./getAudio')
const clearTemporaryFiles = require('./clearTemporaryFiles')

const addSubtitles = async (id, res) => {
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
    getAudio(FOLDERS.UPLOAD_DIRECTORY, FOLDERS.RESULT_DIRECTORY, file)
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
        await clearTemporaryFiles(fileService, 'wav')
      })
  } catch (err) {
    console.log(err)
  }
}

module.exports = addSubtitles
