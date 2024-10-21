import { logger } from '@bogeychan/elysia-logger'
import { bearer } from '@elysiajs/bearer'
import { jwt } from '@elysiajs/jwt'
import { staticPlugin } from '@elysiajs/static'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { registerAPIRoutes } from './routes'

const port = process.env.PORT || 9100

const server = new Elysia()
  .use(logger({ autoLogging: false, level: process.env.LOG_LEVEL ?? 'info' }))
  // .use(app => app.derive(({ request }) => ({ ip: app.server?.requestIP(request) })))
  .use(
    swagger({
      scalarCDN: 'https://cdnjs.cloudflare.com/ajax/libs/scalar-api-reference/1.16.2/standalone.min.js'
    })
  )
  .use(staticPlugin({ assets: 'html', prefix: '' }))
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
  if (!request.url.startsWith('/assets/')) {
    console.log('Request:', request.method, request.url)
  }
})

server.listen(port)

console.log(`Server is running on http://${server.server?.hostname}:${port}`)

export type ServerType = typeof server

type ReplaceBaseUrlServerType<T extends Elysia, NewBaseUrl extends string> = T extends Elysia<
  infer _,
  infer P1,
  infer P2,
  infer P3,
  infer P4,
  infer P5,
  infer P6
>
  ? Elysia<NewBaseUrl, P1, P2, P3, P4, P5, P6>
  : never

export type APIGroupServerType = ReplaceBaseUrlServerType<ServerType, '/api'>
