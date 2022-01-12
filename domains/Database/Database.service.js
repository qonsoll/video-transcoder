const admin = require('firebase-admin')
const _ = require('lodash')

/**
 * This class helps to manage default actions with database: create, update and delete documents
 * @module Database
 */
class DatabaseService {
  /**
   * Database service doesn't require any params to be initialized
   *
   * @constructor
   */
  constructor() {
    this.database = admin.firestore()
  }

  /**
   * This function helps to get reference to collection to build queries
   *
   * @method
   * @param {string} path - name of collection that we want to get reference to
   * @returns reference to collection
   */
  getCollectionRef(path) {
    return this.database.collection(path)
  }

  /**
   * This function helps to get reference to document to build queries
   *
   * @method
   * @param {string} path - name of collection where document is stored
   * @param {string} docId - id of the document that we want to get reference to
   * @returns reference to document
   */
  getDocumentRef(path, docId) {
    return docId
      ? this.database.collection(path).doc(docId)
      : this.database.collection(path).doc()
  }

  /**
   * This function helps to create new document in database
   *
   * @method
   * @param {string} path - name of collection where we want to create document
   * @param {object} data - data that document will contain
   * @param {object} options - options that will be used to create document (i.e. withoutUndef - without undefined fields)
   * @param {string} docId - id that we want our document to have to
   * @returns {string} newly created document's id
   */
  async createDocument(path, data, options, docId) {
    const { withoutUndefOrNull = true } = options
    const documentId = docId ? docId : this.getDocumentRef(path).id
    const removeUndefOrNull = withoutUndefOrNull
      ? _.omitBy(data, _.isNil)
      : data
    removeUndefOrNull.id = documentId
    await this.database.collection(path).doc(documentId).set(removeUndefOrNull)
    return documentId
  }

  /**
   * This function helps to update document in database
   *
   * @method
   * @param {string} path - name of collection where document is stored
   * @param {object} data - data that we want to change of add
   * @param {string} docId - id of the document that we want to update
   * @param {object} options - options that will be used to create document (i.e. withoutUndef - without undefined fields)
   * @returns {string} updated document's id
   */
  async updateDocument(path, data, docId, options) {
    const { withoutUndefOrNull = true, merge = true } = options
    const removeUndefOrNull = withoutUndefOrNull
      ? _.omitBy(data, _.isNil)
      : data
    if (merge)
      await getDocumentRef(path, docId).set(removeUndefOrNull, { merge })
    else await getDocumentRef(path, docId).set(removeUndefOrNull)
    return docId
  }

  /**
   * This function helps to delete document from database
   *
   * @method
   * @param {string} path - name of collection where document is stored
   * @param {string} id - id of the document that we want to delete
   * @returns {string} deleted document's id
   */
  async deleteDocument(path, id) {
    await this.database.collection(path).doc(id).delete()
    return id
  }

  /**
   *
   * @param {Date} date - date that we want to convert into FB Timestamp
   * @returns {FirebaseFirestore.Timestamp} given date converted into FB Timestamp object
   */
  convertToFBTimestamp(date) {
    return admin.firestore.Timestamp.fromDate(date)
  }
}

module.exports = DatabaseService
