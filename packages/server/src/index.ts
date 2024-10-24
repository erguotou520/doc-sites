import { logger } from '@bogeychan/elysia-logger'
import { bearer } from '@elysiajs/bearer'
import { jwt } from '@elysiajs/jwt'
import { staticPlugin } from '@elysiajs/static'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { registerAPIRoutes } from './routes'

const port = process.env.PORT || 9100

export const server = new Elysia()
  .use(logger({ autoLogging: false, level: process.env.LOG_LEVEL ?? 'info' }))
  // .use(app => app.derive(({ request }) => ({ ip: app.server?.requestIP(request) })))
  .use(
    swagger({
      scalarCDN: 'https://cdnjs.cloudflare.com/ajax/libs/scalar-api-reference/1.16.2/standalone.min.js'
    })
  )
  .use(staticPlugin({ assets: 'html', prefix: '' }))
  .use(staticPlugin({ assets: 'static', prefix: '/_static' }))
  .use(bearer())
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET ?? 'default-secret'
    })
  )
// api routes
registerAPIRoutes(server)

// log requests
server.onRequest(({ request }) => {
  if (!request.url.startsWith('/assets/') && !request.url.startsWith('/_static/')) {
    console.log('Request:', request.method, request.url)
  }
})

server.listen(port)

console.log(`Server is running on http://${server.server?.hostname}:${port}`)
