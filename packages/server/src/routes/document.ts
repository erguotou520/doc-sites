import { db } from '@/db'
import { apps, documents, userEditedDocuments, userInvitedDocuments, users, usersParticipatedApps } from '@/db/schema'
import type { ServerType, UserClaims } from '@/types'
import { and, count, eq, exists, or, sql } from 'drizzle-orm'
import { t } from 'elysia'

export async function addDocumentRoutes(path: string, server: ServerType) {
  // get app's documents
  server.get(
    `/${path}/:appId`,
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

  // get my invited documents
  server.get(
    `${path}/invited`,
    async ({ query, bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const cond = eq(userEditedDocuments.userId, user.id)
      const list = await db.query.userInvitedDocuments.findMany({
        where: cond,
        offset: query.offset ?? 0,
        limit: query.limit ?? 10
      })
      const total = await db.select({ value: count() }).from(userEditedDocuments).where(cond)
      return { list, total: total[0].value }
    },
    {
      query: t.Object({
        offset: t.MaybeEmpty(t.Numeric()),
        limit: t.MaybeEmpty(t.Numeric())
      })
    }
  )

  // get a document and its editors
  server.get(
    `/${path}/:appId/:id`,
    async ({ params: { appId, id }, bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const document = await db.query.documents.findFirst({
        with: {
          lastEditor: {
            columns: {
              id: true,
              nickname: true,
              username: true,
              avatar: true
            }
          },
          editedUsers: {
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
    `/${path}/:appId`,
    async ({ body: { publish, ...body }, params: { appId }, bearer, jwt, set }) => {
      const jwtUser = (await jwt.verify(bearer)) as UserClaims
      const user = await db.query.users.findFirst({
        where: eq(users.id, jwtUser.id)
      })
      // check if the app exists
      const app = await db.query.apps.findFirst({
        where: or(
          eq(apps.id, appId),
          exists(
            db.select()
              .from(usersParticipatedApps)
              .where(and(
                eq(usersParticipatedApps.appId, appId),
                eq(usersParticipatedApps.userId, jwtUser.id)
              ))
          )
        )
      })
      if (!app) {
        set.status = 400
        return 'The app does not exist'
      }

      const existingDocument = await db.query.documents.findFirst({
        where: and(eq(documents.appId, appId), eq(documents.title, body.title))
      })

      if (existingDocument) {
        set.status = 400
        return 'The document title already exists'
      }
      // check if the user has reached the maximum number of documents they can create
      const userDocumentsCount = await db
        .select({ count: count() })
        .from(documents)
        .where(and(eq(documents.appId, appId), eq(documents.creatorId, jwtUser.id)))

      if (userDocumentsCount[0].count >= (user!.documentsCount as number)) {
        set.status = 403
        return `You have reached the maximum number of documents you can create (${user!.documentsCount} documents)`
      }

      try {
        const ret = await db
          .insert(documents)
          .values([
            {
              ...body,
              appId,
              creatorId: user!.id,
              publishTime: publish ? sql`(datetime('now', 'localtime'))` : null,
              lastEditTime: sql`(datetime('now', 'localtime'))`,
              lastEditorId: user!.id,
            }
          ])
          .returning()
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 500
        return 'Failed to create document'
      }
    },
    {
      params: t.Object({
        appId: t.String()
      }),
      body: t.Object({
        title: t.String(),
        content: t.String(),
        templateId: t.String(),
        slug: t.String(),
        publish: t.Boolean()
      })
    }
  )

  // update a document setting
  server.put(
    `/${path}/:appId/:id`,
    async ({ body: { publish, ...body }, params: { appId, id }, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const document = await db.query.documents.findFirst({
        where: and(eq(documents.appId, appId), eq(documents.creatorId, user.id), eq(documents.id, id))
      })
      if (!document) {
        set.status = 404
        return 'The document does not exist'
      }
      try {
        if (publish && !document.publishTime) {
          // @ts-ignore
          body.publishTime = sql`(datetime('now', 'localtime'))`
        } else if (!publish && document.publishTime) {
          // @ts-ignore
          body.publishTime = null
        }
        const ret = await db
          .update(documents)
          .set({
            ...body,
            updatedAt: sql`(datetime('now', 'localtime'))`,
          })
          .where(eq(documents.id, id))
          .returning()
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 500
        return 'Failed to update document'
      }
    },
    {
      params: t.Object({
        appId: t.String(),
        id: t.String()
      }),
      body: t.Object({
        title: t.String(),
        templateId: t.String(),
        slug: t.String(),
        publish: t.MaybeEmpty(t.Boolean())
      })
    }
  )

  // update a document content
  server.put(
    `/${path}/:appId/:id/content`,
    async ({ body: { content }, params: { appId, id }, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      // 检查用户是否有权限编辑该文档
      const document = await db.query.documents.findFirst({
        where: and(eq(documents.appId, appId), eq(documents.id, id)),
        with: {
          app: {
            with: {
              participatedUsers: true
            }
          },
          invitedUsers: true,
          editedUsers: true
        }
      })

      if (!document) {
        set.status = 404
        return '文档不存在'
      }

      // 检查用户是否为文档发起人、所属App的参与人或文档的邀请人
      const canEdit = document.creatorId === user.id ||
                      document.app?.participatedUsers.some(u => u.userId === user.id) ||
                      document.invitedUsers.some(u => u.userId === user.id)

      if (!canEdit) {
        set.status = 403
        return '您没有权限编辑此文档'
      }

      try {
        const ret = await db.update(documents).set({
          content,
          lastEditTime: sql`(datetime('now', 'localtime'))`,
          lastEditorId: user.id
        }).where(eq(documents.id, id)).returning()
        // record the editor if not exists
        if (!document.editedUsers.some(u => u.userId === user.id)) {
          await db.insert(userEditedDocuments).values({
            documentId: id,
            userId: user.id
          })
        }
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 500
        return 'Failed to update document content'
      }
    },
    {
      params: t.Object({
        appId: t.String(),
        id: t.String()
      }),
      body: t.Object({
        content: t.String()
      })
    }
  )

  // delete an document, only the creator can delete it
  server.delete(
    `/${path}/:appId/:id`,
    async ({ params: { appId, id }, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
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

  // invite users to a document
  server.post(
    `/${path}/:appId/:id/invite`,
    async ({ body, params: { appId, id }, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      // check if the document exists
      const document = await db.query.documents.findFirst({
        where: and(eq(documents.appId, appId), eq(documents.id, id)),
        with: {
          invitedUsers: true
        }
      })
      if (!document) {
        set.status = 404
        return 'The document does not exist'
      }
      if (document.creatorId !== user.id) {
        set.status = 403
        return 'Only the creator can invite users to a document'
      }
      // remove the users that already invited
      const usersToInvite = body.userIds.filter(userId => !document.invitedUsers.some(u => u.userId === userId))
      try {
        const ret = await db.insert(userInvitedDocuments).values(usersToInvite.map(userId => ({
          documentId: id,
          userId
        }))).returning()
        return ret.length > 0
      } catch (error) {
        set.status = 500
        return 'Failed to invite users to a document'
      }
    },
    {
      params: t.Object({
        appId: t.String(),
        id: t.String()
      }),
      body: t.Object({
        userIds: t.Array(t.String())
      })
    }
  )
}
