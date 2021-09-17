const ffmpeg = require('fluent-ffmpeg')
/**
 * This class helps to work with Atoms. Create, update, read, delete them
 * @module Video
 */

class VideoService {
  constructor() {
    // ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
    // ffmpeg.setFfprobePath('/usr/bin/ffprobe')
    ffmpeg.setFfmpegPath('D:\\FFMPEG\\bin\\ffmpeg.exe')
    ffmpeg.setFfprobePath('D:\\FFMPEG\\bin')
  }

  convert(sourceFolderPath, processedFolderPath, file, to = 'mp4') {
    return ffmpeg(`${sourceFolderPath}${file.name}`)
      .withOutputFormat(to)
      .saveToFile(`${processedFolderPath}${file.name}.${to}`)
  }
}

module.exports = VideoService
