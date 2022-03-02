const express = require('express')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const helmet = require('helmet')
const admin = require('firebase-admin')
const serviceAccount = require('./qonsoll-video-transcoder-firebase-adminsdk-ntmhf-b688febd35.json')
const corsOptions = require('./middlewares/corsOptions.js')

const { VideoRouter } = require('./domains/Video')
const { ApplicationRouter } = require('./domains/Application')
const { MonitoringRouter } = require('./domains/Monitoring')

const app = express()
const http = require('http').Server(app)
const PORT = process.env.PORT || 8080
const DEFAULT_BUCKET_URI = 'gs://qonsoll-video-transcoder.appspot.com'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: DEFAULT_BUCKET_URI
})

app.use(async (req, res, next) => {
  // Cloud Storage CORS settings to read stored files
  await admin
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

app.use(cors(corsOptions))

app.use(
  express.urlencoded({
    extended: false
  })
)

// app.use(express.text());
app.use(express.json())

app.use(
  fileUpload({
    createParentPath: true,
    tempFileDir: 'uploadBuffer/'
  })
)

// app.use(helmet())

app.use('/', MonitoringRouter)
app.use('/video', VideoRouter)
app.use('/application', ApplicationRouter)

const server = http.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`)
})

module.exports = { app, server }
