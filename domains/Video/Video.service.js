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

  convert(
    sourceFolderPath,
    processedFolderPath,
    file,
    to = 'mp4',
    outputOptions
  ) {
    return outputOptions
      ? ffmpeg(`${sourceFolderPath}${file.name}`)
          .withOutputFormat(to)
          .outputOptions(outputOptions)
          .saveToFile(`${processedFolderPath}${file.name}.${to}`)
      : ffmpeg(`${sourceFolderPath}${file.name}`)
          .withOutputFormat(to)
          .saveToFile(`${processedFolderPath}${file.name}.${to}`)
  }

  getAudio(sourceFolderPath, processedFolderPath, file) {
    return ffmpeg(`${sourceFolderPath}${file.name}`)
      .outputOptions([
        '-f s16le',
        '-acodec pcm_s16le',
        '-vn',
        '-ac 1',
        '-ar 16k',
        '-map_metadata -1'
      ])
      .saveToFile(`${processedFolderPath}${file.name}.wav`)
  }
}

module.exports = VideoService
