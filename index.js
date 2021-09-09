const bodyParser = require('body-parser')
const express = require('express')
const fileUpload = require('express-fileupload')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
  })
)

const admin = require('firebase-admin')
const serviceAccount = require('./qonsoll-video-transcoder-firebase-adminsdk-ntmhf-b688febd35.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://qonsoll-video-transcoder.appspot.com'
})

const bucket = admin.storage().bucket()

ffmpeg.setFfmpegPath('D:\\FFMPEG\\bin\\ffmpeg.exe')
ffmpeg.setFfprobePath('D:\\FFMPEG\\bin')

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.post('/convert', (req, res) => {
  const to = req.body.toFormat
  const file = req.files.file
  const arr = file.name.split('.')
  arr.pop()
  const editedName = arr.join('')

  file.mv('tmp/' + file.name, (err) => {
    if (err) return res.sendStatus(500).send(err)
  })

  ffmpeg('tmp/' + file.name)
    .withOutputFormat(to)
    .on('end', (stdout, stderr) => {
      bucket
        .upload(`${editedName}.${to}`)
        .then(() => {
          const storageFile = bucket.file(`${editedName}.${to}`)
          return storageFile.getSignedUrl({
            action: 'read',
            expires: '03-09-2491'
          })
        })
        .then((result) => {
          fs.unlink(`${editedName}.${to}`, (err) => {
            if (err) throw err
          })
          return res.status(200).send({ link: result[0] })
        })
        .catch((err) => res.status(500).send(err))
      // res.sendStatus(200)
      //   res.download(__dirname + fileName, function (err) {
      //     if (err) throw err;
      //     bucket.upload(__dirname + fileName)
      //     fs.unlink(__dirname + fileName, function (err) {
      //       if (err) throw err;
      //       console.log("File deleted");
      //     });
      //   });
      fs.unlink('tmp/' + file.name, (err) => {
        if (err) throw err
      })
    })
    .on('error', (err) => {
      console.log('an error happened: ' + err.message)
      fs.unlink('tmp/' + file.name, (err) => {
        if (err) throw err
      })
    })
    .saveToFile(`${editedName}.${to}`)
})

app.listen(5000, () => {
  console.log('App is running on port 5000')
})
