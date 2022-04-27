const getSeveralPosters = (
  ffmpeg,
  sourceFolderPath,
  processedFolderPath,
  file,
  videoDuration
) => {
  const posterTimemarks = [
    videoDuration * 0.25,
    videoDuration * 0.5,
    videoDuration * 0.75
  ]
  return ffmpeg(`${sourceFolderPath}${file.name}`).screenshots({
    timestamps: posterTimemarks,
    filename: '%f-poster-%i.png',
    folder: processedFolderPath
  })
}

module.exports = getSeveralPosters
