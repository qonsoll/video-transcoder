require('dotenv').config()
const _ = require('lodash')
const speech = require('@google-cloud/speech')
const fs = require('fs')

class TranscriptionService {
  constructor(audioUri, encoding, rateHertz, languageCode) {
    this.speechClient = new speech.SpeechClient()
    // Audio object for API request
    const audio = {
      uri: audioUri
    }

    // Config object for API request
    const config = {
      enableWordTimeOffsets: true,
      encoding: encoding || 'LINEAR16',
      sampleRateHertz: rateHertz || 16000,
      languageCode: languageCode || 'en-US'
    }
    this.request = { audio, config }
  }

  async longRunningSpeechRecognize() {
    // Recognizing process initialization
    const [data] = await this.speechClient.longRunningRecognize(this.request)
    // The following Promise represents the final result of the job
    const [operation] = await data.promise()

    return operation.results
  }

  async shortVideoSpeechRecognize() {
    // Recognizing process initialization
    const [data] = await this.speechClient.recognize(this.request)

    return data.results
  }

  createSubtitlesFile(results, fileName) {
    // let VTT = ''
    let counter = 0
    // let phraseCounter = 0
    let startTime = '00:00:00,000'
    let endTime = '00:00:00,000'
    let phrase = ''
    let phraseLength = 10

    // Writing start of WebVTT file
    // this.appendDataToSubtitlesFile(`transcriptions/${fileName}`, 'WEBVTT\n\n')

    for (var i = 0; i < results.length; i++) {
      //loop through each word in each transcript
      for (var j = 0; j < results[i].alternatives[0].words.length; j++) {
        //write start time
        let start = results[i].alternatives[0].words[j].startTime.seconds
        // start = start.slice(1, start.length - 1)

        //write end time
        let end = results[i].alternatives[0].words[j].endTime.seconds
        // end = end.slice(1, end.length - 1)

        //write word
        let word = results[i].alternatives[0].words[j].word
        // word = word.slice(1, word.length - 1)

        if (counter % phraseLength === 1) {
          //first entry in the phrase
          startTime = this.secondsToFormat(start)
          phrase = word
        }
        if (counter % phraseLength > 1) {
          //adding a word
          phrase = phrase.concat(' ' + word)
        }
        if (
          counter % phraseLength === 0 ||
          j === results[i].alternatives[0].words.length - 1
        ) {
          //end of entry
          phrase = phrase.concat(' ', word)
          endTime = this.secondsToFormat(end)
          // console.log(counter)
          // console.log(startTime + ' --> ' + endTime)
          // console.log(word)
          // console.log('phrase: ', phrase)
          // console.log('\n')
          // write phrase
          this.appendDataToSubtitlesFile(
            `transcriptions/${fileName}`,
            `${Math.ceil(
              counter / phraseLength
            )}\n${startTime} --> ${endTime}\n${phrase}\n\n`
          )
        }
        counter++
      }
    }
  }

  secondsToFormat(seconds) {
    let timeHours = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0')
    let timeMinutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    let timeSeconds = (seconds % 60).toString().padStart(2, '0')

    let formattedTime =
      timeHours + ':' + timeMinutes + ':' + timeSeconds + ',000'
    return formattedTime
  }

  appendDataToSubtitlesFile(filePath, content) {
    fs.appendFileSync(filePath, content, (err) => {
      if (err) {
        throw err
      }
    })
  }
}

module.exports = TranscriptionService
