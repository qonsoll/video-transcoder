const MonitoringInstance = require('../../Service/Monitoring.service')

const metrics = async (req, res) => {
  res.setHeader('Content-Type', MonitoringInstance.register.contentType)
  res.send(await MonitoringInstance.register.metrics())
}

module.exports = metrics
