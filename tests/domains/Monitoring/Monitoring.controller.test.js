process.env.PORT = 1001

const request = require('supertest')
const { app, server } = require('../../../app')

// =============== mocks configuration ===============

afterAll(() => {
  server.close()
})

// ===================================================

describe('health', () => {
  test('health success', (done) => {
    request(app)
      .get('/health')
      .set('Origin', 'foibackend')
      .expect(200)
      .then((response) => {
        expect(response.body.uptime).toBeDefined()
        expect(response.body.message).toEqual('ok')
        expect(response.body.date).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })
})

describe('metrics', () => {
  test('metrics success', (done) => {
    request(app)
      .get('/metrics')
      .set('Origin', 'foibackend')
      .expect(200)
      .then((response) => {
        expect(response.headers['content-type']).toBeDefined()
        expect(response.body).toBeDefined()

        return done()
      })
      .catch((err) => done(err))
  })
})
