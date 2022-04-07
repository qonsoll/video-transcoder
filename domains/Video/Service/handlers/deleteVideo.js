const admin = require('firebase-admin')
const { COLLECTIONS } = require('../../../../constants')
const { DatabaseService } = require('../../../Database')

const deleteVideo = async (appId, videoId) => {
  const dbService = new DatabaseService()
  const fileData = await dbService
    .getDocumentRef(COLLECTIONS.VIDEOS, videoId)
    .get()
  const filePath = fileData.data().path
  const posterPath = fileData.data().posterPath
  // Video file delete from storage
  await admin.storage().bucket().file(filePath).delete()
  // Poster file delete from storage
  await admin.storage().bucket().file(posterPath).delete()
  // Video metadata document delete from firestore
  await dbService.deleteDocument(COLLECTIONS.VIDEOS, videoId)
  // Video statistics delete from firestore
  const videoStatisticQuery = await dbService
    .getCollectionRef(COLLECTIONS.VIDEO_STATISTICS)
    .where('videoInfo.videoId', '==', videoId)
    .get()
  const videoStatisticId = videoStatisticQuery.docs.map(
    (doc) => doc.data().id
  )[0]
  await dbService.deleteDocument(COLLECTIONS.VIDEO_STATISTICS, videoStatisticId)
}

module.exports = deleteVideo
