const Service = require('../../Service')

/**
 * This method helps to upload video to server
 * @function
 */
const uploadVideo = async (req, res) => {
  // toFormat, withSubtitles - are required body fields
  const { toFormat, withSubtitles, language, videoDuration, chapters } =
    JSON.parse(req.body.uploadProps)
  // file - is required to be in request files array
  const file = req.files.data
  // appId - is required to be in request header
  const appId = req.headers.appid

  try {
    const sessionId = await Service.uploadVideo(
      appId,
      toFormat,
      withSubtitles,
      language,
      videoDuration,
      chapters,
      file
    )

    // Sending successful response
    res.status(200).send({ data: sessionId })
  } catch (err) {
    const message = err.message
    res.status(500).send({ data: message })
  }
}

module.exports = uploadVideo
