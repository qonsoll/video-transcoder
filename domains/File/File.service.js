const fs = require('fs')
const admin = require('firebase-admin')
const DEFAULT_BUCKET_URI = 'gs://qonsoll-video-transcoder.appspot.com'

/**
 * This class helps to work with Files. Move to another folder, upload to cloud storage,
 * delete from local folder
 * @module File
 */

class FileService {
  /**
   * FileService should be initialized with file Blob object
   * Constructor also initializes cloud bucket instance where we can upload files
   *
   * @constructor
   * @param {Blob} file - file Blob that we will work with
   */
  constructor(file) {
    this.file = file
    this.bucket = admin.storage().bucket()
  }

  /**
   * This method allows to move uploaded file to another folder
   *
   * @method moveFileToAnotherFolder
   * @param {string} folderPath - path to folder where we want to move file
   */
  moveFileToAnotherFolder(folderPath) {
    this.file.mv(`${folderPath}${this.file.name}`, (err) => {
      if (err) throw err
    })
  }

  /**
   * This method allows to upload file to cloud storage bucket
   *
   * @async
   * @method uploadFileToStorage
   * @param {string} sourceFolderPath - path to folder where file is located
   * @param {string} fileName - name of file that will be uploaded
   * @returns {Promise} - Promise object that contains link to show video
   * and cloud URI to process video further with other services
   */
  async uploadFileToStorage(sourceFolderPath, fileName, options = {}) {
    await this.bucket.upload(`${sourceFolderPath}${fileName}`, options)
    const fileUrl = await this.bucket.file(`${fileName}`).getSignedUrl({
      action: 'read',
      expires: '03-09-2491'
    })
    return { link: fileUrl[0], gcsUri: `${DEFAULT_BUCKET_URI}/${fileName}` }
  }

  /**
   * This function helps to delete files from cloud storage
   *
   * @async
   * @method
   * @param {string} filePath - path to file in cloud storage
   */
  async deleteFileFromStorage(filePath) {
    await this.bucket.file(filePath).delete()
  }

  /**
   * This method allows to delete file from local folder
   *
   * @async
   * @method deleteFileFromFolder
   * @param {string} sourceFolderPath - path to folder where file is located
   * @param {string} fileName - name of file that will be deleted
   */
  async deleteFileFromFolder(sourceFolderPath, fileName = this.file.name) {
    await fs.unlink(`${sourceFolderPath}${fileName}`, (err) => {
      if (err) {
        throw err
      }
    })
  }
}

module.exports = FileService
