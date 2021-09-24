const { DatabaseService } = require('../Database')
const { COLLECTIONS } = require('./Application.constants')
const { v4: uuidv4 } = require('uuid')

class ApplicationService {
  constructor() {
    this.database = new DatabaseService()
  }

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

  async deleteApp(appId) {
    await this.database.deleteDocument(COLLECTIONS.APPLICATIONS, appId)
    return appId
  }
}

module.exports = ApplicationService
