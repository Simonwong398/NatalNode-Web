BEGIN;

/*
 * Extend the existing user-owned charts table into the first durable Vault
 * record contract. Existing rows are classified from their stored result;
 * development/incomplete snapshots become explicitly non-authoritative rather
 * than being presented as production chart results.
 */
ALTER TABLE charts
    ALTER COLUMN canonical_result DROP NOT NULL,
    ALTER COLUMN engine_version DROP NOT NULL,
    ALTER COLUMN chart_schema_version DROP NOT NULL;

ALTER TABLE charts
    ADD COLUMN record_version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN scientific_status TEXT NOT NULL DEFAULT 'INPUT_ONLY',
    ADD COLUMN calculation_authority_state TEXT NOT NULL DEFAULT 'AUTHORITY_INCOMPLETE',
    ADD COLUMN record_origin TEXT NOT NULL DEFAULT 'USER_INPUT',
    ADD COLUMN source_context TEXT NOT NULL DEFAULT 'vault.legacy',
    ADD COLUMN time_authority_state TEXT NOT NULL DEFAULT 'UNRESOLVED',
    ADD COLUMN chart_result_contract_version TEXT,
    ADD COLUMN scientific_configuration_identity TEXT,
    ADD COLUMN scientific_provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN saved_at TIMESTAMPTZ;

UPDATE charts
SET
    saved_at = created_at,
    scientific_status = CASE
        WHEN canonical_result IS NOT NULL
            AND COALESCE(canonical_result->>'calculationStatus', '') = 'COMPLETE'
            AND COALESCE(canonical_result->'metadata'->>'configurationStatus', '') = 'COMPLETE'
            AND astronomy_configuration_id IS NOT NULL
            AND COALESCE(engine_version, '') NOT ILIKE '%fixture%'
            AND COALESCE(engine_version, '') NOT ILIKE '%mock%'
            THEN 'CHART_RESULT_AVAILABLE'
        ELSE 'INPUT_ONLY'
    END,
    calculation_authority_state = CASE
        WHEN canonical_result IS NOT NULL
            AND COALESCE(canonical_result->>'calculationStatus', '') = 'COMPLETE'
            AND COALESCE(canonical_result->'metadata'->>'configurationStatus', '') = 'COMPLETE'
            AND astronomy_configuration_id IS NOT NULL
            AND COALESCE(engine_version, '') NOT ILIKE '%fixture%'
            AND COALESCE(engine_version, '') NOT ILIKE '%mock%'
            THEN 'AUTHORITATIVE'
        ELSE 'AUTHORITY_INCOMPLETE'
    END,
    record_origin = CASE
        WHEN NOT (
            canonical_result IS NOT NULL
            AND COALESCE(canonical_result->>'calculationStatus', '') = 'COMPLETE'
            AND COALESCE(canonical_result->'metadata'->>'configurationStatus', '') = 'COMPLETE'
            AND astronomy_configuration_id IS NOT NULL
            AND COALESCE(engine_version, '') NOT ILIKE '%fixture%'
            AND COALESCE(engine_version, '') NOT ILIKE '%mock%'
        )
            THEN 'DEVELOPMENT_FIXTURE'
        ELSE 'USER_INPUT'
    END,
    time_authority_state = CASE normalized_input->'birth'->>'ambiguityStatus'
        WHEN 'EXACT' THEN 'RESOLVED'
        WHEN 'AMBIGUOUS' THEN 'AMBIGUOUS'
        WHEN 'NONEXISTENT' THEN 'NONEXISTENT'
        WHEN 'UNKNOWN_TIME' THEN 'UNKNOWN_BIRTH_TIME'
        ELSE 'UNRESOLVED'
    END,
    chart_result_contract_version = chart_schema_version,
    scientific_configuration_identity = astronomy_configuration_id,
    scientific_provenance = jsonb_build_object(
        'schemaVersion', '1',
        'recordOrigin', CASE
            WHEN NOT (
                canonical_result IS NOT NULL
                AND COALESCE(canonical_result->>'calculationStatus', '') = 'COMPLETE'
                AND COALESCE(canonical_result->'metadata'->>'configurationStatus', '') = 'COMPLETE'
                AND astronomy_configuration_id IS NOT NULL
                AND COALESCE(engine_version, '') NOT ILIKE '%fixture%'
                AND COALESCE(engine_version, '') NOT ILIKE '%mock%'
            )
                THEN 'DEVELOPMENT_FIXTURE'
            ELSE 'USER_INPUT'
        END,
        'sourceContext', 'vault.legacy',
        'savedAt', created_at,
        'timeAuthorityState', CASE normalized_input->'birth'->>'ambiguityStatus'
            WHEN 'EXACT' THEN 'RESOLVED'
            WHEN 'AMBIGUOUS' THEN 'AMBIGUOUS'
            WHEN 'NONEXISTENT' THEN 'NONEXISTENT'
            WHEN 'UNKNOWN_TIME' THEN 'UNKNOWN_BIRTH_TIME'
            ELSE 'UNRESOLVED'
        END,
        'calculationAuthorityState', CASE
            WHEN canonical_result IS NOT NULL
                AND COALESCE(canonical_result->>'calculationStatus', '') = 'COMPLETE'
                AND COALESCE(canonical_result->'metadata'->>'configurationStatus', '') = 'COMPLETE'
                AND astronomy_configuration_id IS NOT NULL
                AND COALESCE(engine_version, '') NOT ILIKE '%fixture%'
                AND COALESCE(engine_version, '') NOT ILIKE '%mock%'
                THEN 'AUTHORITATIVE'
            ELSE 'AUTHORITY_INCOMPLETE'
        END,
        'chartResultContractVersion', chart_schema_version,
        'scientificConfigurationIdentity', astronomy_configuration_id,
        'provenanceEnvelopeId', provenance_envelope_id
    );

