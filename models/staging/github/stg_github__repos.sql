-- models/staging/github/stg_github__repos.sql
SELECT
    repo_id,
    org_name,
    repo_name,
    description,
    language,
    stars AS star_count,
    forks AS fork_count,
    CAST(created_at AS TIMESTAMP) AS created_at_ts,
    CAST(updated_at AS TIMESTAMP) AS updated_at_ts,
    CAST(ingestion_timestamp AS TIMESTAMP) AS ingestion_at_ts
FROM {{ source('genesis_raw_data', 'raw_github_repos') }}