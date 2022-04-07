const { COLLECTIONS } = require('../../../../constants')
const { DatabaseService } = require('../../../Database')

const getVideos = async (appId) => {
  const dbService = new DatabaseService()

  const dbQuery = await dbService
    .getCollectionRef(COLLECTIONS.VIDEOS)
    .where('appId', '==', appId)
    .get()
  return dbQuery.docs.map((item) => item.data())
}

module.exports = getVideos
