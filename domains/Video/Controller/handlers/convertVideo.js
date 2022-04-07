const Service = require('../../Service')

/**
 * This method helps to handle video converting requests
 * @function
 */
const convertVideo = async (req, res) => {
  // Extracting session id from request params
  const id = req.params.id

  // Initializing Server-Sent-Events channel by adding headers to response object
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  })

  try {
    await Service.convertFile(id, res)
  } catch (err) {
    res.write(`event: error\ndata: ${err.message}\n\n`)
    res.end()
    return
  }
  // Listener if client closes SSE connection channel manually
  req.on('close', () => {
    res.end()
  })
}

module.exports = convertVideo
