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
    // Start the HTTP request timer, saving a reference to the returned method
    const end = httpRequestTimer.startTimer()
    // Save reference to the path so we can record it when ending the timer
    const route = req.route.path

    res.setHeader('Content-Type', MonitoringInstance.register.contentType)
    res.send(await MonitoringInstance.register.metrics())

    // End timer and add labels
    end({ route, code: res.statusCode, method: req.method })
  }
}

module.exports = MonitoringController
