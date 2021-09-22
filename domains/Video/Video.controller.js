const VideoService = require('./Video.service')
const { FileService } = require('../File')
const { TranscriptionService } = require('../Transcription')
const { StorageService } = require('../ServerStorage')
const { v4: uuidv4 } = require('uuid')

class VideoController {
  constructor() {}

  upload(req, res) {
    const { toFormat } = req.body
    const file = req.files.data
    const sessionId = uuidv4()

    file.name = sessionId
    StorageService.addItem({ toFormat, sessionId, file })

    res.status(200).send({ data: sessionId })
  }

  async convert(req, res) {
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    })

    const id = req.params.id

    const storageItem = StorageService.findItem(id)

    if (storageItem instanceof Error) {
      res.write(`event: error\ndata: ${err.message}\n\n`)
      res.end()
      return
    }

    const { toFormat, file } = storageItem
    const videoService = new VideoService()
    const fileService = new FileService(file)
    const UPLOAD_DIRECTORY = 'uploadBuffer/'
    const RESULT_DIRECTORY = 'transcodedVideos/'

    try {
      fileService.moveFileToAnotherFolder(UPLOAD_DIRECTORY)
      videoService
        .convert(UPLOAD_DIRECTORY, RESULT_DIRECTORY, file, toFormat)
        .on('progress', (progress) => {
          const percent = (progress.targetSize * 100) / (file.size / 1024)
          res.write(`event: progress\ndata: ${percent}\n\n`)
        })
        .on('end', async (stdout, stderr) => {
          const link = (
            await fileService.uploadFileToStorage(
              RESULT_DIRECTORY,
              `${file.name}.${toFormat}`
            )
          ).link
          res.write(`event: link\ndata: ${link}\n\n`)
          res.end()
          await fileService.deleteFileFromFolder(UPLOAD_DIRECTORY)
          await fileService.deleteFileFromFolder(
            RESULT_DIRECTORY,
            `${file.name}.${toFormat}`
          )
        })
        .on('error', async (err) => {
          res.write(`event: error\ndata: ${err.message}\n\n`)
          res.end()
          await fileService.deleteFileFromFolder(UPLOAD_DIRECTORY)
          await fileService.deleteFileFromFolder(
            RESULT_DIRECTORY,
            `${file.name}.${toFormat}`
          )
        })
    } catch (err) {
      console.log(err)
    }
    req.on('close', () => {
      res.end()
    })
  }

  addSubtitles(req, res) {
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    })

    const id = req.params.id

    const storageItem = StorageService.findItem(id)

    if (storageItem instanceof Error) {
      res.write(`event: error\ndata: ${err.message}\n\n`)
      res.end()
      return
    }

    const { toFormat, file } = storageItem
    const videoService = new VideoService()
    const fileService = new FileService(file)
    const UPLOAD_DIRECTORY = 'uploadBuffer/'
    const RESULT_DIRECTORY = 'transcodedVideos/'
    const SUBTITLES_OPTIONS = `-vf subtitles=./transcriptions/${file.name}.srt`

    try {
      fileService.moveFileToAnotherFolder(UPLOAD_DIRECTORY)
      videoService
        .getAudio(UPLOAD_DIRECTORY, RESULT_DIRECTORY, file)
        .on('progress', (progress) => {
          const percent = (progress.targetSize * 100) / (file.size / 1024)
          res.write(`event: progress\ndata: ${percent}\n\n`)
        })
        .on('end', async (stdout, stderr) => {
          const audioFile = await fileService.uploadFileToStorage(
            RESULT_DIRECTORY,
            `${file.name}.wav`
          )
          await fileService.deleteFileFromFolder(
            RESULT_DIRECTORY,
            `${file.name}.wav`
          )
          const transcriptionService = new TranscriptionService(
            audioFile.gcsUri
          )
          const transcription =
            await transcriptionService.shortVideoSpeechRecognize()
          transcriptionService.createSubtitlesFile(
            transcription,
            `${file.name}.srt`
          )
          videoService
            .convert(
              UPLOAD_DIRECTORY,
              RESULT_DIRECTORY,
              file,
              toFormat,
              SUBTITLES_OPTIONS
            )
            .on('end', async () => {
              const link = await fileService.uploadFileToStorage(
                RESULT_DIRECTORY,
                `${file.name}.${toFormat}`
              )
              res.write(`event: link\ndata: ${link.link}\n\n`)
              res.end()
              await fileService.deleteFileFromFolder(UPLOAD_DIRECTORY)
              await fileService.deleteFileFromFolder(
                'transcriptions/',
                `${file.name}.srt`
              )
              await fileService.deleteFileFromFolder(
                RESULT_DIRECTORY,
                `${file.name}.${toFormat}`
              )
            })
        })
        .on('error', async (err) => {
          res.write(`event: error\ndata: ${err.message}\n\n`)
          res.end()
          await fileService.deleteFileFromFolder(UPLOAD_DIRECTORY)
          await fileService.deleteFileFromFolder(
            RESULT_DIRECTORY,
            `${file.name}.wav`
          )
        })
    } catch (err) {
      console.log(err)
    }
    req.on('close', () => {
      res.end()
    })
  }
}

module.exports = VideoController
