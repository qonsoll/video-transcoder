const { DatabaseService } = require('../../../Database')
const { COLLECTIONS } = require('../../../../constants')

/**
 * This function deletes application data from database and returns application id of deleted application
 *
 * @function
 * @param {string} appId - application id of application that should be deleted
 * @returns application id of deleted application
 */
const deleteApp = async (appId) => {
  const database = new DatabaseService()
  await database.deleteDocument(COLLECTIONS.APPLICATIONS, appId)
  return appId
}

module.exports = deleteApp
