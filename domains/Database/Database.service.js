const admin = require('firebase-admin')
const _ = require('lodash')

class DatabaseService {
  constructor() {
    this.database = admin.firestore()
  }

  getCollectionRef(path) {
    return this.database.firestore(path)
  }

  getDocumentRef(path, docId) {
    return docId
      ? this.database.collection(path).doc(docId)
      : this.database.collection(path).doc()
  }

  async createDocument(path, data, docId, options) {
    const { withoutUndefOrNull = true } = options
    const documentId = docId ? docId : this.getDocumentRef(path).id
    const removeUndefOrNull = withoutUndefOrNull
      ? _.omitBy(data, _.isNil)
      : data
    removeUndefOrNull.id = documentId
    await this.database.collection(path).doc(docId).set(removeUndefOrNull)
    return this
  }

  async updateDocument(path, data, docId, options) {
    const { withoutUndefOrNull = true, merge = true } = options
    const removeUndefOrNull = withoutUndefOrNull
      ? _.omitBy(data, _.isNil)
      : data
    if (merge)
      await getDocumentRef(path, docId).set(removeUndefOrNull, { merge })
    else await getDocumentRef(path, docId).set(removeUndefOrNull)
    return this
  }

  async deleteDocument(path, id) {
    await this.database.collection(path).doc(id).delete()
    return this
  }
}

module.exports = DatabaseService
