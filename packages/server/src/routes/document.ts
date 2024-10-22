import { db } from '@/db'
import { apps, documents, users, usersToApps, usersToDocuments } from '@/db/schema'
import type { UserClaims } from '@/types'
import { and, count, eq, sql } from 'drizzle-orm'
import { t } from 'elysia'
import type { APIGroupServerType } from '..'

export async function addDocumentRoutes(appId: string, path: string, server: APIGroupServerType) {
  // get app's documents
  server.get(
    `${appId}/${path}`,
    async ({ query, params: { appId }, bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const cond = and(eq(documents.appId, appId), eq(documents.creatorId, user.id))
      const list = await db.query.documents.findMany({
        where: cond,
        offset: query.offset ?? 0,
        limit: query.limit ?? 10
      })
      const total = await db.select({ value: count() }).from(apps).where(cond)
      return { list, total: total[0].value }
    },
    {
      params: t.Object({
        appId: t.String()
      }),
      query: t.Object({
        offset: t.MaybeEmpty(t.Numeric()),
        limit: t.MaybeEmpty(t.Numeric())
      })
    }
  )

  // get my participated documents
  server.get(
    `${path}/participated`,
    async ({ query, bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const cond = eq(usersToDocuments.userId, user.id)
      const list = await db.query.usersToDocuments.findMany({
        where: cond,
        offset: query.offset ?? 0,
        limit: query.limit ?? 10
      })
      const total = await db.select({ value: count() }).from(usersToDocuments).where(cond)
      return { list, total: total[0].value }
    },
    {
      query: t.Object({
        offset: t.MaybeEmpty(t.Numeric()),
        limit: t.MaybeEmpty(t.Numeric())
      })
    }
  )

  // get a document and its participants
  server.get(
    `${appId}/${path}/:id`,
    async ({ params: { appId, id }, bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const document = await db.query.documents.findFirst({
        with: {
          participatedUsers: {
            columns: {
              id: true,
              nickname: true,
              username: true,
              avatar: true
            }
          }
        },
        where: and(eq(documents.appId, appId), eq(documents.creatorId, user.id), eq(documents.id, id))
      })
      return document
    },
    {
      params: t.Object({
        appId: t.String(),
        id: t.String()
      })
    }
  )

  // create a new document
  server.post(
    `${appId}/${path}`,
    async ({ body, params: { appId }, bearer, jwt, set }) => {
      const jwtUser = (await jwt.verify(bearer)) as UserClaims
      const user = await db.query.users.findFirst({
        where: eq(users.id, jwtUser.id)
      })
      // 检查应用名称是否已存在

      const existingDocument = await db.query.documents.findFirst({
        where: and(eq(documents.appId, appId), eq(documents.title, body.title))
      })

      if (existingDocument) {
        set.status = 400
        return 'The document title already exists'
      }
      // 检查用户创建的应用数量是否已达到上限
      const userDocumentsCount = await db.select({ count: count() })
        .from(documents)
        .where(and(eq(documents.appId, appId), eq(documents.creatorId, jwtUser.id)));

      if (userDocumentsCount[0].count >= (user!.documentsCount as number)) {
        set.status = 400
        return `You have reached the maximum number of documents you can create (${user!.documentsCount} documents)`
      }

      try {
        const ret = await db
          .insert(documents)
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
        return 'Failed to create document'
      }
    },
    {
      body: t.Object({
        title: t.String(),
        content: t.String()
      })
    }
  )

  // update a app
  server.put(
    `${appId}/${path}/:id`,
    async ({ body, params: { appId, id }, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      try {
        const ret = await db
          .update(documents)
          .set({
            ...body,
            updatedAt: sql`(datetime('now', 'localtime'))`
          })
          .where(and(eq(documents.appId, appId), eq(documents.creatorId, user.id), eq(documents.id, id)))
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
        appId: t.String(),
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
    `${appId}/${path}/:id`,
    async ({ params: { appId, id }, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      // check if the app has any documents
      const documentsCount = await db
        .select({ count: count() })
        .from(documents)
        .where(eq(documents.appId, appId))
      if (documentsCount[0].count > 0) {
        set.status = 400
        return 'The app has documents, please delete the documents first'
      }
      try {
        const ret = await db
          .delete(documents)
          .where(and(eq(documents.appId, appId), eq(documents.creatorId, user.id), eq(documents.id, id)))
          .returning()
        return ret.length > 0
      } catch (error) {
        set.status = 500
        return 'Failed to delete app'
      }
    },
    {
      params: t.Object({
        appId: t.String(),
        id: t.String()
      })
    }
  )
}
