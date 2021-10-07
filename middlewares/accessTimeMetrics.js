const { MonitoringInstance } = require('../domains/Monitoring')

module.exports = (controllerMethod) => {
  return async (req, res) => {
    // Start the HTTP request timer, saving a reference to the returned method
    const end = MonitoringInstance.httpRequestTimer.startTimer()
    // Save reference to the path so we can record it when ending the timer
    const route = req.route.path

    await controllerMethod(req, res)

    // End timer and add labels
    end({ route, code: res.statusCode, method: req.method })
  }
}
