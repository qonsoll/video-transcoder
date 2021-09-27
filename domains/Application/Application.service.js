const { DatabaseService } = require('../Database')
const { COLLECTIONS } = require('../../constants')
const { v4: uuidv4 } = require('uuid')

/**
 * This class helps to handle applications
 *
 * @module Application
 */
class ApplicationService {
  /**
   * ApplicationService doesn't require any params to be initialized
   *
   * @constructor
   */
  constructor() {
    this.database = new DatabaseService()
  }

  /**
   * This function creates new application in database and returns application id
   *
   * @method
   * @param {string} name - name of new application
   * @returns application id of newly created application
   */
  async createApp(name) {
    const appId = uuidv4()
    await this.database.createDocument(
      COLLECTIONS.APPLICATIONS,
      { name },
      { withoutUndefOrNull: true },
      appId
    )
    return appId
  }

  /**
   * This function deletes application data from database and returns application id of deleted application
   *
   * @method
   * @param {string} appId - application id of application that should be deleted
   * @returns application id of deleted application
   */
  async deleteApp(appId) {
    await this.database.deleteDocument(COLLECTIONS.APPLICATIONS, appId)
    return appId
  }
}

module.exports = ApplicationService
