ALTER TABLE "User" ADD COLUMN "role" varchar(50);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "customRole" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "topic" varchar(50);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "customTopic" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "identification" varchar(50);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "dataAccess" json;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "microsoftSession" json;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;