const fs = require('fs')
const admin = require('firebase-admin')

class FileService {
  constructor(file) {
    this.file = file
    this.bucket = admin.storage().bucket()
  }

  moveFileToAnotherFolder(folderPath) {
    this.file.mv(`${folderPath}${this.file.name}`, (err) => {
      if (err) throw err
    })
  }

  async uploadFileToStorage(sourceFolderPath, fileName) {
    await this.bucket.upload(`${sourceFolderPath}${fileName}`)
    const fileUrl = await this.bucket.file(`${fileName}`).getSignedUrl({
      action: 'read',
      expires: '03-09-2491'
    })
    return fileUrl[0]
  }

  async deleteFileFromFolder(sourceFolderPath, fileName = this.file.name) {
    await fs.unlink(`${sourceFolderPath}${fileName}`, (err) => {
      if (err) {
        throw err
      }
    })
  }
}

module.exports = FileService
