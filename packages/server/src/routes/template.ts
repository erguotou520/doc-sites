import { db } from '@/db'
import { documents, templates } from '@/db/schema'
import type { ServerType } from '@/types'
import { isAdmin } from '@/utils'
import { count, eq, sql } from 'drizzle-orm'
import { t } from 'elysia'

export async function addTemplateRoutes(path: string, server: ServerType) {
  // get all templates
  server.get(
    path,
    async ({ query }) => {
      const list = await db.query.templates.findMany({
        offset: query.offset ?? 0,
        limit: query.limit ?? 10
      })
      const total = await db.select({ value: count() }).from(templates)
      return { list, total: total[0].value }
    },
    {
      query: t.Object({
        offset: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric())
      })
    }
  )

  // create a new template
  server.post(
    path,
    async ({ body, set }) => {
      // check if the template name already exists
      const existingTemplate = await db.query.templates.findFirst({
        where: eq(templates.name, body.name)
      })

      if (existingTemplate) {
        set.status = 400
        return 'The template name already exists'
      }

      try {
        const ret = await db.insert(templates).values([body]).returning()
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 400
        return 'Failed to create template'
      }
    },
    {
      beforeHandle: isAdmin,
      body: t.Object({
        name: t.String(),
        previewImage: t.Optional(t.String()),
        htmlContent: t.String()
      })
    }
  )

  // update a template
  server.put(
    `${path}/:id`,
    async ({ body, params, set }) => {
      try {
        const ret = await db
          .update(templates)
          .set({
            ...body,
            updatedAt: sql`(datetime('now', 'localtime'))`
          })
          .where(eq(templates.id, params.id))
          .returning()
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 400
        return 'Failed to update template'
      }
    },
    {
      beforeHandle: isAdmin,
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        previewImage: t.Optional(t.String()),
        htmlContent: t.String()
      })
    }
  )

  // delete a template
  server.delete(
    `${path}/:id`,
    async ({ params, set }) => {
      // check if the template has any documents
      const documentsCount = await db
        .select({ count: count() })
        .from(documents)
        .where(eq(documents.templateId, params.id))
      if (documentsCount[0].count > 0) {
        set.status = 400
        return 'The template has documents, please delete the documents first'
      }
      try {
        const ret = await db.delete(templates).where(eq(templates.id, params.id)).returning()
        return ret.length > 0
      } catch (error) {
        set.status = 500
        return 'Failed to delete template'
      }
    },
    {
      beforeHandle: isAdmin,
      params: t.Object({
        id: t.String()
      })
    }
  )
}
