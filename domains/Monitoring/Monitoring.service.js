const client = require('prom-client')

/**
 * This Class helps to configure monitoring services.
 * @module Monitoring
 */

class MonitoringService {
  /**
   * MonitoringService should be initialized with Prometheus client Registry
   *
   * @constructor
   * @param {client.Registry} promClient - Prometheus client Registry
   */
  constructor(promClient) {
    this.register = promClient
    client.collectDefaultMetrics({
      app: 'video-transcoder-monitoring',
      prefix: 'node_',
      timeout: 10000,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
      promClient
    })
    this.httpRequestTimer = this.createHistogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // 0.1 to 10 seconds
    })
    this.registerHistogram(this.httpRequestTimer)
  }

  /**
   * This function is used to create histogram template for Prometheus metrics library
   *
   * @param {object} paramsObj - Object with params to initialize Histogram template
   *                             for all params list check Prometheus docs
   * @returns {client.Histogram<string>} histogram template that will be used by Prometheus library
   */
  createHistogram(paramsObj) {
    return new client.Histogram(paramsObj)
  }

  /**
   * This function is used to attach histogram template to Prometheus client to collect metrics
   *
   * @param {client.Histogram<string>} histogram - histogram template that will be attached to Prometheus client
   */
  registerHistogram(histogram) {
    this.register.registerMetric(histogram)
  }
}

const MonitoringInstance = new MonitoringService(new client.Registry())

module.exports = MonitoringInstance
