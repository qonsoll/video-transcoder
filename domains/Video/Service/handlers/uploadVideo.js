const { v4: uuidv4 } = require('uuid')
const { COLLECTIONS } = require('../../../../constants')
const { DatabaseService } = require('../../../Database')
const { Storage } = require('../../../ServerStorage')

const uploadVideo = async (
  appId,
  toFormat,
  withSubtitles,
  language,
  videoDuration,
  chapters,
  file
) => {
  const dbService = new DatabaseService()
  const appData = (
    await dbService.getDocumentRef(COLLECTIONS.APPLICATIONS, appId).get()
  ).data()
  // Generate unique id for this request
  const sessionId = uuidv4()
  // Changing file name to fit session id
  file.name = sessionId
  // Adding request data to server storage to process it further
  Storage.addItem({
    toFormat,
    file,
    sessionId,
    withSubtitles,
    language,
    videoDuration,
    chapters,
    appName: appData.name,
    appId: appData.id
  })
  return sessionId
}

module.exports = uploadVideo
