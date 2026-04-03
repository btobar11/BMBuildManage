CREATE TYPE "public"."audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

CREATE TABLE "public"."audit_logs" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "company_id" uuid,
    "user_id" uuid,
    "entity_name" character varying NOT NULL,
    "entity_id" uuid NOT NULL,
    "action" "public"."audit_action" NOT NULL,
    "old_value" jsonb,
    "new_value" jsonb,
    "description" text,
    "created_at" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");

CREATE INDEX "IDX_audit_logs_entity" ON "public"."audit_logs" USING btree ("entity_name", "entity_id");
CREATE INDEX "IDX_audit_logs_company" ON "public"."audit_logs" USING btree ("company_id");

-- Policies
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON "public"."audit_logs"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON "public"."audit_logs"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (true);
