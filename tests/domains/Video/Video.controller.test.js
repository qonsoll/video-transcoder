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
const mockGetVideo = jest.fn()
const mockDeleteVideo = jest.fn()
const mockUpload = jest.fn()
const mockConvertFile = jest.fn()
const mockAddSubtitles = jest.fn()
mockConvertFile.mockImplementation((id, res) => {
  res.end()
})
mockAddSubtitles.mockImplementation((id, res) => {
  res.end()
})

jest.mock('../../../domains/Video/Video.service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getVideos: mockGetVideos,
      getVideo: mockGetVideo,
      deleteVideo: mockDeleteVideo,
      upload: mockUpload,
      convertFile: mockConvertFile,
      addSubtitles: mockAddSubtitles
    }
  })
})

beforeEach(() => {
  appRestrictor.mockClear()
  VideoService.mockClear()

  mockGetVideos.mockClear()
  mockGetVideo.mockClear()
  mockDeleteVideo.mockClear()
  mockUpload.mockClear()
  mockConvertFile.mockClear()
  mockAddSubtitles.mockClear()
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

describe('getVideo', () => {
  test('getVideo success', (done) => {
    const videoId = 'test_video_id'
    const appId = 'test_id'
    const result = { success: true }
    const responseBody = {
      data: result
    }

    mockGetVideo.mockReturnValue(result)

    request(app)
      .get('/video/test_video_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockGetVideo.mock.calls.length).toBe(1)
        expect(mockGetVideo.mock.calls[0][0]).toBe(appId)
        expect(mockGetVideo.mock.calls[0][1]).toBe(videoId)

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

    mockGetVideo.mockRejectedValue(new Error('test error'))

    request(app)
      .get('/video/test_video_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockGetVideo.mock.calls.length).toBe(1)
        expect(mockGetVideo.mock.calls[0][0]).toBe(appId)
        expect(mockGetVideo.mock.calls[0][1]).toBe(videoId)

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
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockDeleteVideo.mock.calls.length).toBe(1)
        expect(mockDeleteVideo.mock.calls[0][0]).toBe(appId)
        expect(mockDeleteVideo.mock.calls[0][1]).toBe(videoId)

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

    mockDeleteVideo.mockRejectedValue(new Error('test error'))

    request(app)
      .delete('/video/test_video_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(500)
      .then((response) => {
        expect(response.body).toEqual(responseBody)

        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockDeleteVideo.mock.calls.length).toBe(1)
        expect(mockDeleteVideo.mock.calls[0][0]).toBe(appId)
        expect(mockDeleteVideo.mock.calls[0][1]).toBe(videoId)

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

    mockUpload.mockReturnValue(sessionId)

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
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockUpload.mock.calls.length).toBe(1)
        expect(mockUpload.mock.calls[0][0]).toBe(appId)
        expect(mockUpload.mock.calls[0][1]).toBe('test_to_format')
        expect(mockUpload.mock.calls[0][2]).toBe('test_with_subtitles')
        expect(mockUpload.mock.calls[0][3]).toBe('test_language')
        expect(mockUpload.mock.calls[0][4]).toBe('video_duration')
        expect(mockUpload.mock.calls[0][5]).toBe('test_chapters')
        expect(mockUpload.mock.calls[0][6]).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })

  test('uploadVideo fail: error', (done) => {
    const appId = 'test_id'
    const responseBody = {
      data: 'test error'
    }

    mockUpload.mockRejectedValue(new Error('test error'))

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
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockUpload.mock.calls.length).toBe(1)
        expect(mockUpload.mock.calls[0][0]).toBe(appId)
        expect(mockUpload.mock.calls[0][1]).toBe('test_to_format')
        expect(mockUpload.mock.calls[0][2]).toBe('test_with_subtitles')
        expect(mockUpload.mock.calls[0][3]).toBe('test_language')
        expect(mockUpload.mock.calls[0][4]).toBe('video_duration')
        expect(mockUpload.mock.calls[0][5]).toBe('test_chapters')
        expect(mockUpload.mock.calls[0][6]).toBeDefined()

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
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockConvertFile.mock.calls.length).toBe(1)
        expect(mockConvertFile.mock.calls[0][0]).toBe(id)
        expect(mockConvertFile.mock.calls[0][1]).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })

  test('convert fail: error', (done) => {
    const id = 'test_id'
    const appId = 'test_id'

    mockConvertFile.mockRejectedValue(new Error('test error'))

    request(app)
      .get('/video/convert/test_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockConvertFile.mock.calls.length).toBe(1)
        expect(mockConvertFile.mock.calls[0][0]).toBe(id)
        expect(mockConvertFile.mock.calls[0][1]).toBeDefined()

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
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockAddSubtitles.mock.calls.length).toBe(1)
        expect(mockAddSubtitles.mock.calls[0][0]).toBe(id)
        expect(mockAddSubtitles.mock.calls[0][1]).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })

  test('addSubtitles fail: error', (done) => {
    const id = 'test_id'
    const appId = 'test_id'

    mockAddSubtitles.mockRejectedValue(new Error('test error'))

    request(app)
      .get('/video/createSubtitles/test_id')
      .set('Origin', 'foibackend')
      .set('appid', appId)
      .expect(200)
      .then((response) => {
        expect(appRestrictor.mock.calls.length).toBe(1)
        expect(VideoService.mock.calls.length).toBe(1)
        expect(mockAddSubtitles.mock.calls.length).toBe(1)
        expect(mockAddSubtitles.mock.calls[0][0]).toBe(id)
        expect(mockAddSubtitles.mock.calls[0][1]).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })
})
