const express = require('express')
const MonitoringController = require('./Monitoring.controller')
const MonitoringInstance = require('./Monitoring.service')
const { accessTimeMetrics } = require('../../middlewares')

const router = express.Router()
const Controller = new MonitoringController()

router
  .route('/health')
  .get(accessTimeMetrics(Controller.health, MonitoringInstance))

router
  .route('/metrics')
  .get(accessTimeMetrics(Controller.metrics, MonitoringInstance))

module.exports = router
