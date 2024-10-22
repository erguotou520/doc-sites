import { db } from '@/db'
import { users } from '@/db/schema'
import type { ServerType, UserClaims } from '@/types'
import { eq } from 'drizzle-orm'
import { addAppRoutes } from './app'
import { addDocumentRoutes } from './document'
import { addLoginRoutes } from './login'
import { addRegisterRoutes } from './register'
import { addRenderRoutes } from './render'
import { addTagsRoutes } from './tags'
import { addUserRoutes } from './user'

export function registerAPIRoutes(server: ServerType) {
  server.get('/health', () => ({ status: 'ok' }))
  const disableRegistration = process.env.DISABLE_REGISTRATION === 'true'
  server.get('/info', () => {
    return {
      publicUrl: process.env.PUBLIC_URL ?? null,
      disableRegistration
    }
  })
  // register routes
  if (!disableRegistration) {
    addRegisterRoutes('/register', server)
  }
  addLoginRoutes('/login', server)
  server.group(
    '/api',
    {
      async beforeHandle({ bearer, jwt, set }) {
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
      addAppRoutes('/apps', app)
      addDocumentRoutes('/documents', app)
      addTagsRoutes('/tags', app)
      return app
    }
  )
  addRenderRoutes('/view', server)
}
