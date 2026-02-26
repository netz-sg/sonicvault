CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`mbid` text,
	`release_mbid` text,
	`artist_id` text,
	`title` text NOT NULL,
	`release_date` text,
	`type` text,
	`label` text,
	`catalog_number` text,
	`country` text,
	`track_count` integer,
	`cover_url` text,
	`cover_small` text,
	`genres` text,
	`metadata_status` text DEFAULT 'pending',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`id` text PRIMARY KEY NOT NULL,
	`mbid` text,
	`name` text NOT NULL,
	`sort_name` text,
	`type` text,
	`country` text,
	`begin_date` text,
	`end_date` text,
	`biography` text,
	`image_url` text,
	`background_url` text,
	`genres` text,
	`tags` text,
	`metadata_status` text DEFAULT 'pending',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `file_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`track_id` text,
	`operation` text NOT NULL,
	`source_path` text NOT NULL,
	`target_path` text,
	`details` text,
	`status` text DEFAULT 'completed',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `source_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`label` text,
	`auto_scan` integer DEFAULT 0,
	`auto_organize` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`mbid` text,
	`album_id` text,
	`artist_id` text,
	`title` text NOT NULL,
	`track_number` integer,
	`disc_number` integer DEFAULT 1,
	`duration_ms` integer,
	`file_path` text,
	`file_format` text,
	`bitrate` integer,
	`sample_rate` integer,
	`lyrics_plain` text,
	`lyrics_synced` text,
	`acoustid` text,
	`metadata_status` text DEFAULT 'pending',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `albums_mbid_unique` ON `albums` (`mbid`);--> statement-breakpoint
CREATE UNIQUE INDEX `artists_mbid_unique` ON `artists` (`mbid`);--> statement-breakpoint
CREATE UNIQUE INDEX `source_folders_path_unique` ON `source_folders` (`path`);