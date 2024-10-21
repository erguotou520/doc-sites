import { db } from '@/db'
import { apps, organizations } from '@/db/schema'
import type { UserClaims } from '@/types'
import { generateWebhookUrl } from '@/utils/webhook'
import { v4 } from '@lukeed/uuid/secure'
import { and, count, eq, sql } from 'drizzle-orm'
import { t } from 'elysia'
import type { APIGroupServerType } from '..'

export async function addAppRoutes(path: string, server: APIGroupServerType) {
  // get all apps under the organization
  server.get(
    path,
    async ({ query, params, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const organization = await db.query.organizations.findFirst({
        where: and(eq(organizations.id, params.orgId), eq(organizations.creatorId, user.id))
      })
      if (!organization) {
        set.status = 404
        return 'Organization not found'
      }
      const list = await db.query.apps.findMany({
        where: eq(apps.organizationId, params.orgId),
        offset: query.offset ?? 0,
        limit: query.limit ?? 10
      })
      const total = await db.select({ value: count() }).from(apps).where(eq(apps.organizationId, params.orgId))
      return { list, total: total[0].value }
    },
    {
      params: t.Object({
        orgId: t.String()
      }),
      query: t.Object({
        offset: t.MaybeEmpty(t.Numeric()),
        limit: t.MaybeEmpty(t.Numeric())
      })
    }
  )

  // create a new app
  server.post(
    path,
    async ({ body, params, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const organization = await db.query.organizations.findFirst({
        where: and(eq(organizations.id, params.orgId), eq(organizations.creatorId, user.id))
      })
      if (!organization) {
        set.status = 404
        return 'Organization not found'
      }
      const sameApp = await db.query.apps.findFirst({
        where: and(eq(apps.name, body.name), eq(apps.organizationId, params.orgId))
      })
      if (sameApp) {
        set.status = 400
        return 'App already exists'
      }
      try {
        const id = v4()
        const ret = await db
          .insert(apps)
          .values([
            {
              ...body,
              id,
              organizationId: params.orgId,
              generatedWebhookUrl: generateWebhookUrl(body.upstreamRepoType, params.orgId, id)
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
      params: t.Object({
        orgId: t.String()
      }),
      body: t.Object({
        name: t.String(),
        upstreamRepoType: t.Enum({ Codeup: 'codeup' }),
        upstreamRepoUrl: t.MaybeEmpty(t.String()),
        upstreamSecretToken: t.MaybeEmpty(t.String()),
        giteaRepo: t.String(),
        giteaToken: t.MaybeEmpty(t.String()),
      })
    }
  )

  // update a app
  server.put(
    `${path}/:id`,
    async ({ body, params, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const organization = await db.query.organizations.findFirst({
        where: and(eq(organizations.id, params.orgId), eq(organizations.creatorId, user.id))
      })
      if (!organization) {
        set.status = 404
        return 'Organization not found'
      }
      try {
        const ret = await db.update(apps).set({
          ...body,
          generatedWebhookUrl: generateWebhookUrl(body.upstreamRepoType, params.orgId, params.id),
          updatedAt: sql`(datetime('now', 'localtime'))`
        }).where(eq(apps.id, params.id)).returning()
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
        id: t.String(),
        orgId: t.String()
      }),
      body: t.Object({
        name: t.String(),
        upstreamRepoType: t.Enum({ Codeup: 'codeup' }),
        upstreamRepoUrl: t.MaybeEmpty(t.String()),
        upstreamSecretToken: t.MaybeEmpty(t.String()),
        giteaRepo: t.String(),
        giteaToken: t.MaybeEmpty(t.String()),
      })
    }
  )

  // delete an app
  server.delete(`${path}/:id`, async ({ params, bearer, jwt, set }) => {
    const user = (await jwt.verify(bearer)) as UserClaims
    const organization = await db.query.organizations.findFirst({
      where: and(eq(organizations.id, params.orgId), eq(organizations.creatorId, user.id))
    })
    if (!organization) {
      set.status = 404
      return 'Organization not found'
    }
    try {
      const ret = await db.delete(apps).where(eq(apps.id, params.id)).returning()
      return ret.length > 0
    } catch (error) {
      set.status = 500
      return 'Failed to delete app'
    }
  }, {
    params: t.Object({
      id: t.String(),
      orgId: t.String()
    })
  })
}
