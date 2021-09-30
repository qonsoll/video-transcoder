const express = require('express')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const admin = require('firebase-admin')
const serviceAccount = require('./qonsoll-video-transcoder-firebase-adminsdk-ntmhf-b688febd35.json')

const { VideoRouter } = require('./domains/Video')
const { ApplicationRouter } = require('./domains/Application')

const app = express()
const http = require('http').Server(app)
const PORT = process.env.PORT || 8080
const DEFAULT_BUCKET_URI = 'gs://qonsoll-video-transcoder.appspot.com'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: DEFAULT_BUCKET_URI
})

app.use(async (req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*')
  // res.setHeader('Content-Type', 'application/json;charset=UTF-8')

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

  // Cloud Storage CORS settings
  admin
    .storage()
    .bucket()
    .setCorsConfiguration([
      {
        origin: ['*'],
        method: ['GET'],
        maxAgeSeconds: 3600
      }
    ])

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
    tempFileDir: '/uploadBuffer/'
  })
)

app.use('/video', VideoRouter)
app.use('/application', ApplicationRouter)

http.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`)
})
