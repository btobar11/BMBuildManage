-- ============================================================
-- Migration: Atomic Bulk Import RPC for budget items
-- File: bulk_import_budget_items.sql
-- Run on Supabase BEFORE deploying the new endpoint.
--
-- This function receives a JSON array of items and inserts them
-- atomically. If ANY row fails a constraint (negative values,
-- missing FK, etc.) the ENTIRE transaction rolls back.
--
-- Security: company_id isolation enforced via budget -> project -> company chain.
-- ============================================================

CREATE OR REPLACE FUNCTION bulk_import_budget_items(
  p_budget_id   UUID,
  p_company_id  UUID,
  p_items       JSONB
)
RETURNS TABLE (
  inserted_count  INTEGER,
  failed_count    INTEGER,
  first_error     TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id    UUID;
  v_company_id    UUID;
  v_inserted      INTEGER := 0;
  v_item          JSONB;
  v_stage_id      UUID;
  v_name          TEXT;
  v_quantity      NUMERIC;
  v_unit          TEXT;
  v_unit_cost     NUMERIC;
  v_unit_price    NUMERIC;
  v_position      INTEGER;
BEGIN
  -- ── 1. Verify budget exists and belongs to calling company (RLS) ──────────
  SELECT b.project_id, p.company_id
    INTO v_project_id, v_company_id
    FROM budgets b
    JOIN projects p ON p.id = b.project_id
   WHERE b.id = p_budget_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BUDGET_NOT_FOUND: Budget % does not exist', p_budget_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_company_id <> p_company_id THEN
    RAISE EXCEPTION 'FORBIDDEN: Budget does not belong to company %', p_company_id
      USING ERRCODE = 'P0003';
  END IF;

  -- ── 2. Validate array is not empty ────────────────────────────────────────
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_PAYLOAD: items array cannot be empty'
      USING ERRCODE = 'P0004';
  END IF;

  IF jsonb_array_length(p_items) > 2000 THEN
    RAISE EXCEPTION 'PAYLOAD_TOO_LARGE: Cannot import more than 2000 items at once'
      USING ERRCODE = 'P0005';
  END IF;

  -- ── 3. Insert all items atomically ────────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_stage_id  := (v_item->>'stage_id')::UUID;
    v_name      := TRIM(v_item->>'name');
    v_quantity  := COALESCE((v_item->>'quantity')::NUMERIC, 0);
    v_unit      := COALESCE(LOWER(TRIM(v_item->>'unit')), 'glb');
    v_unit_cost := COALESCE((v_item->>'unit_cost')::NUMERIC, 0);
    v_unit_price:= COALESCE((v_item->>'unit_price')::NUMERIC, 0);
    v_position  := COALESCE((v_item->>'position')::INTEGER, v_inserted);

    -- Per-row validation (will raise and roll back entire txn)
    IF v_name IS NULL OR v_name = '' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Item at position % has empty name', v_position
        USING ERRCODE = '23514';
    END IF;

    IF v_quantity < 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Item "%" has negative quantity %.', v_name, v_quantity
        USING ERRCODE = '23514';
    END IF;

    IF v_unit_cost < 0 OR v_unit_price < 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Item "%" has negative cost/price.', v_name
        USING ERRCODE = '23514';
    END IF;

    -- Verify stage belongs to this budget (prevents cross-tenant injection)
    IF NOT EXISTS (
      SELECT 1 FROM stages s WHERE s.id = v_stage_id AND s.budget_id = p_budget_id
    ) THEN
      RAISE EXCEPTION 'INVALID_STAGE: Stage % does not belong to budget %', v_stage_id, p_budget_id
        USING ERRCODE = '23503';
    END IF;

    INSERT INTO items (
      id,
      stage_id,
      name,
      quantity,
      unit,
      unit_cost,
      unit_price,
      total_cost,
      total_price,
      position,
      cubication_mode,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_stage_id,
      v_name,
      v_quantity,
      v_unit,
      v_unit_cost,
      v_unit_price,
      v_quantity * v_unit_cost,
      v_quantity * v_unit_price,
      v_position,
      'manual',
      NOW(),
      NOW()
    );

    v_inserted := v_inserted + 1;
  END LOOP;

  -- ── 4. Recalculate budget totals in DB ─────────────────────────────────────
  UPDATE budgets
     SET total_estimated_cost = (
           SELECT COALESCE(SUM(i.total_cost), 0)
             FROM items i
             JOIN stages s ON s.id = i.stage_id
            WHERE s.budget_id = p_budget_id
         ),
         total_estimated_price = (
           SELECT COALESCE(SUM(i.total_price), 0)
             FROM items i
             JOIN stages s ON s.id = i.stage_id
            WHERE s.budget_id = p_budget_id
         ),
         updated_at = NOW()
   WHERE id = p_budget_id;

  -- ── 5. Return summary ──────────────────────────────────────────────────────
  RETURN QUERY SELECT v_inserted, 0, NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise: Postgres will automatically rollback the transaction
    RAISE;
END;
$$;

-- Grant execute to authenticated role (Supabase)
GRANT EXECUTE ON FUNCTION bulk_import_budget_items(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_import_budget_items(UUID, UUID, JSONB) TO service_role;
