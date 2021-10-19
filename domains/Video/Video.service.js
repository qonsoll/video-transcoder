const ffmpeg = require('fluent-ffmpeg')
const { FOLDERS } = require('../../constants')
/**
 * This class helps to work with video. Convert to another format, extract audio from video
 * @module Video
 */

class VideoService {
  /**
   * VideoService constructor doesn't require any params to be initialized
   *
   * @constructor
   */
  constructor() {
    ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
    ffmpeg.setFfprobePath('/usr/bin/ffprobe')
    // ffmpeg.setFfmpegPath('D:\\FFMPEG\\bin\\ffmpeg.exe')
    // ffmpeg.setFfprobePath('D:\\FFMPEG\\bin')
  }

  /**
   * This function converts video to another format and saves formatted video into local folder
   *
   * @method
   * @param {string} sourceFolderPath - path where video that will be converted is stored
   * @param {string} processedFolderPath - path where to save converted video
   * @param {Blob} file - file Blob object that will be converted
   * @param {string} to - string that represents to which format video should be converted (mp4 by default)
   * @param {string} outputOptions - some options that should be used during converting, for example:
   * choose subtitles file to add to video
   * @returns {ffmpeg.FfmpegCommand} result of ffmpeg command
   */
  convert(
    sourceFolderPath,
    processedFolderPath,
    file,
    to = 'mp4',
    outputOptions
  ) {
    // outputOptions is unnecessary param so if we have it - we run ffmpeg command with it
    // otherwise we run ffmpeg without it
    return outputOptions
      ? ffmpeg(`${sourceFolderPath}${file.name}`)
          .withOutputFormat(to)
          .outputOptions(outputOptions)
          .saveToFile(`${processedFolderPath}${file.name}.${to}`)
      : ffmpeg(`${sourceFolderPath}${file.name}`)
          .withOutputFormat(to)
          .saveToFile(`${processedFolderPath}${file.name}.${to}`)
  }

  /**
   * This function extract audio from video file and saves new audio file into local folder
   *
   * @method
   * @param {string} sourceFolderPath - path to folder where video is stored
   * @param {string} processedFolderPath - path where to save extracted audio file
   * @param {Blob} file - video file Blob object which audio will be extracted from
   * @returns {ffmpeg.FfmpegCommand} result of ffmpeg command
   */
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

  async clearTemporaryFiles(fileService, toFormat) {
    await fileService.deleteFileFromFolder(FOLDERS.UPLOAD_DIRECTORY)
    await fileService.deleteFileFromFolder(
      FOLDERS.RESULT_DIRECTORY,
      `${fileService.file.name}.${toFormat}`
    )
  }
}

module.exports = VideoService
