process.env.PORT = 1000

const request = require('supertest')
const { app, server } = require('../../../app')

const ApplicationService = require('../../../domains/Application/Application.service')

// =============== mocks configuration ===============

const mockCreateApp = jest.fn()
const mockDeleteApp = jest.fn()

jest.mock('../../../domains/Application/Application.service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      createApp: mockCreateApp,
      deleteApp: mockDeleteApp
    }
  })
})

beforeEach(() => {
  ApplicationService.mockClear()

  mockCreateApp.mockClear()
  mockDeleteApp.mockClear()
})

afterAll(() => {
  server.close()
})

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

    mockCreateApp.mockReturnValue(appId)

    request(app)
      .post('/application')
      .set('Origin', 'foibackend')
      .send(requestBody)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(ApplicationService.mock.calls.length).toBe(1)
        expect(mockCreateApp.mock.calls.length).toBe(1)
        expect(mockCreateApp.mock.calls[0][0]).toBe('test_name')

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

        expect(ApplicationService.mock.calls.length).toBe(0)
        expect(mockCreateApp.mock.calls.length).toBe(0)

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

    mockCreateApp.mockRejectedValue(new Error('test error'))

    request(app)
      .post('/application')
      .set('Origin', 'foibackend')
      .send(requestBody)
      .expect(500)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(ApplicationService.mock.calls.length).toBe(1)
        expect(mockCreateApp.mock.calls.length).toBe(1)
        expect(mockCreateApp.mock.calls[0][0]).toBe('test_name')

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

    mockDeleteApp.mockReturnValue(appId)

    request(app)
      .delete('/application/test_id')
      .set('Origin', 'foibackend')
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(ApplicationService.mock.calls.length).toBe(1)
        expect(mockDeleteApp.mock.calls.length).toBe(1)
        expect(mockDeleteApp.mock.calls[0][0]).toBe('test_id')

        return done()
      })
      .catch((err) => done(err))
  })

  test('delete fail: error', (done) => {
    const appId = 'test_id'
    const responseBody = {
      data: {
        message: 'error',
        error: {}
      }
    }

    mockDeleteApp.mockRejectedValue(new Error('test error'))

    request(app)
      .delete('/application/test_id')
      .set('Origin', 'foibackend')
      .expect(500)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(ApplicationService.mock.calls.length).toBe(1)
        expect(mockDeleteApp.mock.calls.length).toBe(1)
        expect(mockDeleteApp.mock.calls[0][0]).toBe('test_id')

        return done()
      })
      .catch((err) => done(err))
  })
})
