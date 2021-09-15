const _ = require('lodash')

class ServerStorage {
  constructor() {
    this.storage = []
  }

  getBuffer() {
    return this.storage.slice()
  }

  addItem(item) {
    this.storage.push(item)
    return this
  }

  removeItem() {
    return this.storage.pop()
  }

  findItem(id) {
    const item = _.remove(this.storage, (it) => it.sessionId === id)
    if (!item) throw Error("Your connection doesn't exist")
    return item[0]
  }

  getItem(item) {
    return this.storage.find((it) => it === item)
  }
}

const StorageService = new ServerStorage()

module.exports = StorageService
