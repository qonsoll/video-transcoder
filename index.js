const bodyParser = require('body-parser')
const express = require('express')
const fileUpload = require('express-fileupload')
const ffmpeg = require('fluent-ffmpeg')
const cors = require('cors')
const fs = require('fs')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 8080

const CONNECTED_CLIENTS = {}

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

// ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')
// ffmpeg.setFfprobePath('/usr/bin/ffprobe')
ffmpeg.setFfmpegPath('D:\\FFMPEG\\bin\\ffmpeg.exe')
ffmpeg.setFfprobePath('D:\\FFMPEG\\bin')

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

// Socket Listener
io.on('connection', (socket) => {
  CONNECTED_CLIENTS[socket.id] = socket.id
  console.log('connected', socket.id)

  socket.on('disconnect', (reason) => {
    delete CONNECTED_CLIENTS[socket.id]
    console.log('disconnected', socket.id)
  })
})

app.post('/convert', (req, res) => {
  const to = req.body.toFormat || 'mp4'
  const file = req.files.data
  const socketId = req.body.socketId

  res.sendStatus(200)

  file.mv('tmp/' + file.name, (err) => {
    if (err) io.to(socketId).emit('error', err)
  })

  console.log(socketId)
  convertFile(file, to, socketId)
})

function convertFile(file, to, socketId) {
  ffmpeg('tmp/' + file.name)
    .withOutputFormat(to)
    // .on('progress', (progress) => {
    //   io.to(socketId).emit('percentage', progress.percent)
    // })
    .on('progress', (progress) => {
      // console.log('Processing: ' + progress.percent + '% done')
      console.log('progress object ', progress)
      io.to(socketId).emit('percentage', progress.percent)
    })
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
            if (err) {
              console.log(err)
              throw err
            }
          })
          io.to(socketId).emit('link', result[0])
          return result[0]
        })
        .catch((err) => {
          console.log(err)
          io.to(socketId).emit('error', err)
        })
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
        if (err) {
          console.log(err)
          throw err
        }
      })
    })
    .on('error', (err) => {
      console.log('an error happened: ' + err.message)
      fs.unlink('tmp/' + file.name, (err) => {
        if (err) throw err
      })
    })
    .saveToFile(`${file.name}.${to}`)
}

http.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`)
})
