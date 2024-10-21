import { v4 } from '@lukeed/uuid/secure'
import { relations, sql } from 'drizzle-orm'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export function genUUID() {
  return text('id')
    .primaryKey()
    .$defaultFn(() => v4())
}

function commonColumns() {
  return {
    id: genUUID(),
    createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now', 'localtime'))`)
  }
}

export const users = sqliteTable('users', {
  ...commonColumns(),
  username: text('username').unique().notNull(),
  nickname: text('nickname'),
  hashedPassword: text('hashed_password').notNull()
})
export const apps = sqliteTable('apps', {
  ...commonColumns(),
  name: text('name').unique().notNull(),
  logo: text('logo'),
  description: text('description'),
  invitedUsers: text('invited_users'),
  documents: text('documents')
})

export const documents = sqliteTable('documents', {
  ...commonColumns(),
  title: text('title').notNull(),
  publishTime: text('publish_time').default(sql`(datetime('now', 'localtime'))`),
  templateId: text('template_id').references(() => templates.id),
  content: text('content').notNull(),
  lastEditTime: text('last_edit_time'),
  lastEditorId: text('last_editor_id').references(() => users.id),
  appId: text('app_id').references(() => apps.id)
})

export const templates = sqliteTable('templates', {
  ...commonColumns(),
  title: text('title').notNull(),
  previewImage: text('preview_image'),
  htmlContent: text('html_content').notNull()
})

export const usersRelations = relations(users, ({ many }) => ({
  apps: many(apps),
  documents: many(documents)
}))

export const appsRelations = relations(apps, ({ many }) => ({
  documents: many(documents),
  invitedUsers: many(users)
}))

export const documentsRelations = relations(documents, ({ one, many }) => ({
  app: one(apps, {
    fields: [documents.appId],
    references: [apps.id]
  }),
  lastEditor: one(users, {
    fields: [documents.lastEditorId],
    references: [users.id]
  }),
  template: one(templates, {
    fields: [documents.templateId],
    references: [templates.id]
  })
}))
