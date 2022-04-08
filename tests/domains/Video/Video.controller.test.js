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

const Service = require('../../../domains/Video/Service')

jest.mock('../../../domains/Video/Service', () => ({
  getVideos: jest.fn(),
  getVideo: jest.fn(),
  deleteVideo: jest.fn(),
  uploadVideo: jest.fn(),
  convertFile: jest.fn().mockImplementation((id, res) => {
    res.end()
  }),
  addSubtitles: jest.fn().mockImplementation((id, res) => {
    res.end()
  })
}))

beforeEach(() => {
  appRestrictor.mockClear()
  Service.getVideos.mockClear()
  Service.getVideo.mockClear()
  Service.deleteVideo.mockClear()
  Service.uploadVideo.mockClear()
  Service.convertFile.mockClear()
  Service.addSubtitles.mockClear()
})

afterAll(() => {
  server.close()
})

jest.setTimeout(20000) // ms

// ===================================================

describe('getVideos', () => {
  test('getVideos success', (done) => {
    const appId = 'test_id'
    const result = { success: true }
    const responseBody = {
      data: result
    }

    Service.getVideos.mockReturnValue(result)

    request(app)
      .get('/video')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.getVideos.mock.calls.length).toBe(1)
        expect(Service.getVideos.mock.calls[0][0]).toBe('test_id')

        return done()
      })
      .catch((err) => done(err))
  })

  test('getVideos fail: not found', (done) => {
    const appId = 'test_id'
    const responseBody = {
      data: 'test error'
    }

    Service.getVideos.mockRejectedValue(new Error('test error'))

    request(app)
      .get('/video')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.getVideos.mock.calls.length).toBe(1)
        expect(Service.getVideos.mock.calls[0][0]).toBe('test_id')

        return done()
      })
      .catch((err) => done(err))
  })
})

describe('getVideo', () => {
  test('getVideo success', (done) => {
    const videoId = 'test_video_id'
    const appId = 'test_id'
    const result = { success: true }
    const responseBody = {
      data: result
    }

    Service.getVideo.mockReturnValue(result)

    request(app)
      .get('/video/test_video_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.getVideo.mock.calls.length).toBe(1)
        expect(Service.getVideo.mock.calls[0][0]).toBe(appId)
        expect(Service.getVideo.mock.calls[0][1]).toBe(videoId)

        return done()
      })
      .catch((err) => done(err))
  })

  test('getVideo fail: not found', (done) => {
    const videoId = 'test_video_id'
    const appId = 'test_id'
    const responseBody = {
      data: 'test error'
    }

    Service.getVideo.mockRejectedValue(new Error('test error'))

    request(app)
      .get('/video/test_video_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.getVideo.mock.calls.length).toBe(1)
        expect(Service.getVideo.mock.calls[0][0]).toBe(appId)
        expect(Service.getVideo.mock.calls[0][1]).toBe(videoId)

        return done()
      })
      .catch((err) => done(err))
  })
})

describe('deleteVideo', () => {
  test('deleteVideo success', (done) => {
    const videoId = 'test_video_id'
    const appId = 'test_id'
    const responseBody = {
      data: 'deleted'
    }

    request(app)
      .delete('/video/test_video_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.deleteVideo.mock.calls.length).toBe(1)
        expect(Service.deleteVideo.mock.calls[0][0]).toBe(appId)
        expect(Service.deleteVideo.mock.calls[0][1]).toBe(videoId)

        return done()
      })
      .catch((err) => done(err))
  })

  test('deleteVideo fail: error', (done) => {
    const videoId = 'test_video_id'
    const appId = 'test_id'
    const responseBody = {
      data: 'test error'
    }

    Service.deleteVideo.mockRejectedValue(new Error('test error'))

    request(app)
      .delete('/video/test_video_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(500)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.deleteVideo.mock.calls.length).toBe(1)
        expect(Service.deleteVideo.mock.calls[0][0]).toBe(appId)
        expect(Service.deleteVideo.mock.calls[0][1]).toBe(videoId)

        return done()
      })
      .catch((err) => done(err))
  })
})

