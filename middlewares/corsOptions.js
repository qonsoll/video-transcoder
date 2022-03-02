const originList = require('../constants/allowedOrigins.json')

const origins = originList.allowed_origins

// see https://www.npmjs.com/package/cors#configuring-cors
// or https://github.com/expressjs/cors#readme
const corsOptions = {
  origin: function (origin, callback) {
    if (origins.indexOf(origin) !== -1) {
      return callback(null, true)
    } else {
      return callback(new Error('Not allowed by CORS'))
    }
  },
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

module.exports = corsOptions
