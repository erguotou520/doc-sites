import { db } from '@/db'
import { apps } from '@/db/schema'
import type { UserClaims } from '@/types'
import { and, count, eq, sql } from 'drizzle-orm'
import { t } from 'elysia'
import type { APIGroupServerType } from '..'

export async function addAppRoutes(path: string, server: APIGroupServerType) {
  // get all user's apps
  server.get(
    path,
    async ({ query, bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const cond = eq(apps.creatorId, user.id)
      const list = await db.query.apps.findMany({
        where: cond,
        offset: query.offset ?? 0,
        limit: query.limit ?? 10
      })
      const total = await db.select({ value: count() }).from(apps).where(cond)
      return { list, total: total[0].value }
    },
    {
      query: t.Object({
        offset: t.MaybeEmpty(t.Numeric()),
        limit: t.MaybeEmpty(t.Numeric())
      })
    }
  )

  // get a app and its participants
  server.get(
    `${path}/:id`,
    async ({ params, bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const app = await db.query.apps.findFirst({
        with: {
          invitedUsers: {
            columns: {
              id: true,
              nickname: true,
              username: true,
              avatar: true
            }
          }
        },
        where: and(eq(apps.creatorId, user.id), eq(apps.id, params.id))
      })
      return app
    }
  )

  // create a new app
  server.post(
    path,
    async ({ body, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      // 检查应用名称是否已存在
      const existingApp = await db.query.apps.findFirst({
        where: eq(apps.name, body.name)
      })

      if (existingApp) {
        set.status = 400
        return '应用名称已存在'
      }
      try {
        const ret = await db
          .insert(apps)
          .values([
            {
              ...body,
              creatorId: user.id
            }
          ])
          .returning()
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 400
        return 'Failed to create app'
      }
    },
    {
      body: t.Object({
        name: t.String(),
        logo: t.MaybeEmpty(t.String()),
        description: t.MaybeEmpty(t.String())
      })
    }
  )

  // update a app
  server.put(
    `${path}/:id`,
    async ({ body, params, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      try {
        const ret = await db
          .update(apps)
          .set({
            ...body,
            updatedAt: sql`(datetime('now', 'localtime'))`
          })
          .where(and(eq(apps.creatorId, user.id), eq(apps.id, params.id)))
          .returning()
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 400
        return 'Failed to update app'
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        logo: t.MaybeEmpty(t.String()),
        description: t.MaybeEmpty(t.String())
      })
    }
  )

  // delete an app
  server.delete(
    `${path}/:id`,
    async ({ params, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      try {
        const ret = await db.delete(apps).where(and(eq(apps.creatorId, user.id), eq(apps.id, params.id))).returning()
        return ret.length > 0
      } catch (error) {
        set.status = 500
        return 'Failed to delete app'
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )
}