describe('uploadVideo', () => {
  test('uploadVideo success', (done) => {
    const sessionId = 'test_session_id'

    const appId = 'test_id'
    const responseBody = {
      data: sessionId
    }

    Service.uploadVideo.mockReturnValue(sessionId)

    request(app)
      .post('/video/upload')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .field(
        'uploadProps',
        '{"toFormat":"test_to_format","withSubtitles":"test_with_subtitles","language":"test_language","videoDuration":"video_duration","chapters":"test_chapters"}'
      )
      .attach('data', 'tests/domains/Video/test.txt')
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.uploadVideo.mock.calls.length).toBe(1)
        expect(Service.uploadVideo.mock.calls[0][0]).toBe(appId)
        expect(Service.uploadVideo.mock.calls[0][1]).toBe('test_to_format')
        expect(Service.uploadVideo.mock.calls[0][2]).toBe('test_with_subtitles')
        expect(Service.uploadVideo.mock.calls[0][3]).toBe('test_language')
        expect(Service.uploadVideo.mock.calls[0][4]).toBe('video_duration')
        expect(Service.uploadVideo.mock.calls[0][5]).toBe('test_chapters')
        expect(Service.uploadVideo.mock.calls[0][6]).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })

  test('uploadVideo fail: error', (done) => {
    const appId = 'test_id'
    const responseBody = {
      data: 'test error'
    }

    Service.uploadVideo.mockRejectedValue(new Error('test error'))

    request(app)
      .post('/video/upload')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .field(
        'uploadProps',
        '{"toFormat":"test_to_format","withSubtitles":"test_with_subtitles","language":"test_language","videoDuration":"video_duration","chapters":"test_chapters"}'
      )
      .attach('data', 'tests/domains/Video/test.txt')
      .expect(500)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.uploadVideo.mock.calls.length).toBe(1)
        expect(Service.uploadVideo.mock.calls[0][0]).toBe(appId)
        expect(Service.uploadVideo.mock.calls[0][1]).toBe('test_to_format')
        expect(Service.uploadVideo.mock.calls[0][2]).toBe('test_with_subtitles')
        expect(Service.uploadVideo.mock.calls[0][3]).toBe('test_language')
        expect(Service.uploadVideo.mock.calls[0][4]).toBe('video_duration')
        expect(Service.uploadVideo.mock.calls[0][5]).toBe('test_chapters')
        expect(Service.uploadVideo.mock.calls[0][6]).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })
})

describe('convert', () => {
  test('convert success', (done) => {
    const id = 'test_id'
    const appId = 'test_id'

    request(app)
      .get('/video/convert/test_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.convertFile.mock.calls.length).toBe(1)
        expect(Service.convertFile.mock.calls[0][0]).toBe(id)
        expect(Service.convertFile.mock.calls[0][1]).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })

  test('convert fail: error', (done) => {
    const id = 'test_id'
    const appId = 'test_id'

    Service.convertFile.mockRejectedValue(new Error('test error'))

    request(app)
      .get('/video/convert/test_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.convertFile.mock.calls.length).toBe(1)
        expect(Service.convertFile.mock.calls[0][0]).toBe(id)
        expect(Service.convertFile.mock.calls[0][1]).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })
})

describe('addSubtitles', () => {
  test('addSubtitles success', (done) => {
    const id = 'test_id'
    const appId = 'test_id'

    request(app)
      .get('/video/createSubtitles/test_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.addSubtitles.mock.calls.length).toBe(1)
        expect(Service.addSubtitles.mock.calls[0][0]).toBe(id)
        expect(Service.addSubtitles.mock.calls[0][1]).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })

  test('addSubtitles fail: error', (done) => {
    const id = 'test_id'
    const appId = 'test_id'

    Service.addSubtitles.mockRejectedValue(new Error('test error'))

    request(app)
      .get('/video/createSubtitles/test_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(Service.addSubtitles.mock.calls.length).toBe(1)
        expect(Service.addSubtitles.mock.calls[0][0]).toBe(id)
        expect(Service.addSubtitles.mock.calls[0][1]).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })
})
