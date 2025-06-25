# src/scripts/fetch_academic_output.py
# This script's only job is to read the ENRICHED entities table from BigQuery
# and then use the IDs to fetch papers.

# ... (all imports and config) ...

def fetch_enriched_entities(client):
    """Fetches the fully enriched entities table from BigQuery."""
    print("--- [FETCH] Getting enriched entities from Data Warehouse ---")
    table_id = f"{PROJECT_ID}.{ANALYTICS_DATASET_ID}.{ENTITIES_TABLE_ID}"
    try:
        df = client.query(f"SELECT * FROM `{table_id}` WHERE semantic_scholar_author_id IS NOT NULL").to_dataframe()
        print(f"  > Successfully fetched {len(df)} enriched entities.")
        return df
    except Exception as e:
        print(f"  > FATAL: Could not fetch entities from {table_id}. Error: {e}")
        return pd.DataFrame()

def fetch_papers_for_organization(org_name, author_id):
    # This function is the same as before
    pass

def load_to_bigquery(df, table_id):
    # This function is the same as before
    pass

def main():
    print("\n=== STARTING ACADEMIC INTELLIGENCE PIPELINE ===")
    # ... (init client) ...
    
    # Step 1: Get the list of entities that are ready to go.
    enriched_entities = fetch_enriched_entities(client)
    
    # Step 2 & 3: Fetch and Load data for them.
    all_papers = []
    for index, row in enriched_entities.iterrows():
        papers = fetch_papers_for_organization(row['canonical_name'], row['semantic_scholar_author_id'])
        if papers: all_papers.extend(papers)
    
    if all_papers:
        final_df = pd.DataFrame(all_papers)
        final_df['ingestion_timestamp'] = pd.Timestamp.now(tz='UTC')
        load_to_bigquery(final_df, 'raw_academic_output')

    print("\n=== ACADEMIC INTELLIGENCE PIPELINE FINISHED SUCCESSFULLY ===\n")

if __name__ == "__main__":
    main()