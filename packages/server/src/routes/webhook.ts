import { db } from '@/db'
import { apps, organizations } from '@/db/schema'
import { syncGiteaRepo } from '@/utils'
import { eq } from 'drizzle-orm'
import { t } from 'elysia'
import type { ServerType } from '..'

export async function addWebhookRoutes(path: string, server: ServerType) {
  server.post(
    `${path}/:organizationId/:appId/codeup`,
    async ({ request, params, headers, set, log }) => {
      if (process.env.ENABLE_LOG_IP === 'true') {
        let ip: string | undefined
        if (headers['x-forwarded-for']) {
          ip = headers['x-forwarded-for']
        } else if (headers['x-real-ip']) {
          ip = headers['x-real-ip']
        } else {
          ip = server.server?.requestIP(request)?.address
        }
        log.info(`Received codeup event from: ${ip || 'unknown'}`)
      }
      const { organizationId, appId } = params
      const codeupEvent = headers['x-codeup-event']
      if (codeupEvent !== 'Push Hook' && codeupEvent !== 'Tag Push Hook') {
        log.info(`Ignore event: ${codeupEvent}`)
        return {}
      }

      const _organization = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)
      if (_organization.length < 1) {
        set.status = 404
        return 'Organization not found'
      }
      const organization = _organization[0]
      const _app = await db.select().from(apps).where(eq(apps.id, appId)).limit(1)
      if (_app.length < 1) {
        set.status = 404
        return 'App not found'
      }
      const app = _app[0]
      // has valid header token?
      if (app.upstreamSecretToken) {
        if (app.upstreamSecretToken !== headers['x-codeup-token']) {
          set.status = 401
          return 'Invalid token'
        }
      }

      const giteaUrl = organization.giteaUrl || process.env.GITEA_URL
      const giteaToken = app.giteaToken || organization.giteaToken || process.env.GITEA_TOKEN
      if (!giteaUrl ||!giteaToken) {
        set.status = 400
        return 'Gitea url or token not found'
      }
      const ret = await syncGiteaRepo(giteaUrl, app.giteaRepo, giteaToken)
      if (!ret.success) {
        log.error(ret)
      } else {
        log.info('success')
      }
      return ret
    },
    {
      params: t.Object({
        organizationId: t.String(),
        appId: t.String(),
      })
    }
  )
}
