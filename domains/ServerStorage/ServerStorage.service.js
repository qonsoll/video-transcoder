const _ = require('lodash')

/**
 * This class helps to work with requests data.
 * Add, remove, get request data from this container
 * @module ServerStorage
 */

class ServerStorage {
  /**
   * ServerStorage doesn't require any params to be initialized
   *
   * @constructor
   */
  constructor() {
    this.storage = []
  }

  /**
   * This function returns copy of storage container
   *
   * @method getBuffer
   * @returns {Array} - copy of storage container
   */
  getBuffer() {
    return this.storage.slice()
  }

  /**
   * This function adds new item to storage container
   *
   * @method addItem
   * @param {any} item
   * @returns {ServerStorage} constant pointer to constant instance of ServerStorage
   */
  addItem(item) {
    this.storage.push(item)
    return this
  }

  /**
   * This function removes last item of storage container
   *
   * @method removeItem
   * @returns {any} removed item from container
   */
  removeItem() {
    return this.storage.pop()
  }

  /**
   * This function finds and returns data from storage container
   * that was sent during this session
   *
   * @method findItem
   * @param {string} id - id of session that send request to the server
   * @returns {object} object that contains data that was send into request during this session
   */
  findItem(id) {
    const item = _.remove(this.storage, (it) => it.sessionId === id)
    if (!item) return new Error("Your connection doesn't exist")
    return item[0]
  }

  /**
   * This method returns item from storage container if such exists
   * or undefined otherwise
   *
   * @method getItem
   * @param {object} item - item that is to be found in storage container
   * @returns {object|undefined}
   * - object from storage container if item was found
   * - undefined otherwise
   */
  getItem(item) {
    return this.storage.find((it) => it === item)
  }
}

// Storage should be only one to the whole application
// so we create instance right here and export this instance as singleton pattern class
const Storage = new ServerStorage()

module.exports = Storage
