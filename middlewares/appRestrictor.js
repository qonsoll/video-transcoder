const { DatabaseService } = require('../domains/Database')
const { COLLECTIONS } = require('../constants')
const { isUndefined } = require('lodash')

module.exports = async (req, res, next) => {
  if (req.headers.accept !== 'text/event-stream') {
    const appId = req.headers.appid
    if (appId === 'undefined') {
      return res
        .status(403)
        .send({ message: 'You have no access to this application' })
    } else {
      const database = new DatabaseService()
      try {
        await database.getDocumentRef(COLLECTIONS.APPLICATIONS, appId).get()
        return next()
      } catch (err) {
        return res
          .status(403)
          .send({ message: 'You have no access to this application' })
      }
    }
  } else {
    return next()
  }
}
