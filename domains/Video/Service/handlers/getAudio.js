const ffmpeg = require('fluent-ffmpeg')

/**
 * This function extract audio from video file and saves new audio file into local folder
 *
 * @method
 * @param {string} sourceFolderPath - path to folder where video is stored
 * @param {string} processedFolderPath - path where to save extracted audio file
 * @param {Blob} file - video file Blob object which audio will be extracted from
 * @returns {ffmpeg.FfmpegCommand} result of ffmpeg command
 */
const getAudio = (sourceFolderPath, processedFolderPath, file) => {
  ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
  ffmpeg.setFfprobePath('/usr/bin/ffprobe')

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

module.exports = getAudio
