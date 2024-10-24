import { eq } from 'drizzle-orm'
import { db } from './'
import * as schema from './schema'

const adminUser = await db.query.users.findFirst({
  where: eq(schema.users.username, 'admin')
})

if (!adminUser) {
  await db.insert(schema.users).values([
    {
      username: 'admin',
      nickname: 'Admin',
      hashedPassword: await Bun.password.hash('Pa$$wo2d'),
      role: 'admin'
    }
  ])
}

const tags = await db.query.tags.findMany()
if (tags.length === 0) {
  await db.insert(schema.tags).values([
    { name: '用户服务协议', color: '#8F8FBD' },
    { name: '隐私政策', color: '#E9C2A6' },
    { name: '关于我们', color: '#238E68' }
  ])
}

const templates = await db.query.templates.findMany()
if (templates.length === 0) {
  const mobileTemplate = await Bun.file('./db/seed/templates/mobile.html').text()
  await db.insert(schema.templates).values([
    {
      name: '通用页面',
      previewImage: '/_static/mobile.preview.png',
      htmlContent: mobileTemplate
    }
  ])
}

console.log('Seeding complete.')
