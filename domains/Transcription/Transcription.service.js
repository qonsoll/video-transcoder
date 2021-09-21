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
      encoding: encoding || 'LINEAR16',
      sampleRateHertz: rateHertz || 24000,
      languageCode: languageCode || 'en-US'
    }
    this.request = { audio, config }
  }

  async longRunningSpeechRecognize() {
    // Recognizing process initialization
    const [data] = await speechClient.longRunningRecognize(this.request)
    // The following Promise represents the final result of the job
    const [operation] = await data.promise()

    return operation.results
  }

  createSubtitlesFile(results, fileName) {
    // let VTT = ''
    let counter = 0
    // let phraseCounter = 0
    let startTime = '00:00:00'
    let endTime = '00:00:00'
    let phrase = ''
    let phraseLength = 10

    // Writing start of WebVTT file
    appendDataToSubtitlesFile(`transcriptions/${fileName}`, 'WEBVTT\n\n')

    for (var i = 0; i < results.length; i++) {
      //loop through each word in each transcript
      for (var j = 0; j < results[i].alternatives[0].words.length; j++) {
        //write start time
        let start = results[i].alternatives[0].words[j].startTime.seconds.low
        //start = start.slice(1, start.length - 1)

        //write end time
        let end = results[i].alternatives[0].words[j].endTime.seconds.low
        //end = end.slice(1, end.length - 1)

        //write word
        let word = results[i].alternatives[0].words[j].word
        word = word.slice(1, word.length - 1)

        if (counter % phraseLength === 1) {
          //first entry in the phrase
          startTime = secondsToFormat(start)
          phrase = word
        }
        if (counter % phraseLength > 1) {
          //adding a word
          phrase = phrase.concat(' ' + word)
        }
        if (counter % phraseLength === 0) {
          //end of entry
          phrase = phrase.concat(' ', word)
          endTime = secondsToFormat(end)
        }

        // write phrase
        appendDataToSubtitlesFile(
          `transcriptions/${fileName}`,
          `${counter}\n${startTime} --> ${endTime}\n${phrase}\n\n`
        )
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
      timeHours + ':' + timeMinutes + ':' + timeSeconds + '.000'
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
