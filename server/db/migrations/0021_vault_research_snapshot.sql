BEGIN;

/* Add a separate, non-authoritative slot for one server-approved historical
 * research capture. Existing records are not rewritten. */
ALTER TABLE charts
    ADD COLUMN research_snapshot JSONB;

ALTER TABLE charts
    DROP CONSTRAINT charts_scientific_status_check,
    DROP CONSTRAINT charts_record_origin_check,
    DROP CONSTRAINT charts_scientific_state_consistency_check;

ALTER TABLE charts
    ADD CONSTRAINT charts_scientific_status_check
        CHECK (scientific_status IN (
            'INPUT_ONLY',
            'CHART_RESULT_AVAILABLE',
            'RESEARCH_ONLY_SNAPSHOT'
        )),
    ADD CONSTRAINT charts_record_origin_check
        CHECK (record_origin IN (
            'USER_INPUT',
            'DEVELOPMENT_FIXTURE',
            'SERVER_RESEARCH_CAPTURE'
        )),
    ADD CONSTRAINT charts_scientific_state_consistency_check
        CHECK (
            (
                scientific_status = 'INPUT_ONLY'
                AND record_version = 1
                AND calculation_authority_state = 'AUTHORITY_INCOMPLETE'
                AND record_origin IN ('USER_INPUT', 'DEVELOPMENT_FIXTURE')
                AND research_snapshot IS NULL
            )
            OR
            (
                scientific_status = 'CHART_RESULT_AVAILABLE'
                AND record_version = 1
                AND calculation_authority_state = 'AUTHORITATIVE'
                AND canonical_result IS NOT NULL
                AND engine_version IS NOT NULL
                AND chart_schema_version IS NOT NULL
                AND record_origin = 'USER_INPUT'
                AND research_snapshot IS NULL
            )
            OR
            (
                scientific_status = 'RESEARCH_ONLY_SNAPSHOT'
                AND record_version = 2
                AND calculation_authority_state = 'AUTHORITY_INCOMPLETE'
                AND record_origin = 'SERVER_RESEARCH_CAPTURE'
                AND source_context = 'vault.research-capture'
                AND canonical_result IS NULL
                AND research_snapshot IS NOT NULL
                AND jsonb_typeof(research_snapshot) = 'object'
                AND research_snapshot->>'schemaVersion' = '1'
                AND scientific_provenance->>'schemaVersion' = '2'
                AND scientific_provenance->>'recordOrigin' = 'SERVER_RESEARCH_CAPTURE'
                AND scientific_provenance->>'sourceContext' = 'vault.research-capture'
                AND scientific_provenance->>'calculationAuthorityState' = 'AUTHORITY_INCOMPLETE'
                AND scientific_provenance->>'provenanceEnvelopeId' IS NULL
                AND research_snapshot->>'captureId' = scientific_provenance->>'captureId'
                AND research_snapshot->>'captureReportSha256' = scientific_provenance->>'captureReportSha256'
                AND research_snapshot->>'responseSha256' = scientific_provenance->>'captureResponseSha256'
                AND research_snapshot->>'captureReportSha256' ~ '^[0-9a-f]{64}$'
                AND research_snapshot->>'requestSha256' ~ '^[0-9a-f]{64}$'
                AND research_snapshot->>'responseSha256' ~ '^[0-9a-f]{64}$'
                AND research_snapshot->>'canonicalChartResultSha256' ~ '^[0-9a-f]{64}$'
                AND research_snapshot->>'requestUtf8Base64' ~ '^[A-Za-z0-9+/]+={0,2}$'
                AND research_snapshot->>'responseUtf8Base64' ~ '^[A-Za-z0-9+/]+={0,2}$'
                AND char_length(research_snapshot->>'requestUtf8Base64')
                    + char_length(research_snapshot->>'responseUtf8Base64') <= 400000
                AND research_snapshot->>'runId' IS NOT NULL
                AND research_snapshot->>'serviceInstanceId' IS NOT NULL
                AND research_snapshot->>'requestExecutionId' IS NOT NULL
                AND research_snapshot->>'runtimeIdentity' IS NOT NULL
                AND research_snapshot->>'runtimeManifestSha256' ~ '^[0-9a-f]{64}$'
            )
        );

COMMIT;
