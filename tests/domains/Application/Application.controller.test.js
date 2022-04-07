process.env.PORT = 1000

const request = require('supertest')
const { app, server } = require('../../../app')

const Service = require('../../../domains/Application/Service')

// =============== mocks configuration ===============

jest.mock('../../../domains/Application/Service', () => ({
  createApp: jest.fn(),
  deleteApp: jest.fn()
}))

beforeEach(() => {
  Service.createApp.mockClear()
  Service.deleteApp.mockClear()
})

afterAll(() => {
  server.close()
})

jest.setTimeout(20000) // ms

// ===================================================

describe('create', () => {
  test('create success', (done) => {
    const appId = 'test_id'
    const responseBody = {
      data: {
        message: 'created',
        appId
      }
    }
    const requestBody = { name: 'test_name' }

    Service.createApp.mockReturnValue(appId)

    request(app)
      .post('/application')
      .set('Origin', 'foibackend')
      .send(requestBody)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(Service.createApp.mock.calls.length).toBe(1)
        expect(Service.createApp.mock.calls[0][0]).toBe('test_name')

        return done()
      })
      .catch((err) => done(err))
  })

  test('create fail: validation', (done) => {
    const requestBody = { noname: 'test_name' }

    request(app)
      .post('/application')
      .set('Origin', 'foibackend')
      .send(requestBody)
      .expect(422)
      .then((response) => {
        expect(response.body).toEqual({})

        expect(Service.createApp.mock.calls.length).toBe(0)

        return done()
      })
      .catch((err) => done(err))
  })

  test('create fail: error', (done) => {
    const responseBody = {
      data: {
        message: 'error',
        error: {}
      }
    }
    const requestBody = { name: 'test_name' }

    Service.createApp.mockRejectedValue(new Error('test error'))

    request(app)
      .post('/application')
      .set('Origin', 'foibackend')
      .send(requestBody)
      .expect(500)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(Service.createApp.mock.calls.length).toBe(1)
        expect(Service.createApp.mock.calls[0][0]).toBe('test_name')

        return done()
      })
      .catch((err) => done(err))
  })
})

describe('delete', () => {
  test('delete success', (done) => {
    const appId = 'test_id'
    const responseBody = {
      data: {
        message: 'deleted',
        appId
      }
    }

    Service.deleteApp.mockReturnValue(appId)

    request(app)
      .delete('/application/test_id')
      .set('Origin', 'foibackend')
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(Service.deleteApp.mock.calls.length).toBe(1)
        expect(Service.deleteApp.mock.calls[0][0]).toBe('test_id')

        return done()
      })
      .catch((err) => done(err))
  })

  test('delete fail: error', (done) => {
    const responseBody = {
      data: {
        message: 'error',
        error: {}
      }
    }

    Service.deleteApp.mockRejectedValue(new Error('test error'))

    request(app)
      .delete('/application/test_id')
      .set('Origin', 'foibackend')
      .expect(500)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(Service.deleteApp.mock.calls.length).toBe(1)
        expect(Service.deleteApp.mock.calls[0][0]).toBe('test_id')

        return done()
      })
      .catch((err) => done(err))
  })
})
