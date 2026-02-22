import { relations } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url").notNull().default(""),
  passwordHash: text("password_hash").notNull().default(""),
  authProvider: text("auth_provider", { enum: ["local", "google"] })
    .notNull()
    .default("local"),
  googleId: text("google_id").notNull().default(""),
  role: text("role", { enum: ["participant", "admin"] })
    .notNull()
    .default("participant"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const usersEmailUnique = uniqueIndex("users_email_unique").on(
  users.email,
);

export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  previewVideoUrl: text("preview_video_url").notNull().default(""),
  price: real("price").notNull().default(0),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const coursesSlugUnique = uniqueIndex("courses_slug_unique").on(
  courses.slug,
);

export const chapters = sqliteTable("chapters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const materials = sqliteTable("materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chapterId: integer("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type", {
    enum: ["video", "text", "pdf", "quiz", "assignment"],
  }).notNull(),
  body: text("body").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  assetUrl: text("asset_url").notNull().default(""),
  orderIndex: integer("order_index").notNull().default(0),
});

export const enrollments = sqliteTable("enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  enrolledAt: integer("enrolled_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const enrollmentUnique = uniqueIndex(
  "enrollments_user_course_unique",
).on(enrollments.userId, enrollments.courseId);

export const materialCompletions = sqliteTable("material_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  materialId: integer("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  completedAt: integer("completed_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const materialCompletionUnique = uniqueIndex(
  "material_completion_unique",
).on(materialCompletions.userId, materialCompletions.materialId);

export const quizzes = sqliteTable("quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  materialId: integer("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
});

export const quizOptions = sqliteTable("quiz_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quizId: integer("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quizId: integer("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  selectedOptionId: integer("selected_option_id")
    .notNull()
    .references(() => quizOptions.id, { onDelete: "cascade" }),
  isCorrect: integer("is_correct", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  materialId: integer("material_id")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  instruction: text("instruction").notNull(),
});

export const assignmentSubmissions = sqliteTable("assignment_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assignmentId: integer("assignment_id")
    .notNull()
    .references(() => assignments.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  submissionUrl: text("submission_url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const assignmentSubmissionUnique = uniqueIndex(
  "assignment_submission_unique",
).on(assignmentSubmissions.assignmentId, assignmentSubmissions.userId);

export const certificates = sqliteTable("certificates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const certificateUnique = uniqueIndex("certificate_unique").on(
  certificates.userId,
  certificates.courseId,
);

export const mediaAssets = sqliteTable("media_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", {
    enum: ["video", "thumbnail", "pdf", "template"],
  }).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const coursesRelations = relations(courses, ({ many, one }) => ({
  creator: one(users, { fields: [courses.createdBy], references: [users.id] }),
  chapters: many(chapters),
  enrollments: many(enrollments),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  course: one(courses, {
    fields: [chapters.courseId],
    references: [courses.id],
  }),
  materials: many(materials),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  chapter: one(chapters, {
    fields: [materials.chapterId],
    references: [chapters.id],
  }),
}));
