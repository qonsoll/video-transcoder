const Service = require('../../Service')

const deleteVideo = async (req, res) => {
  const appId = req.headers.appid
  const videoId = req.params.id

  try {
    await Service.deleteVideo(appId, videoId)
    res.status(200).send({ data: 'deleted' })
  } catch (err) {
    const message = err.message
    res.status(500).send({ data: message })
  }
}

module.exports = deleteVideo
