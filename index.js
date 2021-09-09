const bodyParser = require('body-parser')
const express = require('express')
const fileUpload = require('express-fileupload')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const app = express()

app.use(bodyParser.urlencoded({extended: false}))

app.use(bodyParser.json())

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}))

ffmpeg.setFfmpegPath('D:\\FFMPEG\\bin\\ffmpeg.exe')
ffmpeg.setFfprobePath('D:\\FFMPEG\\bin')
// ffmpeg.setFlvtoolPath('D:\\')

// console.log(ffmpeg)

app.get('/', (req,res) => {
    res.sendFile(__dirname + '/index.html')
})

app.post('/convert', (req,res) => {
    const to = req.body.toFormat
    const file = req.files.file
    let fileName = `output.${to}`;
    console.log('to:', to)
    console.log('file:', file)

    file.mv('tmp/' + file.name, function(err) {
        if(err) return res.sendStatus(500).send(err)
        console.log('File uploaded successfully')
    })

    ffmpeg("tmp/" + file.name)
    .withOutputFormat(to)
    .on("end", function (stdout, stderr) {
      console.log("Finished");
      res.download(__dirname + fileName, function (err) {
        if (err) throw err;

        fs.unlink(__dirname + fileName, function (err) {
          if (err) throw err;
          console.log("File deleted");
        });
      });
      fs.unlink("tmp/" + file.name, function (err) {
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .on("error", function (err) {
      console.log("an error happened: " + err.message);
      fs.unlink("tmp/" + file.name, function (err) {
        if (err) throw err;
        console.log("File deleted");
      });
    })
    .saveToFile(__dirname + fileName);
})

app.listen(5000, () => {
    console.log('App is running on port 5000')
})