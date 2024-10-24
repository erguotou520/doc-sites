import { db } from '@/db'
import { apps, documents, users, usersParticipatedApps } from '@/db/schema'
import type { ServerType, UserClaims } from '@/types'
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { t } from 'elysia'

export async function addAppRoutes(path: string, server: ServerType) {
  // get all user's apps
  server.get(
    path,
    async ({ query, bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const cond = eq(apps.creatorId, user.id)
      const list = await db.query.apps.findMany({
        where: cond,
        offset: query.offset ?? 0,
        limit: query.limit ?? 10,
        orderBy: desc(apps.createdAt)
      })
      const total = await db.select({ value: count() }).from(apps).where(cond)
      return { list, total: total[0].value }
    },
    {
      query: t.Object({
        offset: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric())
      })
    }
  )

  // get my participated apps
  server.get(
    `${path}/participated`,
    async ({ bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const list = await db.query.usersParticipatedApps.findMany({
        where: eq(usersParticipatedApps.userId, user.id)
      })
      const result = await db.query.apps.findMany({
        where: inArray(apps.id, list.map((item) => item.appId))
      })
      return result
    }
  )

  // get a app and its participants
  server.get(
    `${path}/:id`,
    async ({ params, bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const app = await db.query.apps.findFirst({
        with: {
          participatedUsers: {
            with: {
              user: {
                columns: {
                  id: true,
                  nickname: true,
                  username: true,
                  avatar: true
                }
              }
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
      const jwtUser = (await jwt.verify(bearer)) as UserClaims
      const user = await db.query.users.findFirst({
        where: eq(users.id, jwtUser.id)
      })
      // check if name existed
      const existing = await db.query.apps.findFirst({
        where: eq(apps.name, body.name)
      })

      if (existing) {
        set.status = 400
        return 'The app name already exists'
      }
      // check if user reached the maximum number of apps
      const userAppsCount = await db.select({ count: count() })
        .from(apps)
        .where(eq(apps.creatorId, jwtUser.id));

      if (userAppsCount[0].count >= (user!.appsCount as number)) {
        set.status = 403
        return `You have reached the maximum number of apps you can create (${user!.appsCount} apps)`
      }

      try {
        const ret = await db
          .insert(apps)
          .values([
            {
              ...body,
              creatorId: user!.id
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
        title: t.String(),
        icon: t.Optional(t.String()),
        logo: t.Optional(t.String()),
        description: t.Optional(t.String())
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
        set.status = 500
        return 'Failed to update app'
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        logo: t.Optional(t.String()),
        favicon: t.Optional(t.String()),
        title: t.String(),
        description: t.Optional(t.String())
      })
    }
  )

  // invite users to an app
  server.post(
    `${path}/:id/invite`,
    async ({ body, params, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      // check if the user is the creator of the app
      const app = await db.query.apps.findFirst({
        where: and(eq(apps.creatorId, user.id), eq(apps.id, params.id))
      })
      if (!app) {
        set.status = 403
        return 'You are not the creator of this app'
      }
      if (!body.userIds.length) {
        set.status = 400
        return 'No users to invite'
      }
      // invite users to the app
      const ret = await db.insert(usersParticipatedApps).values(body.userIds.map((id) => ({
        userId: id,
        appId: params.id
      }))).returning()
      return ret.length > 0
    },
    {
      body: t.Object({
        userIds: t.Array(t.String())
      })
    }
  )

  // remove users from an app
  server.delete(
    `${path}/:id/removeUsers`,
    async ({ body, params, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      // check if the user is the creator of the app
      const app = await db.query.apps.findFirst({
        where: and(eq(apps.creatorId, user.id), eq(apps.id, params.id))
      })
      if (!app) {
        set.status = 403
        return 'You are not the creator of this app'
      }
      // remove users from the app
      const ret = await db.delete(usersParticipatedApps).where(and(eq(usersParticipatedApps.appId, params.id), inArray(usersParticipatedApps.userId, body.userIds))).returning()
      return ret.length > 0
    },
    {
      body: t.Object({
        userIds: t.Array(t.String())
      })
    }
  )

  // delete an app
  server.delete(
    `${path}/:id`,
    async ({ params, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      // check if the app has any documents
      const documentsCount = await db
        .select({ count: count() })
        .from(documents)
        .where(eq(documents.appId, params.id))
      if (documentsCount[0].count > 0) {
        set.status = 400
        return 'The app has documents, please delete the documents first'
      }
      try {
        // delete the users to app relation
        await db.delete(usersParticipatedApps).where(eq(usersParticipatedApps.appId, params.id))
        // delete the app
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
