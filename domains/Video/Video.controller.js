const VideoService = require('./Video.service')

class VideoController {
  constructor() {}

  convert(req, res) {
    const { toFormat, socketId } = req.body
    const file = req.files.data

    res.sendStatus(200)

    const videoService = new VideoService()
    videoService.convert(file, toFormat, socketId)
  }
}

module.exports = VideoController
