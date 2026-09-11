CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`initials` text NOT NULL,
	`score` integer NOT NULL,
	`run_duration_ms` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_scores_rank` ON `scores` (`score`,`created_at`);