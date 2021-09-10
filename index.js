const bodyParser = require('body-parser')
const express = require('express')
const fileUpload = require('express-fileupload')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const app = express()
const cors = require('cors')

app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json;charset=UTF-8')

  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  )

  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type',
    'Content-type'
  )

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  // res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next()
})

app.use(
  express.urlencoded({
    extended: false
  })
)

// app.use(express.text());
app.use(express.json())

app.use(cors())

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
  })
)

// app.use(bodyParser({ limit: '1gb' }))

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
  const to = req.body.toFormat || 'mp4'
  const file = req.files.data

  file.mv('tmp/' + file.name, (err) => {
    if (err) return res.sendStatus(500).send(err)
  })

  ffmpeg('tmp/' + file.name)
    .withOutputFormat(to)
    .on('end', (stdout, stderr) => {
      bucket
        .upload(`${file.name}.${to}`)
        .then(() => {
          const storageFile = bucket.file(`${file.name}.${to}`)
          return storageFile.getSignedUrl({
            action: 'read',
            expires: '03-09-2491'
          })
        })
        .then((result) => {
          fs.unlink(`${file.name}.${to}`, (err) => {
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
    .saveToFile(`${file.name}.${to}`)
})

app.listen(5000, () => {
  console.log('App is running on port 5000')
})
