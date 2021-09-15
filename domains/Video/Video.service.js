const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const admin = require('firebase-admin')
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

  convert(file, to = 'mp4', response) {
    file.mv('uploadBuffer/' + file.name, (err) => {
      if (err) {
        response.write(`event: error\ndata: ${err.message}\n\n`)
        response.end()
        throw err
      }
    })

    ffmpeg('uploadBuffer/' + file.name)
      .withOutputFormat(to)
      .on('progress', (progress) => {
        const percent = (progress.targetSize * 100) / (file.size / 1024)
        response.write(`event: progress\ndata: ${percent}\n\n`)
      })
      .on('end', (stdout, stderr) => {
        this.bucket
          .upload(`transcodedVideos/${file.name}.${to}`)
          .then(() => {
            const storageFile = this.bucket.file(`${file.name}.${to}`)
            return storageFile.getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            })
          })
          .then((result) => {
            fs.unlink(`transcodedVideos/${file.name}.${to}`, (err) => {
              if (err) {
                throw err
              }
            })
            response.write(`event: link\ndata: ${result[0]}\n\n`)
            response.end()
            return result[0]
          })
          .catch((err) => {
            throw err
          })
        fs.unlink('uploadBuffer/' + file.name, (err) => {
          if (err) {
            throw err
          }
        })
      })
      .on('error', (err) => {
        response.write(`event: error\ndata: ${err.message}\n\n`)
        response.end()
        fs.unlink('uploadBuffer/' + file.name, (err) => {
          if (err)
            console.log(
              'Error during deleting temporary file on ffmpeg error: ',
              err
            )
          throw err
        })
      })
      .saveToFile(`transcodedVideos/${file.name}.${to}`)
  }
}

module.exports = VideoService
