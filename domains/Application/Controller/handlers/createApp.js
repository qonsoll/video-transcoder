const Service = require('../../Service')

/**
 * This function helps to create new application
 * @function
 */
const createApp = async (req, res) => {
  const { name } = req.body
  try {
    const appId = await Service.createApp(name)
    res.status(200).send({ data: { message: 'created', appId: appId } })
  } catch (err) {
    console.timeLog(err)
    res.status(500).send({ data: { message: 'error', error: err } })
  }
}

module.exports = createApp