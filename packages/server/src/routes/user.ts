import { db } from '@/db'
import { users } from '@/db/schema'
import type { ServerType, UserClaims } from '@/types'
import { eq, sql } from 'drizzle-orm'
import { t } from 'elysia'

export async function addUserRoutes(path: string, server: ServerType) {
  // get all apps created by the user
  server.get(`${path}/me`, async ({ bearer, jwt }) => {
    const user = (await jwt.verify(bearer)) as UserClaims
    return user
  })

  // update my profile
  server.put(`${path}/me`, async ({ body, bearer, jwt }) => {
    const user = (await jwt.verify(bearer)) as UserClaims
    const ret = await db.update(users).set({
        ...body,
        updatedAt: sql`(datetime('now', 'localtime'))`
      })
      .where(eq(users.id, user.id))
      .returning()
    return ret[0]
  },
  {
    body: t.Object({
      nickname: t.MaybeEmpty(t.String()),
      avatar: t.MaybeEmpty(t.String())
    })
  })
}
