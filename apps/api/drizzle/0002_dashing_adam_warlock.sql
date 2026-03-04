-- Step 1: Add user_id as NULLABLE first (existing rows have no user)
ALTER TABLE "threads" ADD COLUMN "user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "user_id" varchar(255);--> statement-breakpoint

-- Step 2: Backfill existing rows with the first user (single-user app)
UPDATE "threads" SET "user_id" = (SELECT "id" FROM "users" LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint
UPDATE "messages" SET "user_id" = (SELECT "id" FROM "users" LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint

-- Step 3: Set NOT NULL and DEFAULT
ALTER TABLE "threads" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ALTER COLUMN "user_id" SET DEFAULT current_setting('app.current_user_id');--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "user_id" SET DEFAULT current_setting('app.current_user_id');--> statement-breakpoint

-- Step 4: Add foreign key constraints
ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Step 5: Enable RLS + FORCE (FORCE ensures table owner also respects RLS)
ALTER TABLE "threads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "threads" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" FORCE ROW LEVEL SECURITY;--> statement-breakpoint

-- Step 6: Create isolation policies
CREATE POLICY "threads_user_isolation" ON "threads" AS PERMISSIVE FOR ALL TO public USING (user_id = current_setting('app.current_user_id')) WITH CHECK (user_id = current_setting('app.current_user_id'));--> statement-breakpoint
CREATE POLICY "messages_user_isolation" ON "messages" AS PERMISSIVE FOR ALL TO public USING (user_id = current_setting('app.current_user_id')) WITH CHECK (user_id = current_setting('app.current_user_id'));
