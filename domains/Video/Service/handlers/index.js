const uploadVideo = require('./uploadVideo')
const deleteVideo = require('./deleteVideo')
const getVideo = require('./getVideo')
const getVideos = require('./getVideos')
const convertFile = require('./convertFile')
const addSubtitles = require('./addSubtitles')
const uploadWithoutConvert = require('./uploadWithoutConvert')

module.exports = {
  uploadVideo,
  deleteVideo,
  getVideo,
  getVideos,
  convertFile,
  addSubtitles,
  uploadWithoutConvert
}
