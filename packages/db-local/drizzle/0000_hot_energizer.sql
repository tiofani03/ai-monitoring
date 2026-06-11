CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`hostname` text NOT NULL,
	`os` text NOT NULL,
	`arch` text NOT NULL,
	`tracker_version` text NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`tool` text NOT NULL,
	`integration` text NOT NULL,
	`integration_version` text,
	`project_hash` text,
	`project_alias` text,
	`session_id` text,
	`message_id` text,
	`timestamp` text NOT NULL,
	`started_at` text,
	`ended_at` text,
	`duration_ms` integer,
	`provider` text,
	`model` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`total_tokens` integer,
	`token_count_status` text NOT NULL,
	`pricing_rule_id` text,
	`estimated_cost_usd` real,
	`event_type` text NOT NULL,
	`sync_mode` text NOT NULL,
	`metadata` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pricing_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`input_price_per_1m_tokens` real NOT NULL,
	`output_price_per_1m_tokens` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`hash` text PRIMARY KEY NOT NULL,
	`alias` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_hash` text,
	`start_time` text NOT NULL,
	`end_time` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`event_id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`next_retry_at` text,
	`last_attempt_at` text,
	`last_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
