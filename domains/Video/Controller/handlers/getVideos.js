const Service = require('../../Service')

const getVideos = async (req, res) => {
  // appId - is required to be in request header
  const appId = req.headers.appid

  try {
    const videoData = await Service.getVideos(appId)
    res.status(200).send({ data: videoData })
  } catch (err) {
    const message = err.message
    res.status(404).send({ data: message })
  }
}

module.exports = getVideos
