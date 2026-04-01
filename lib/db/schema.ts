import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  passwordHash: text("password_hash"),
  university: text("university"),
  course: text("course"),
  scholarScore: integer("scholar_score").default(0),
  tier: text("tier").default("Finding Your Feet"),
  streakDays: integer("streak_days").default(0),
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").default(sql`now()`),
})

export const accounts = pgTable("accounts", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
})

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
})

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
})

export const lectures = pgTable("lectures", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  aulaId: text("aula_id"),
  moduleId: text("module_id").notNull(),
  moduleName: text("module_name").notNull(),
  moduleColor: text("module_color"),
  title: text("title"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  room: text("room"),
  isOnline: boolean("is_online").default(false),
  attended: boolean("attended"),
  slidesUrl: text("slides_url"),
  summaryReady: boolean("summary_ready").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
})

export const summaries = pgTable("summaries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  lectureId: uuid("lecture_id").references(() => lectures.id, {
    onDelete: "cascade",
  }),
  tldr: text("tldr").array(),
  keyPoints: text("key_points").array(),
  examQuestions: text("exam_questions").array(),
  glossary: jsonb("glossary"),
  confidence: integer("confidence"),
  generatedAt: timestamp("generated_at").default(sql`now()`),
})

export const emails = pgTable("emails", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerMsgId: text("provider_msg_id").notNull(),
  fromName: text("from_name"),
  fromEmail: text("from_email").notNull(),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  aiSummary: text("ai_summary"),
  label: text("label").notNull(),
  draftReply: text("draft_reply"),
  urgency: text("urgency"),
  handledAt: timestamp("handled_at"),
  receivedAt: timestamp("received_at").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
})

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  aulaId: text("aula_id"),
  moduleName: text("module_name").notNull(),
  title: text("title").notNull(),
  dueDate: timestamp("due_date").notNull(),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
})

export const scoreEvents = pgTable("score_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  points: integer("points").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`now()`),
})

export const weeklyWraps = pgTable("weekly_wraps", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
  stats: jsonb("stats").notNull(),
  cardUrl: text("card_url"),
  shareCount: integer("share_count").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
})

export const morningBriefs = pgTable("morning_briefs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  briefDate: date("brief_date").notNull(),
  greeting: text("greeting"),
  dayRating: text("day_rating"),
  topPriority: text("top_priority"),
  data: jsonb("data"),
  createdAt: timestamp("created_at").default(sql`now()`),
})
