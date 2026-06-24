CREATE TABLE `context_asset` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`virtual_path` text NOT NULL,
	`content_hash` text NOT NULL,
	`data` text NOT NULL,
	`media_type` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `context_asset_projectId_idx` ON `context_asset` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `context_asset_project_path_hash_unique` ON `context_asset` (`project_id`,`virtual_path`,`content_hash`);
