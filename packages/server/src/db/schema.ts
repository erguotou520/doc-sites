import { v4 } from '@lukeed/uuid/secure'
import { relations, sql } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
  hashedPassword: text('hashed_password').notNull(),
  avatar: text('avatar'),
  role: text('role', { enum: ['admin', 'user'] }).default('user'),
  appsCount: integer('apps_count').default(10),
  documentsCount: integer('documents_count').default(20)
})

export const usersRelations = relations(users, ({ many }) => ({
  apps: many(apps),
  participatedApps: many(apps),
  participatedDocuments: many(documents)
}))

export const apps = sqliteTable('apps', {
  ...commonColumns(),
  name: text('name').unique().notNull(),
  logo: text('logo'),
  title: text('title').notNull(),
  description: text('description'),
  creatorId: text('creator_id').references(() => users.id)
})

export const appsRelations = relations(apps, ({ one, many }) => ({
  creator: one(users, {
    fields: [apps.creatorId],
    references: [users.id]
  }),
  documents: many(documents),
  invitedUsers: many(users)
}))

export const usersToApps = sqliteTable(
  'users_to_apps',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    appId: text('app_id')
      .notNull()
      .references(() => apps.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.appId] })
  })
)

export const usersToAppsRelations = relations(usersToApps, ({ one }) => ({
  app: one(apps, {
    fields: [usersToApps.appId],
    references: [apps.id],
  }),
  user: one(users, {
    fields: [usersToApps.userId],
    references: [users.id],
  })
}))

export const usersToDocuments = sqliteTable('users_to_documents', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id)
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.documentId] })
  })
)

export const usersToDocumentsRelations = relations(usersToDocuments, ({ one }) => ({
  document: one(documents, {
    fields: [usersToDocuments.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [usersToDocuments.userId],
    references: [users.id],
  })
}))

export const templates = sqliteTable('templates', {
  ...commonColumns(),
  name: text('name').unique().notNull(),
  previewImage: text('preview_image'),
  htmlContent: text('html_content').notNull()
})

export const documents = sqliteTable('documents', {
  ...commonColumns(),
  title: text('title').notNull(),
  // 为空表示草稿
  publishTime: text('publish_time'),
  templateId: text('template_id').references(() => templates.id),
  // 富文本
  content: text('content').notNull(),
  creatorId: text('creator_id').references(() => users.id),
  lastEditTime: text('last_edit_time'),
  lastEditorId: text('last_editor_id').references(() => users.id),
  appId: text('app_id').references(() => apps.id),
})

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
  }),
  participatedUsers: many(users)
}))
