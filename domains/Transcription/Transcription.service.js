require('dotenv').config()
const _ = require('lodash')
const speech = require('@google-cloud/speech')
const fs = require('fs')
const { FOLDERS } = require('../../constants')

/**
 * This class helps to make API calls to Google Speech-To-Text API,
 * process result of API call to make subtitles and write result to subtitle file
 * @module Transcription
 */

class TranscriptionService {
  /**
   * TranscriptionService constructor requires audioURI, encoding,
   * rateHertz and languageCode
   *
   * @constructor
   * @param {string} audioUri - cloud storage URI of audio file that will be processed
   * @param {string} encoding - encoding of audio file (LINEAR16 by default)
   * @param {number} rateHertz - hertz rate of audio file (16k by default)
   * @param {string} languageCode - language code of speech that will be processed (en-US by default)
   */
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

  /**
   * This method is used to recognize speech from audio
   * that last longer that 1 minute
   *
   * @async
   * @method longRunningSpeechRecognize
   * @returns {Promise} Promise that contains array of results of speech recognition
   */
  async longRunningSpeechRecognize() {
    // Recognizing process initialization
    const [data] = await this.speechClient.longRunningRecognize(this.request)
    // The following Promise represents the final result of the job
    const [operation] = await data.promise()

    return operation.results
  }

  /**
   * This method is used to recognize speech from audio
   * that last less that 1 minute
   *
   * @async
   * @method shortVideoSpeechRecognize
   * @returns {Promise<Array<object>>} Promise that contains array of results of speech recognition
   */
  async shortVideoSpeechRecognize() {
    // Recognizing process initialization
    const [data] = await this.speechClient.recognize(this.request)

    return data.results
  }

  /**
   * This function gets words and time-codes from speech-recognition results
   * and builds strings in appropriate for subtitles file format
   * then writes these strings into subtitles file
   *
   * @method
   * @param {Array<object>} results - array of objects that contains recognized words and time-codes
   * @param {string} fileName - name of subtitles file
   */
  createSubtitlesFile(results, fileName) {
    let counter = 0
    let startTime = '00:00:00.000'
    let endTime = '00:00:00.000'
    let phrase = ''
    let phraseLength = 10

    // Start subtitles file
    this.appendDataToSubtitlesFile(
      `${FOLDERS.TRANSCRIPTIONS_DIRECTORY}${fileName}`,
      'WEBVTT\n'
    )

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

          // write phrase to subtitles file
          this.appendDataToSubtitlesFile(
            `${FOLDERS.TRANSCRIPTIONS_DIRECTORY}${fileName}`,
            //             ${Math.ceil(
            //   counter / phraseLength
            // )}\n
            `${startTime} --> ${endTime}\n${phrase}\n\n`
          )
        }
        counter++
      }
    }
  }

  /**
   * This function parses time-code to match format that is required for subtitles file
   *
   * @method
   * @param {string} seconds - string that should be parsed into appropriate for subtitles file format
   * @returns {string} string that represents formatted time-code
   */
  secondsToFormat(seconds) {
    // Calculating hours from seconds
    let timeHours = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0')
    // Calculating minutes from leftover seconds
    let timeMinutes = (Math.floor(seconds / 60) % 60)
      .toString()
      .padStart(2, '0')
    // Calculating leftover seconds
    let timeSeconds = (seconds % 60).toString().padStart(2, '0')

    // Building string in an appropriate format
    let formattedTime =
      timeHours + ':' + timeMinutes + ':' + timeSeconds + '.000'
    return formattedTime
  }

  /**
   * This method is used to append content to subtitles file
   *
   * @method
   * @param {string} filePath - path to subtitles file where content will be written
   * @param {string} content - content that will be written into subtitles file
   */
  appendDataToSubtitlesFile(filePath, content) {
    fs.appendFileSync(filePath, content, (err) => {
      if (err) {
        throw err
      }
    })
  }
}

module.exports = TranscriptionService
