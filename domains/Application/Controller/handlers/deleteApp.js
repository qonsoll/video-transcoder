const Service = require('../../Service')

/**
 * This function helps to delete existing application
 * @function
 */
const deleteApp = async (req, res) => {
  const appId = req.params.id
  try {
    const deletedAppId = await Service.deleteApp(appId)
    res.status(200).send({ data: { message: 'deleted', appId: deletedAppId } })
  } catch (err) {
    res.status(500).send({ data: { message: 'error', error: err } })
  }
}

module.exports = deleteApp
