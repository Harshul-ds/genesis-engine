-- models/staging/huggingface/stg_huggingface__models.sql

WITH source AS (

    SELECT * FROM {{ source('genesis_raw_data', 'raw_huggingface_models') }}

)

SELECT
    -- IDs and Names
    model_id,
    org_name,
    -- Extracting the model name from the full model_id (e.g., 'meta-llama/Llama-2-7b' -> 'Llama-2-7b')
    SPLIT(model_id, '/')[SAFE_OFFSET(1)] AS model_name,
    model_sha,

    -- Details
    pipeline_tag,
    tags,

    -- Metrics
    CAST(downloads AS INT64) AS download_count,
    CAST(likes AS INT64) AS like_count,

    -- Timestamps
    -- Converting the Unix timestamp (integer) to a proper TIMESTAMP
    TIMESTAMP_SECONDS(last_modified) AS last_modified_ts,
    CAST(ingestion_timestamp AS TIMESTAMP) AS ingestion_at_ts

FROM
    source