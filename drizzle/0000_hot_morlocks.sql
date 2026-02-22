CREATE TABLE `assignment_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assignment_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`submission_url` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`material_id` integer NOT NULL,
	`instruction` text NOT NULL,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`course_id` integer NOT NULL,
	`file_url` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer NOT NULL,
	`title` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`thumbnail_url` text DEFAULT '' NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`course_id` integer NOT NULL,
	`enrolled_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `material_completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`material_id` integer NOT NULL,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chapter_id` integer NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`video_url` text DEFAULT '' NOT NULL,
	`asset_url` text DEFAULT '' NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`file_name` text NOT NULL,
	`file_url` text NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quiz_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`selected_option_id` integer NOT NULL,
	`is_correct` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`selected_option_id`) REFERENCES `quiz_options`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quiz_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quiz_id` integer NOT NULL,
	`option_text` text NOT NULL,
	`is_correct` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`material_id` integer NOT NULL,
	`question` text NOT NULL,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'participant' NOT NULL,
	`created_at` integer NOT NULL
);
