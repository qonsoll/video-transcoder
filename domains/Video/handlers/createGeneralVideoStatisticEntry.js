const { COLLECTIONS } = require('../../../constants')

module.exports = async (
  { size, duration, chapters = null, videoId },
  dbService
) => {
  const uploadDate = dbService.convertToFBTimestamp(new Date())
  const videoInfo = { size, duration, uploadDate, videoId }

  const generalInfo = {
    pausesCount: 0,
    rewindsCount: 0,
    viewsCount: 0,
    averagePlaybackInSeconds: 0,
    averagePlaybackInPercents: 0,
    averagePausesCount: 0,
    averageRewindsCount: 0,
    fullPlaybacksCount: 0,
    incompletePlaybacksCount: 0
  }

  const chapterRewindsCount = chapters
    ? chapters.reduce((prev, curr) => {
        prev[curr.title] = 0
        return prev
      }, {})
    : null
  const chaptersInfo = {
    chapters,
    chapterRewindsCount,
    mostFrequentlyRewindedChapter: null
  }

  const viewsInfo = {
    viewsByBrowserCount: null,
    viewsByDeviceTypeCount: {
      tablet: 0,
      desktop: 0,
      mobile: 0
    },
    viewsByDateCount: null
  }

  const newDoc = await dbService.createDocument(
    COLLECTIONS.VIDEO_STATISTICS,
    {
      videoInfo,
      generalInfo,
      chaptersInfo,
      viewsInfo
    },
    { withoutUndefOrNull: false }
  )
}
