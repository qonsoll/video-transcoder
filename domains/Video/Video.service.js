const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const admin = require('firebase-admin')
const ConnectionInstance = require('../Connection/Connection.service')
/**
 * This class helps to work with Atoms. Create, update, read, delete them
 * @module Video
 */

class VideoService {
  constructor() {
    // ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
    // ffmpeg.setFfprobePath('/usr/bin/ffprobe')
    ffmpeg.setFfmpegPath('D:\\FFMPEG\\bin\\ffmpeg.exe')
    ffmpeg.setFfprobePath('D:\\FFMPEG\\bin')
    this.bucket = admin.storage().bucket()
  }

  convert(file, to = 'mp4', socketId) {
    file.mv('../../uploadBuffer/' + file.name, (err) => {
      if (err)
        ConnectionInstance.emitPrivateMessage(socketId, 'error', err.message)
      //   io.to(socketId).emit('error', err)
    })

    ffmpeg('../../uploadBuffer/' + file.name)
      .withOutputFormat(to)
      .on('progress', (progress) => {
        console.log('progress object ', progress)
        ConnectionInstance.emitPrivateMessage(
          socketId,
          'percentage',
          progress.targetSize
        )
        // io.to(socketId).emit('percentage', progress.percent)
      })
      .on('end', (stdout, stderr) => {
        this.bucket
          .upload(`../../transcodedVideos/${file.name}.${to}`)
          .then(() => {
            const storageFile = this.bucket.file(`${file.name}.${to}`)
            return storageFile.getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            })
          })
          .then((result) => {
            fs.unlink(`${file.name}.${to}`, (err) => {
              if (err) {
                throw err
              }
            })
            ConnectionInstance.emitPrivateMessage(socketId, 'link', result[0])
            // io.to(socketId).emit('link', result[0])
            return result[0]
          })
          .catch((err) => {
            console.log(err)
            throw err
          })
        fs.unlink('../../uploadBuffer/' + file.name, (err) => {
          if (err) {
            console.log(err)
            throw err
          }
        })
      })
      .on('error', (err) => {
        console.log('Error during processing ffmpeg file: ' + err.message)
        ConnectionInstance.emitPrivateMessage(socketId, 'error', err.message)
        // io.to(socketId).emit('error', err)
        fs.unlink('../../uploadBuffer/' + file.name, (err) => {
          if (err)
            console.log(
              'Error during deleting temporary file on ffmpeg error: ',
              err
            )
        })
      })
      .saveToFile(`../../transcodedVideos/${file.name}.${to}`)
  }
}

module.exports = VideoService
