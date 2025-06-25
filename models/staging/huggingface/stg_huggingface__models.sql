-- models/staging/huggingface/stg_huggingface__models.sql
SELECT
    model_id,
    org_name,
    SPLIT(model_id, '/')[OFFSET(1)] AS model_name,
    pipeline_tag,
    downloads,
    likes,
    tags,
    CAST(last_modified AS TIMESTAMP) AS last_modified_ts,
    CAST(ingestion_timestamp AS TIMESTAMP) AS ingestion_at_ts
FROM {{ source('genesis_raw_data', 'raw_huggingface_models') }}