CREATE TABLE "context_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"virtual_path" text NOT NULL,
	"content_hash" text NOT NULL,
	"data" text NOT NULL,
	"media_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "context_asset" ADD CONSTRAINT "context_asset_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "context_asset_projectId_idx" ON "context_asset" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "context_asset_project_path_hash_unique" ON "context_asset" USING btree ("project_id","virtual_path","content_hash");
