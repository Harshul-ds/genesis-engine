# src/scripts/fetch_huggingface.py

import os
import pandas as pd
from dotenv import load_dotenv
from huggingface_hub import HfApi, HfFolder
from google.cloud import bigquery
from google.oauth2 import service_account
from pathlib import Path

# --- A. LOAD CONFIGURATION ---
print("--- [CONFIG] Loading configuration for Hugging Face ---")
load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ENTITIES_FILE = PROJECT_ROOT / "seeds" / "entities.csv"
PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'genesis-engine-prod')
RAW_DATASET_ID = 'raw_data'
TABLE_ID = 'raw_huggingface_models'
HF_TOKEN = os.getenv('HF_TOKEN')

# --- B. DATA ACQUISITION ---
def fetch_hf_models(entities_df):
    """Fetches model information from the Hugging Face Hub for a list of organizations."""
    print("--- [FETCH] Starting Hugging Face data acquisition ---")
    if not HF_TOKEN:
        print("  > WARNING: HF_TOKEN not set. Public access only.")
        # The script can still work for public models without a token, but it's better to use one.
        api = HfApi()
    else:
        api = HfApi(token=HF_TOKEN)

    hf_orgs = entities_df['huggingface_org_name'].dropna().tolist()
    all_models_data = []

    for org_name in hf_orgs:
        print(f"  > Fetching models for organization: {org_name}")
        try:
            # list_models returns a generator, so we iterate through it
            models = api.list_models(author=org_name, sort="lastModified", direction=-1, limit=50)
            for model_info in models:
                all_models_data.append({
                    'org_name': org_name,
                    'model_id': model_info.modelId,
                    'model_sha': model_info.sha,
                    'last_modified': model_info.lastModified,
                    'tags': ', '.join(model_info.tags),
                    'pipeline_tag': model_info.pipeline_tag,
                    'likes': model_info.likes,
                    'downloads': model_info.downloads
                })
        except Exception as e:
            print(f"  > WARNING: Could not fetch models for {org_name}. Error: {e}")
            continue

    if not all_models_data:
        print("  > No models found for the given organizations.")
        return pd.DataFrame()

    df = pd.DataFrame(all_models_data)
    df['last_modified'] = pd.to_datetime(df['last_modified'])
    df['ingestion_timestamp'] = pd.Timestamp.now(tz='UTC')
    print(f"  > Successfully fetched {len(df)} model records.")
    return df

# --- C. DATA LOADING (This function can be shared across scripts) ---
def load_to_bigquery(df, table_id):
    """Loads a DataFrame into a BigQuery table, overwriting it."""
    if df is None or df.empty:
        print(f"  > No data to load for table {table_id}. Skipping.")
        return

    full_table_id = f"{PROJECT_ID}.{RAW_DATASET_ID}.{table_id}"
    print(f"--- [LOAD] Loading {len(df)} rows to BigQuery table: {full_table_id} ---")
    
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not credentials_path:
        raise ValueError("FATAL: GOOGLE_APPLICATION_CREDENTIALS not set.")
        
    credentials = service_account.Credentials.from_service_account_file(credentials_path)
    client = bigquery.Client(credentials=credentials, project=PROJECT_ID)
    
    job_config = bigquery.LoadJobConfig(
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )
    
    try:
        job = client.load_table_from_dataframe(df, full_table_id, job_config=job_config)
        job.result()
        print(f"  > Successfully loaded data to {full_table_id}")
    except Exception as e:
        print(f"  > FATAL: Failed to load data to BigQuery: {e}")

# --- D. MAIN EXECUTION ---
if __name__ == "__main__":
    print("\n=== STARTING HUGGING FACE INGESTION PIPELINE ===")
    entities_df = pd.read_csv(ENTITIES_FILE)
    hf_df = fetch_hf_models(entities_df)
    load_to_bigquery(hf_df, TABLE_ID)
    print("\n=== HUGGING FACE PIPELINE FINISHED SUCCESSFULLY ===\n")