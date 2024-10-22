import { db } from '@/db'
import { tags } from '@/db/schema'
import type { ServerType } from '@/types'
import { isAdmin } from '@/utils'
import { count, eq, sql } from 'drizzle-orm'
import { t } from 'elysia'

export async function addTagsRoutes(path: string, server: ServerType) {
  // get all tags
  server.get(
    path,
    async ({ query }) => {
      const list = await db.query.tags.findMany({
        offset: query.offset ?? 0,
        limit: query.limit ?? 10
      })
      const total = await db.select({ value: count() }).from(tags)
      return { list, total: total[0].value }
    },
    {
      // @ts-ignore
      beforeHandle: isAdmin,
      query: t.Object({
        offset: t.MaybeEmpty(t.Numeric()),
        limit: t.MaybeEmpty(t.Numeric())
      })
    }
  )

  // create a new tag
  server.post(
    path,
    async ({ body, set }) => {
      // check if name existed
      const existing = await db.query.tags.findFirst({
        where: eq(tags.name, body.name)
      })

      if (existing) {
        set.status = 400
        return 'The app name already exists'
      }

      try {
        const ret = await db.insert(tags).values([body]).returning()
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 400
        return 'Failed to create tag'
      }
    },
    {
      // @ts-ignore
      beforeHandle: isAdmin,
      body: t.Object({
        name: t.String(),
        color: t.MaybeEmpty(t.String()),
        category: t.Any([t.Literal('document')]),
        remark: t.MaybeEmpty(t.String())
      })
    }
  )

  // update a tag
  server.put(
    `${path}/:id`,
    async ({ body, params, set }) => {
      try {
        const ret = await db
          .update(tags)
          .set({
            ...body,
            updatedAt: sql`(datetime('now', 'localtime'))`
          })
          .where(eq(tags.id, params.id))
          .returning()
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 500
        return 'Failed to update tag'
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        name: t.String(),
        color: t.MaybeEmpty(t.String()),
        category: t.Any([t.Literal('document')]),
        remark: t.MaybeEmpty(t.String())
      })
    }
  )

  // delete an tag
  server.delete(
    `${path}/:id`,
    async ({ params, set }) => {
      try {
        // delete the tag
        const ret = await db.delete(tags).where(eq(tags.id, params.id)).returning()
        return ret.length > 0
      } catch (error) {
        set.status = 500
        return 'Failed to delete tag'
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )
}
