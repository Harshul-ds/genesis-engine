import os
import requests
import pandas as pd
import time
from dotenv import load_dotenv
from google.cloud import bigquery
from google.oauth2 import service_account

# --- A. LOAD CONFIGURATION ---
print("--- [CONFIG] Loading configuration ---")
load_dotenv()

PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'genesis-engine-prod')
RAW_DATASET_ID = 'raw_data'
ARXIV_TABLE_ID = 'raw_arxiv'
CITATIONS_TABLE_ID = 'raw_citations'

# --- B. DATA ACQUISITION & ENRICHMENT ---
def get_new_paper_ids_to_enrich(client):
    """Finds paper IDs in the arxiv table that are not yet in the citations table."""
    print("--- [FETCH] Finding new paper IDs to enrich ---")
    
    query = f"""
        SELECT paper_id FROM `{PROJECT_ID}.{RAW_DATASET_ID}.{ARXIV_TABLE_ID}`
        EXCEPT DISTINCT
        SELECT paper_id FROM `{PROJECT_ID}.{RAW_DATASET_ID}.{CITATIONS_TABLE_ID}`
    """
    try:
        query_job = client.query(query)
        results = query_job.to_dataframe()
        paper_ids = results['paper_id'].tolist()
        print(f"  > Found {len(paper_ids)} new papers to enrich with citation data.")
        return paper_ids
    except Exception as e:
        # Handle case where citations table doesn't exist yet
        if "Not found" in str(e):
            print("  > Citations table not found. Enriching all papers from arxiv table.")
            query = f"SELECT DISTINCT paper_id FROM `{PROJECT_ID}.{RAW_DATASET_ID}.{ARXIV_TABLE_ID}`"
            query_job = client.query(query)
            results = query_job.to_dataframe()
            return results['paper_id'].tolist()
        else:
            print(f"  > ERROR: Could not query BigQuery for new IDs: {e}")
            return []

def enrich_with_citations(paper_ids):
    """Enriches a list of arXiv paper IDs with citation counts from Semantic Scholar."""
    print("--- [ENRICH] Starting citation data enrichment from Semantic Scholar ---")
    if not paper_ids:
        print("  > No new paper IDs to enrich.")
        return pd.DataFrame()

    citations_data = []
    base_url = "https://api.semanticscholar.org/graph/v1/paper/ARXIV:"
    
    for i, paper_id in enumerate(paper_ids):
        print(f"  > Enriching paper {i+1}/{len(paper_ids)}: {paper_id}")
        try:
            time.sleep(0.5) # Rate limit to be polite to the API
            response = requests.get(f"{base_url}{paper_id}?fields=citationCount,influentialCitationCount")
            response.raise_for_status()
            data = response.json()
            
            citations_data.append({
                'paper_id': paper_id,
                'citation_count': data.get('citationCount', 0),
                'influential_citation_count': data.get('influentialCitationCount', 0),
                'ingestion_timestamp': pd.Timestamp.now(tz='UTC')
            })
        except requests.exceptions.RequestException as e:
            print(f"  > WARNING: Could not fetch citations for {paper_id}. Error: {e}. Skipping.")
            continue
    
    if not citations_data:
        print("  > No citation data could be fetched.")
        return pd.DataFrame()
        
    print(f"  > Successfully enriched {len(citations_data)} papers with citation counts.")
    return pd.DataFrame(citations_data)

# --- C. DATA LOADING ---
def load_to_bigquery(df, table_id, client):
    if df is None or df.empty:
        print(f"  > No data to load for table {table_id}. Skipping.")
        return

    full_table_id = f"{PROJECT_ID}.{RAW_DATASET_ID}.{table_id}"
    print(f"--- [LOAD] Loading {len(df)} rows to BigQuery table: {full_table_id} ---")
    
    job_config = bigquery.LoadJobConfig(
        # We APPEND here, because we are only adding new data, not replacing the whole table.
        write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
    )
    
    try:
        job = client.load_table_from_dataframe(df, full_table_id, job_config=job_config)
        job.result()
        print(f"  > Successfully loaded data to {full_table_id}")
    except Exception as e:
        print(f"  > FATAL: Failed to load data to BigQuery: {e}")

# --- D. MAIN EXECUTION ---
if __name__ == "__main__":
    print("\n=== STARTING CITATION ENRICHMENT PIPELINE ===\n")
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not credentials_path: raise ValueError("FATAL: GOOGLE_APPLICATION_CREDENTIALS not set.")
    credentials = service_account.Credentials.from_service_account_file(credentials_path)
    client = bigquery.Client(credentials=credentials, project=PROJECT_ID)
    
    paper_ids_to_process = get_new_paper_ids_to_enrich(client)
    citations_df = enrich_with_citations(paper_ids_to_process)
    load_to_bigquery(citations_df, CITATIONS_TABLE_ID, client)
    
    print("\n=== CITATION ENRICHMENT FINISHED SUCCESSFULLY ===\n")