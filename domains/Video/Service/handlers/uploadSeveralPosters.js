const { FOLDERS } = require('../../../../constants')

const uploadSeveralPosters = async (
  videoFileName,
  fileService,
  appName,
  appId
) => {
  const posterFileNames = [
    `${videoFileName}-poster-1.png`,
    `${videoFileName}-poster-2.png`,
    `${videoFileName}-poster-3.png`
  ]

  const postersUploadPromises = await Promise.allSettled(
    posterFileNames.map((posterName) =>
      fileService.uploadFileToStorage(FOLDERS.POSTERS_DIRECTORY, posterName, {
        destination: `${appName}_${appId}/posters/${posterName}`
      })
    )
  )

  const posterLinksAndPathsArray = []
  postersUploadPromises.forEach(({ value }, index) => {
    posterLinksAndPathsArray.push({
      link: value.link,
      path: `${appName}_${appId}/posters/${posterFileNames[index]}`
    })
  })

  const postersDeletePromises = await Promise.allSettled(
    posterFileNames.map((posterName) =>
      fileService.deleteFileFromFolder(FOLDERS.POSTERS_DIRECTORY, posterName)
    )
  )

  return posterLinksAndPathsArray
}

module.exports = uploadSeveralPosters
