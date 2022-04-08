/**
 * This function converts video to another format and saves formatted video into local folder
 *
 * @method
 * @param {function} ffmpeg
 * @param {string} sourceFolderPath - path where video that will be converted is stored
 * @param {string} processedFolderPath - path where to save converted video
 * @param {Blob} file - file Blob object that will be converted
 * @param {string} to - string that represents to which format video should be converted (mp4 by default)
 * @param {string} outputOptions - some options that should be used during converting, for example:
 * choose subtitles file to add to video
 * @returns {ffmpeg.FfmpegCommand} result of ffmpeg command
 */
const convert = (
  ffmpeg,
  sourceFolderPath,
  processedFolderPath,
  file,
  to = 'mp4',
  onProgressListener,
  outputOptions
) => {
  // outputOptions is unnecessary param so if we have it - we run ffmpeg command with it
  // otherwise we run ffmpeg without it
  return outputOptions
    ? ffmpeg(`${sourceFolderPath}${file.name}`)
        .withOutputFormat(to)
        .outputOptions(outputOptions)
        .saveToFile(`${processedFolderPath}${file.name}.${to}`)
    : ffmpeg(`${sourceFolderPath}${file.name}`)
        .withOutputFormat(to)
        .on('progress', onProgressListener)
        .saveToFile(`${processedFolderPath}${file.name}.${to}`)
}

module.exports = convert
