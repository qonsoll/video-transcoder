const express = require('express')
const Controller = require('../Controller')
const { accessTimeMetrics } = require('../../../middlewares')
const MonitoringInstance = require('../Service')

const router = express.Router()
// const Controller = new MonitoringController()

router
  .route('/health')
  .get(accessTimeMetrics(Controller.health, MonitoringInstance))

router
  .route('/metrics')
  .get(accessTimeMetrics(Controller.metrics, MonitoringInstance))

module.exports = router
