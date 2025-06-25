# src/scripts/sync_entities.py
# This script reads your CSV, finds entities missing a Semantic Scholar ID in your BigQuery table,
# fetches the missing IDs, and updates the table in place.

import os, requests, pandas as pd, time
from dotenv import load_dotenv
from google.cloud import bigquery
from google.oauth2 import service_account
from pathlib import Path

# --- CONFIGURATION ---
load_dotenv()
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ENTITIES_FILE = PROJECT_ROOT / "seeds" / "entities.csv"
PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'genesis-engine-prod')
ANALYTICS_DATASET_ID = 'genesis_analytics' # This is where dbt builds
ENTITIES_TABLE_ID = 'entities'

def find_semantic_scholar_id(client, entity_name):
    print(f"  > [API] Searching for ID for '{entity_name}'...")
    url = f"https://api.semanticscholar.org/graph/v1/author/search?query={requests.utils.quote(entity_name)}&fields=name"
    try:
        response = requests.get(url); response.raise_for_status(); data = response.json()
        if data.get('data'):
            top_result = data['data'][0]
            found_id = top_result['authorId']
            print(f"    - Found ID: {found_id}")
            return found_id
    except Exception as e: print(f"  > WARNING: API call failed for '{entity_name}'. Error: {e}")
    return None

def main():
    print("\n=== STARTING ENTITY SYNC & ENRICHMENT PIPELINE ===")
    
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not credentials_path: raise ValueError("FATAL: GOOGLE_APPLICATION_CREDENTIALS not set.")
    credentials = service_account.Credentials.from_service_account_file(credentials_path)
    client = bigquery.Client(credentials=credentials, project=PROJECT_ID)
    
    full_table_id = f"{PROJECT_ID}.{ANALYTICS_DATASET_ID}.{ENTITIES_TABLE_ID}"

    try:
        current_entities_df = client.query(f"SELECT * FROM `{full_table_id}`").to_dataframe()
    except Exception as e:
        print(f"  > FATAL: Could not read table {full_table_id}. Did you run 'dbt seed' first? Error: {e}")
        return

    entities_to_enrich = current_entities_df[current_entities_df['semantic_scholar_author_id'].isna()]
    
    if entities_to_enrich.empty:
        print("  > All entities are already enriched. No action needed.")
        print("\n=== ENTITY SYNC FINISHED SUCCESSFULLY ===\n")
        return

    print(f"  > Found {len(entities_to_enrich)} entities to enrich.")
    updates_to_perform = []
    for index, row in entities_to_enrich.iterrows():
        entity_name = row['canonical_name']
        found_id = find_semantic_scholar_id(client, entity_name)
        if found_id:
            updates_to_perform.append({'canonical_name': entity_name, 'semantic_scholar_author_id': str(found_id)})
        time.sleep(1)

    if updates_to_perform:
        print("  > [LOAD] Updating BigQuery table with new IDs...")
        update_df = pd.DataFrame(updates_to_perform)
        
        # We need a temp table to merge from
        temp_table_id = f"{full_table_id}_temp_updates"
        update_job_config = bigquery.LoadJobConfig(write_disposition="WRITE_TRUNCATE")
        client.load_table_from_dataframe(update_df, temp_table_id, job_config=update_job_config).result()

        merge_query = f"""
            MERGE `{full_table_id}` T
            USING `{temp_table_id}` S ON T.canonical_name = S.canonical_name
            WHEN MATCHED THEN
                UPDATE SET T.semantic_scholar_author_id = S.semantic_scholar_author_id
        """
        client.query(merge_query).result()
        client.delete_table(temp_table_id) # Clean up the temp table
        print(f"  > Successfully updated {len(update_df)} entities.")

    print("\n=== ENTITY SYNC FINISHED SUCCESSFULLY ===\n")

if __name__ == "__main__":
    main()