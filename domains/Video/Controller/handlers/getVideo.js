const Service = require('../../Service')

const getVideo = async (req, res) => {
  const appId = req.headers.appid
  const videoId = req.params.id

  try {
    const responseData = await Service.getVideo(appId, videoId)
    res.status(200).send({ data: responseData })
  } catch (err) {
    const message = err.message
    res.status(404).send({ data: message })
  }
}

module.exports = getVideo
