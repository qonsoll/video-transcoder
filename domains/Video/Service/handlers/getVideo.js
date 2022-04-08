const { COLLECTIONS } = require('../../../../constants')
const { DatabaseService } = require('../../../Database')

const getVideo = async (appId, videoId) => {
  const dbService = new DatabaseService()
  const getVideoQuery = await dbService
    .getDocumentRef(COLLECTIONS.VIDEOS, videoId)
    .get()
  const videoData = getVideoQuery.data()
  const responseData = {
    link: videoData.link,
    format: videoData.format,
    withSubtitles: videoData.withSubtitles
  }
  if (videoData.withSubtitles) {
    const getSubtitlesQuery = await dbService
      .getCollectionRef(COLLECTIONS.SUBTITLES)
      .where('videoId', '==', videoId)
      .get()
    const subtitlesData = getSubtitlesQuery.docs.map((item) => ({
      link: item.data().link,
      language: item.data().language,
      languageLabel: item.data().languageLabel
    }))
    responseData.subtitles = subtitlesData
  }
  return responseData
}

module.exports = getVideo
