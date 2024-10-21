import { db } from '@/db'
import { users } from '@/db/schema'
import type { UserClaims } from '@/types'
import { eq } from 'drizzle-orm'
import type { ServerType } from '..'
import { addAppRoutes } from './app'
import { addLoginRoutes } from './login'
import { addRegisterRoutes } from './register'
import { addUserRoutes } from './user'

export function registerAPIRoutes(server: ServerType) {
  server.get('/health', () => ({ status: 'ok' }))
  if (process.env.DISABLE_REGISTRATION !== 'true') {
    addRegisterRoutes('/register', server)
  }
  addLoginRoutes('/login', server)
  server.group(
    '/api',
    {
      async beforeHandle({ bearer, jwt, set, store }) {
        if (!bearer) {
          set.status = 401
          return 'Unauthorized'
        }
        const jwtUser = (await jwt.verify(bearer)) as UserClaims
        const user = await db.query.users.findFirst({
          where: eq(users.id, jwtUser.id)
        })
        if (!user) {
          set.status = 401
          return 'Unauthorized'
        }
        // store['user'] = user
      }
    },
    app => {
      addUserRoutes('/user', app)
      addAppRoutes('/apps/:orgId', app)
      return app
    }
  )

  server.get('/info', () => {
    return {
      publicUrl: process.env.PUBLIC_URL ?? null,
      disableRegistration: process.env.DISABLE_REGISTRATION === 'true'
    }
  })
}
