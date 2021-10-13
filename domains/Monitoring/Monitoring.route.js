const express = require('express')
const MonitoringController = require('./Monitoring.controller')
const { accessTimeMetrics } = require('../../middlewares')

const router = express.Router()
const Controller = new MonitoringController()

// router.route('/health').get(accessTimeMetrics(Controller.health))

// router.route('/metrics').get(accessTimeMetrics(Controller.metrics))

module.exports = router
