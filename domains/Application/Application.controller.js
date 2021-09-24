const ApplicationService = require('./Application.service')

class ApplicationController {
  constructor() {}

  async create(req, res) {
    const { name } = req.body
    const applicationService = new ApplicationService()
    try {
      const appId = await applicationService.createApp(name)
      res.status(200).send({ data: { message: 'created', appId: appId } })
    } catch (err) {
      console.timeLog(err)
      res.status(400).send({ data: { message: 'error', error: err } })
    }
  }

  async delete(req, res) {
    const appId = req.params.id
    const applicationService = new ApplicationService()
    try {
      const deletedAppId = await applicationService.deleteApp(appId)
      res
        .status(200)
        .send({ data: { message: 'deleted', appId: deletedAppId } })
    } catch (err) {
      res.status(400).send({ data: { message: 'error', error: err } })
    }
  }
}

module.exports = ApplicationController
