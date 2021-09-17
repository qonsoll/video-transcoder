const VideoService = require('./Video.service')
const { FileService } = require('../File')
const { StorageService } = require('../ServerStorage')

class VideoController {
  constructor() {}

  upload(req, res) {
    const { toFormat, sessionId } = req.body
    const file = req.files.data
    file.name = sessionId
    StorageService.addItem({ toFormat, sessionId, file })

    res.sendStatus(200)
  }

  // extractAudion(req, res) {
  //   const { toFormat, sessionId } = req.body
  //   const file = req.files.data
  //   file.name = sessionId
  // }

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

    const { toFormat, sessionId, file } = storageItem
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
          const link = await fileService.uploadFileToStorage(
            RESULT_DIRECTORY,
            `${file.name}.${toFormat}`
          )
          res.write(`event: link\ndata: ${link}\n\n`)
          res.end()
        })
        .on('error', async (err) => {
          res.write(`event: error\ndata: ${err.message}\n\n`)
          res.end()
        })
    } catch (err) {
      console.log(err)
    } finally {
      fileService.deleteFileFromFolder(UPLOAD_DIRECTORY)
      fileService.deleteFileFromFolder(
        RESULT_DIRECTORY,
        `${file.name}.${toFormat}`
      )
    }
    req.on('close', () => {
      res.end()
    })
  }
}

module.exports = VideoController
