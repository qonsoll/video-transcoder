const health = async (req, res) => {
  const data = {
    uptime: process.uptime(),
    message: 'ok',
    date: new Date()
  }

  await res.status(200).send(data)
}

module.exports = health
