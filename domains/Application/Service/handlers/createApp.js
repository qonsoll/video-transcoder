const { DatabaseService } = require('../../../Database')
const { COLLECTIONS } = require('../../../../constants')
const { v4: uuidv4 } = require('uuid')

/**
 * This function creates new application in database and returns application id
 *
 * @function
 * @param {string} name - name of new application
 * @returns application id of newly created application
 */
const createApp = async (name) => {
  const appId = uuidv4()

  const database = new DatabaseService()
  await database.createDocument(
    COLLECTIONS.APPLICATIONS,
    { name },
    { withoutUndefOrNull: true },
    appId
  )
  return appId
}

module.exports = createApp
