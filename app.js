const express = require('express')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const admin = require('firebase-admin')
const serviceAccount = require('./qonsoll-video-transcoder-firebase-adminsdk-ntmhf-b688febd35.json')
const { VideoRouter } = require('./domains/Video')
const { ConnectionInstance } = require('./domains/Connection')

const app = express()
const http = require('http').Server(app)
const PORT = process.env.PORT || 8080

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://qonsoll-video-transcoder.appspot.com'
})

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

app.use((req, res, next) => {
  // Initializing Socket.IO server
  ConnectionInstance.initializeConnection(http)

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

app.use('/video', VideoRouter)

http.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`)
})
