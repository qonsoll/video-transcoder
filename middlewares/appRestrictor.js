const { DatabaseService } = require('../domains/Database')

module.exports = async (req, res, next) => {
  const appId = req.headers.appid
  if (!appId)
    return res
      .status(403)
      .send({ message: 'You have no access to this application' })
  else {
    const database = new DatabaseService()
    try {
      await database.getDocumentRef('applications', appId).get()
      return next()
    } catch (err) {
      return res
        .status(403)
        .send({ message: 'You have no access to this application' })
    }
  }
}