/* Remove old incomplete/fixture result payloads from the scientific snapshot;
 * their saved record remains explicitly non-authoritative. */
UPDATE charts
SET
    canonical_result = NULL,
    engine_version = NULL,
    chart_schema_version = NULL,
    astronomy_configuration_id = NULL,
    provenance_envelope_id = NULL,
    chart_result_contract_version = NULL,
    scientific_configuration_identity = NULL
WHERE scientific_status = 'INPUT_ONLY';

UPDATE charts
SET scientific_provenance = scientific_provenance || jsonb_build_object(
    'chartResultContractVersion', NULL,
    'scientificConfigurationIdentity', NULL,
    'provenanceEnvelopeId', NULL
)
WHERE scientific_status = 'INPUT_ONLY';

ALTER TABLE charts
    ALTER COLUMN saved_at SET NOT NULL;

ALTER TABLE charts
    ADD CONSTRAINT charts_display_name_length_check
        CHECK (char_length(display_name) BETWEEN 1 AND 120),
    ADD CONSTRAINT charts_record_version_check
        CHECK (record_version >= 1),
    ADD CONSTRAINT charts_scientific_status_check
        CHECK (scientific_status IN ('INPUT_ONLY', 'CHART_RESULT_AVAILABLE')),
    ADD CONSTRAINT charts_calculation_authority_check
        CHECK (calculation_authority_state IN ('AUTHORITY_INCOMPLETE', 'AUTHORITATIVE')),
    ADD CONSTRAINT charts_record_origin_check
        CHECK (record_origin IN ('USER_INPUT', 'DEVELOPMENT_FIXTURE')),
    ADD CONSTRAINT charts_source_context_check
        CHECK (char_length(source_context) BETWEEN 1 AND 128),
    ADD CONSTRAINT charts_time_authority_state_check
        CHECK (time_authority_state IN (
            'UNRESOLVED',
            'RESOLVED',
            'AMBIGUOUS',
            'NONEXISTENT',
            'UNKNOWN_BIRTH_TIME'
        )),
    ADD CONSTRAINT charts_scientific_state_consistency_check
        CHECK (
            (
                scientific_status = 'INPUT_ONLY'
                AND calculation_authority_state = 'AUTHORITY_INCOMPLETE'
            )
            OR
            (
                scientific_status = 'CHART_RESULT_AVAILABLE'
                AND calculation_authority_state = 'AUTHORITATIVE'
                AND canonical_result IS NOT NULL
                AND engine_version IS NOT NULL
                AND chart_schema_version IS NOT NULL
                AND record_origin = 'USER_INPUT'
            )
        );

CREATE INDEX charts_user_created_at_idx
    ON charts (user_id, created_at DESC, chart_id ASC);

COMMIT;
