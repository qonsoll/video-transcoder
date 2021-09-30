const { COLLECTIONS, FOLDERS } = require('../../../constants')
const { TranscriptionService } = require('../../Transcription')

module.exports = (
  response,
  fileService,
  dbService,
  appName,
  appId,
  videoId
) => {
  return async (stdout, stderr) => {
    // Upload audio file to cloud storage
    const audioFile = await fileService.uploadFileToStorage(
      FOLDERS.RESULT_DIRECTORY,
      `${fileService.file.name}.wav`,
      {
        destination: `${appName}_${appId}/audios/${fileService.file.name}.wav`
      }
    )
    // Deleting audio file from local folder
    await fileService.deleteFileFromFolder(FOLDERS.UPLOAD_DIRECTORY)
    await fileService.deleteFileFromFolder(
      FOLDERS.RESULT_DIRECTORY,
      `${fileService.file.name}.wav`
    )
    // Initialization of transcription service
    const transcriptionService = new TranscriptionService(audioFile.gcsUri)
    // Speech-to-text API call
    const transcription = await transcriptionService.shortVideoSpeechRecognize()
    // Creation of subtitles from API-call result
    transcriptionService.createSubtitlesFile(
      transcription,
      `${fileService.file.name}.vtt`
    )
    // Uploading subtitles file to cloud storage
    const subtitlesLink = (
      await fileService.uploadFileToStorage(
        FOLDERS.TRANSCRIPTIONS_DIRECTORY,
        `${fileService.file.name}.vtt`,
        {
          destination: `${appName}_${appId}/subtitles/${fileService.file.name}.vtt`
        }
      )
    ).link
    // creating db document with subtitles metadata
    await dbService.createDocument(
      COLLECTIONS.SUBTITLES,
      {
        videoId,
        appId,
        link: subtitlesLink,
        filename: `${fileService.file.name}.vtt`,
        path: `${appName}_${appId}/subtitles/${fileService.file.name}.vtt`
      },
      { withoutUndefOrNull: true }
    )
    // Sending file link and closing sse channel
    response.write(`event: link\ndata: ${subtitlesLink}\n\n`)
    response.end()
    // Deleting unnecessary files
    await fileService.deleteFileFromStorage(
      `${appName}_${appId}/audios/${fileService.file.name}.wav`
    )
    await fileService.deleteFileFromFolder(
      FOLDERS.TRANSCRIPTIONS_DIRECTORY,
      `${fileService.file.name}.vtt`
    )
  }
}
