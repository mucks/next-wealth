CREATE TYPE "public"."metal_type" AS ENUM('gold', 'silver', 'platinum', 'palladium');--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE 'metal';--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "metal_type" "metal_type";--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "weight" numeric;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "unit" text;--> statement-breakpoint
ALTER TABLE "wealth_history" ADD COLUMN "metals_value" numeric DEFAULT 0 NOT NULL;