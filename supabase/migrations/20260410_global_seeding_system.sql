-- ============================================================
-- FASE 1: Global Resources & APU Seeding System
-- Date: 2026-04-10
-- ============================================================

-- ============================================================
-- STEP 1: Ensure resources have company_id = NULL for global
-- ============================================================
UPDATE resources SET company_id = NULL WHERE company_id = '' OR company_id = 'global';

-- ============================================================
-- STEP 2: Ensure APU templates have company_id = NULL for global
-- ============================================================
UPDATE apu_templates SET company_id = NULL WHERE company_id = '' OR company_id = 'global';

-- ============================================================
-- STEP 3: Create seeding function
-- ============================================================
CREATE OR REPLACE FUNCTION seed_company_library(
    p_company_id UUID,
    p_specialty TEXT DEFAULT 'residential',
    p_seismic_zone TEXT DEFAULT 'E',
    p_region_code TEXT DEFAULT 'CL-RM'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_resources_cloned INTEGER := 0;
    vapus_cloned INTEGER := 0;
    v_specialty TEXT := LOWER(p_specialty);
BEGIN
    -- ============================================================
    -- Clone GLOBAL resources to company
    -- ============================================================
    INSERT INTO resources (
        id,
        company_id,
        name,
        type,
        unit_id,
        category,
        description,
        base_price,
        has_vat,
        created_at,
        updated_at
    )
    SELECT 
        gen_random_uuid(),
        p_company_id,
        name,
        type,
        unit_id,
        category,
        description,
        base_price,
        has_vat,
        NOW(),
        NOW()
    FROM resources
    WHERE company_id IS NULL
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_resources_cloned = ROW_COUNT;

    -- ============================================================
    -- Clone GLOBAL APU templates to company
    -- ============================================================
    INSERT INTO apu_templates (
        id,
        company_id,
        name,
        unit_id,
        description,
        category,
        default_formula,
        default_geometry_layer,
        created_at,
        updated_at
    )
    SELECT 
        gen_random_uuid(),
        p_company_id,
        name,
        unit_id,
        description,
        category,
        default_formula,
        default_geometry_layer,
        NOW(),
        NOW()
    FROM apu_templates
    WHERE company_id IS NULL
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS vapus_cloned = ROW_COUNT;

    -- ============================================================
    -- Update company seeding status
    -- ============================================================
    UPDATE companies 
    SET library_seeded = true, 
        seeded_at = NOW(),
        specialty = CASE 
            WHEN v_specialty = 'residential' THEN 'residential'::company_specialty
            WHEN v_specialty = 'civil_works' THEN 'civil_works'::company_specialty
            WHEN v_specialty = 'renovations' THEN 'renovations'::company_specialty
            WHEN v_specialty = 'industrial' THEN 'industrial'::company_specialty
            WHEN v_specialty = 'commercial' THEN 'commercial'::company_specialty
            ELSE 'residential'::company_specialty
        END,
        seismic_zone = CASE 
            WHEN p_seismic_zone = 'A' THEN 'A'::seismic_zone
            WHEN p_seismic_zone = 'B' THEN 'B'::seismic_zone
            WHEN p_seismic_zone = 'C' THEN 'C'::seismic_zone
            WHEN p_seismic_zone = 'D' THEN 'D'::seismic_zone
            WHEN p_seismic_zone = 'E' THEN 'E'::seismic_zone
            ELSE 'E'::seismic_zone
        END,
        region_code = p_region_code
    WHERE id = p_company_id;

    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'company_id', p_company_id,
        'specialty', p_specialty,
        'seismic_zone', p_seismic_zone,
        'resources_cloned', v_resources_cloned,
        'apus_cloned', vapus_cloned,
        'seeded_at', NOW()
    );
EXCEPTION WHEN OTHERS THEN
    RETURN JSONB_BUILD_OBJECT(
        'success', false,
        'error', SQLERRM,
        'company_id', p_company_id
    );
END;
$$;

-- ============================================================
-- STEP 4: Create trigger for automatic seeding on company creation
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_auto_seed_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Auto-seed on company creation (if specialty provided)
    IF NEW.specialty IS NOT NULL AND NEW.library_seeded = false THEN
        PERFORM seed_company_library(
            NEW.id,
            NEW.specialty::TEXT,
            COALESCE(NEW.seismic_zone::TEXT, 'E'),
            COALESCE(NEW.region_code, 'CL-RM')
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_seed_company_trigger ON companies;
CREATE TRIGGER auto_seed_company_trigger
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_seed_company();

-- ============================================================
-- STEP 5: Grant execute permission to authenticated role
-- ============================================================
GRANT EXECUTE ON FUNCTION seed_company_library(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_auto_seed_company() TO authenticated;

COMMENT ON FUNCTION seed_company_library IS 'Clones global resources and APU templates to a company library based on specialty';
COMMENT ON FUNCTION trigger_auto_seed_company IS 'Automatically seeds company library when company is created';