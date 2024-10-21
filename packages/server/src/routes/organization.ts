import { db } from '@/db'
import { organizations } from '@/db/schema'
import type { UserClaims } from '@/types'
import { and, eq, sql } from 'drizzle-orm'
import { t } from 'elysia'
import type { APIGroupServerType } from '..'

export async function addOrganizationRoutes(path: string, server: APIGroupServerType) {
  // get all organizations created by the user
  server.get(
    path,
    async ({ bearer, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const list = await db.query.organizations.findMany({
        where: eq(organizations.creatorId, user.id),
      })
      return list
    }
  )

  // get one organization by id
  server.get(
    `${path}/:id`,
    async ({ bearer, params, jwt }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const ret = await db.query.organizations.findMany({
        where: and(eq(organizations.creatorId, user.id), eq(organizations.id, params.id)),
      })
      return ret.length ? ret[0] : null
    }, {
      params: t.Object({
        id: t.String()
      })
    }
  )

  // create a new organization
  server.post(
    path,
    async ({ body, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const sameOrganization = await db.query.organizations.findFirst({
        where: and(eq(organizations.name, body.name), eq(organizations.creatorId, user.id))
      })
      if (sameOrganization) {
        set.status = 400
        return 'Organization already exists'
      }
      try {
        const ret = await db
          .insert(organizations)
          .values([
            {
              creatorId: user.id,
              ...body
            }
          ])
          .returning()
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 400
        return 'Failed to create organization'
      }
    },
    {
      body: t.Object({
        name: t.String(),
        giteaUrl: t.String(),
        giteaToken: t.MaybeEmpty(t.String()),
      })
    }
  )

  // update a organization
  server.put(
    `${path}/:id`,
    async ({ body, params, bearer, jwt, set }) => {
      const user = (await jwt.verify(bearer)) as UserClaims
      const organization = await db.query.organizations.findFirst({
        where: and(eq(organizations.id, params.id), eq(organizations.creatorId, user.id))
      })
      if (!organization) {
        set.status = 404
        return 'Organization not found'
      }
      try {
        const ret = await db.update(organizations).set({
          ...body,
          updatedAt: sql`(datetime('now', 'localtime'))`
        }).where(eq(organizations.id, params.id)).returning()
        if (ret.length > 0) {
          return ret[0]
        }
        return false
      } catch (error) {
        set.status = 400
        return 'Failed to update organization'
      }
    },
    {
      body: t.Object({
        name: t.String(),
        giteaUrl: t.String(),
        giteaToken: t.MaybeEmpty(t.String()),
      })
    }
  )

  // delete an organization
  server.delete(`${path}/:id`, async ({ params, bearer, jwt, set }) => {
    const user = (await jwt.verify(bearer)) as UserClaims
    const organization = await db.query.organizations.findFirst({
      where: and(eq(organizations.id, params.id), eq(organizations.creatorId, user.id))
    })
    if (!organization) {
      set.status = 404
      return 'Organization not found'
    }
    try {
      const ret = await db.delete(organizations).where(eq(organizations.id, params.id)).returning()
      return ret.length > 0
    } catch (error) {
      set.status = 500
      return 'Failed to delete organization'
    }
  })
}
