const ffmpeg = require('fluent-ffmpeg')
const moment = require('moment')

const { FOLDERS } = require('../../../../constants')
const { DatabaseService } = require('../../../Database')
const { Storage } = require('../../../ServerStorage')
const { FileService } = require('../../../File')
const Handlers = require('../../handlers')

const getPosterImage = require('./getPosterImage')
const convert = require('./convert')
const clearTemporaryFiles = require('./clearTemporaryFiles')

const convertFile = async (id, res) => {
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
    // ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
    // ffmpeg.setFfprobePath('/usr/bin/ffprobe')
    ffmpeg.setFfmpegPath('D:\\FFMPEG\\bin\\ffmpeg.exe')
    ffmpeg.setFfprobePath('D:\\FFMPEG\\bin\\ffprobe.exe')

    // Moving uploaded file to processing folder
    fileService.moveFileToAnotherFolder(FOLDERS.UPLOAD_DIRECTORY)
    getPosterImage(
      ffmpeg,
      FOLDERS.UPLOAD_DIRECTORY,
      FOLDERS.POSTERS_DIRECTORY,
      file
    )
    // Converting video using request data
    convert(
      ffmpeg,
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
      },
      '-force_key_frames expr:gte(t,n_forced*1)'
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
        await clearTemporaryFiles(fileService, toFormat)
      })
  } catch (err) {
    console.log(err)
    await clearTemporaryFiles(fileService, toFormat)
  }
}

module.exports = convertFile
