process.env.PORT = 1002

const request = require('supertest')

// =============== mocks configuration ===============

const appRestrictor = require('../../../middlewares/appRestrictor')
jest.mock('../../../middlewares/appRestrictor', () => {
  return jest.fn().mockImplementation((req, res, next) => {
    return next()
  })
})

const { app, server } = require('../../../app')

const VideoService = require('../../../domains/Video/Video.service')

const mockGetVideos = jest.fn()

jest.mock('../../../domains/Video/Video.service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getVideos: mockGetVideos
    }
  })
})

beforeEach(() => {
  appRestrictor.mockClear()
  VideoService.mockClear()

  mockGetVideos.mockClear()
})

afterAll(() => {
  server.close()
})

// ===================================================

describe('getVideos', () => {
  test('getVideos success', (done) => {
    const appId = 'test_id'
    const result = { success: true }
    const responseBody = {
      data: result
    }

    mockGetVideos.mockReturnValue(result)

    request(app)
      .get('/video')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockGetVideos.mock.calls.length).toBe(1)
        expect(mockGetVideos.mock.calls[0][0]).toBe('test_id')

        return done()
      })
      .catch((err) => done(err))
  })

  test('getVideos fail: not found', (done) => {
    const appId = 'test_id'
    const responseBody = {
      data: 'test error'
    }

    mockGetVideos.mockRejectedValue(new Error('test error'))

    request(app)
      .get('/video')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockGetVideos.mock.calls.length).toBe(1)
        expect(mockGetVideos.mock.calls[0][0]).toBe('test_id')

        return done()
      })
      .catch((err) => done(err))
  })
})
