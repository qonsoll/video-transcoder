const MonitoringInstance = require('./Monitoring.service')

class MonitoringController {
  constructor() {}

  health(req, res) {
    const data = {
      uptime: process.uptime(),
      message: 'ok',
      date: new Date()
    }

    res.status(200).send(data)
  }

  async metrics(req, res) {
    res.setHeader('Content-Type', MonitoringInstance.register.contentType)
    res.send(await MonitoringInstance.register.metrics())
  }
}

module.exports = MonitoringController
