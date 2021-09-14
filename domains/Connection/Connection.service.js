const io = require('socket.io')
/**
 * This class helps to work with Atoms. Create, update, read, delete them
 * @module Connection
 */

class ConnectionService {
  constructor() {
    // this.connection = http
    //   ? io(http, {
    //       allowRequest: () => {},
    //       cors: {
    //         origin: 'http://localhost:3000',
    //         methods: ['GET', 'POST']
    //       }
    //     })
    //   : null
    this.connection = null
  }

  initializeConnection(http) {
    this.connection = io(http, {
      // allowRequest: () => {},
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })
  }

  emitPrivateMessage(socketId, messageType, data) {
    if (this.connection === null)
      throw Error('No socket connection to pass data')
    this.connection.to(socketId).emit(messageType, data)
  }
}

const ConnectionInstance = new ConnectionService()

module.exports = ConnectionInstance
