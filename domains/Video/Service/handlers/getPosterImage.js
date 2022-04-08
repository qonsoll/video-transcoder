const getPosterImage = (
  ffmpeg,
  sourceFolderPath,
  processedFolderPath,
  file
) => {
  return ffmpeg(`${sourceFolderPath}${file.name}`).screenshots({
    timestamps: [0.5],
    filename: '%f-poster.png',
    folder: processedFolderPath
  })
}

module.exports = getPosterImage
