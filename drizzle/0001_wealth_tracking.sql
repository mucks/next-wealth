CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"wealth_tracking_enabled" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wealth_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"total_value" numeric NOT NULL,
	"crypto_value" numeric NOT NULL,
	"stocks_value" numeric NOT NULL,
	"real_estate_value" numeric NOT NULL,
	"cash_value" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "wealth_history_user_id_idx" ON "wealth_history" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "wealth_history_date_idx" ON "wealth_history" USING btree ("date");
--> statement-breakpoint
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE wealth_history ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "Users can view own wealth history" ON wealth_history
    FOR SELECT USING (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "Users can insert own wealth history" ON wealth_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "Users can update own wealth history" ON wealth_history
    FOR UPDATE USING (auth.uid() = user_id);

