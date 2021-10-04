const express = require('express')
const MonitoringController = require('./Monitoring.controller')

const router = express.Router()
const Controller = new MonitoringController()

router.route('/health').get(Controller.health)

router.route('/metrics').get(Controller.metrics)
