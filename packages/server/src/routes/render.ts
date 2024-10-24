import { db } from '@/db'
import { apps, documents, users } from '@/db/schema'
import type { UserClaims } from '@/types'
import type { ServerType } from '@/types'
import { eq } from 'drizzle-orm'
import { t } from 'elysia'

export async function addRenderRoutes(path: string, server: ServerType) {
  // get a document and its editors
  server.get(
    `${path}/:appName/:slug`,
    async ({ params: { appName, slug }, bearer, jwt, set }) => {
      const app = await db.query.apps.findFirst({
        where: eq(apps.name, appName),
        with: {
          documents: {
            where: eq(documents.slug, slug),
            with: {
              template: true,
              invitedUsers: true,
              app: {
                with: {
                  participatedUsers: true
                }
              }
            }
          }
        }
      })
      if (!app || app.documents.length === 0) {
        set.status = 404
        return 'Document not found'
      }
      const document = app.documents[0]
      if (document.viewPermission !== 'public') {
        const jwtUser = (await jwt.verify(bearer)) as UserClaims
        if (!jwtUser) {
          set.status = 401
          return 'Unauthorized'
        }
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, jwtUser.id)
        })
        if (!dbUser) {
          set.status = 401
          return 'Unauthorized'
        }
        if (document.viewPermission === 'editable') {
          // check if the user is the creator or the editor or the invited user or the participated app
          if (
            document.creatorId !== jwtUser.id &&
            !document.invitedUsers.some(u => u.userId === jwtUser.id) &&
            !document.app?.participatedUsers.some(u => u.userId === jwtUser.id)
          ) {
            set.status = 403
            return 'Forbidden'
          }
        }
      }
      set.headers['Content-Type'] = 'text/html'
      if (!document.template) {
        return document.content
      }
      const html = document.template.htmlContent
        .replaceAll('{{appName}}', appName)
        .replaceAll('{{title}}', document.title)
        .replaceAll('{{content}}', document.content)
        .replaceAll('{{favicon}}', app.favicon ?? '/_static/default.favicon.png')
      return html
    },
    {
      params: t.Object({
        appName: t.String(),
        slug: t.String()
      })
    }
  )
}
