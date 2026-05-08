CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`kind` text NOT NULL,
	`file_path` text NOT NULL,
	`mime` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`name` text NOT NULL,
	`user_input` text DEFAULT '' NOT NULL,
	`user_image_id` text,
	`cds_appearance` text DEFAULT '' NOT NULL,
	`cds_outfit` text DEFAULT '' NOT NULL,
	`cds_traits` text DEFAULT '' NOT NULL,
	`cds_style` text DEFAULT '' NOT NULL,
	`cds_image_id` text,
	`confirmed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_image_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cds_image_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`kind` text NOT NULL,
	`target_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`image_prompt` text DEFAULT '' NOT NULL,
	`characters` text DEFAULT '[]' NOT NULL,
	`image_id` text,
	`position_x` real DEFAULT 0 NOT NULL,
	`position_y` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`input_mode` text NOT NULL,
	`setting` text DEFAULT '' NOT NULL,
	`opening` text DEFAULT '' NOT NULL,
	`story_text` text DEFAULT '' NOT NULL,
	`art_style_key` text DEFAULT '' NOT NULL,
	`art_style_prompt` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
