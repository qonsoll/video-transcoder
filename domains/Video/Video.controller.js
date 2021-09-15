const VideoService = require('./Video.service')
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

  convert(req, res) {
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    })

    const id = req.params.id

    const videoService = new VideoService()
    try {
      const { file, toFormat, sessionId } = StorageService.findItem(id)
      videoService.convert(file, toFormat, res)
    } catch (err) {
      res.write(`event: error\ndata: ${err.message}\n\n`)
      res.end()
    }
    req.on('close', () => {
      res.end()
    })
  }
}

module.exports = VideoController
