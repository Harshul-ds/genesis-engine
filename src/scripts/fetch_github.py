# src/scripts/fetch_github.py
import os, pandas as pd, time
from dotenv import load_dotenv
from github import Github, RateLimitExceededException
from google.cloud import bigquery
from google.oauth2 import service_account
from pathlib import Path

# --- CONFIGURATION ---
print("--- [CONFIG] Loading configuration for GitHub ---")
load_dotenv()
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ENTITIES_FILE = PROJECT_ROOT / "seeds" / "entities.csv"
PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'genesis-engine-prod')
RAW_DATASET_ID = 'raw_data'
TABLE_ID = 'raw_github_repos'
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')

def fetch_github_repos(entities_df):
    print("--- [FETCH] Starting GitHub data acquisition ---")
    if not GITHUB_TOKEN: raise ValueError("FATAL: GITHUB_TOKEN not set.")
    g = Github(GITHUB_TOKEN)
    
    github_orgs = entities_df['github_org_name'].dropna().tolist()
    all_repos_data = []

    for org_name in github_orgs:
        print(f"  > Fetching repos for organization: {org_name}")
        try:
            org = g.get_organization(org_name)
            # Get a limited number of repos to avoid huge API usage
            for repo in org.get_repos(sort='pushed', direction='desc')[:10]:
                all_repos_data.append({
                    'org_name': org_name, 'repo_id': repo.id, 'repo_name': repo.name,
                    'description': repo.description, 'language': repo.language,
                    'stars': repo.stargazers_count, 'forks': repo.forks_count,
                    'created_at': repo.created_at, 'updated_at': repo.updated_at
                })
            time.sleep(1) # Rate limit
        except RateLimitExceededException: print("  > GitHub rate limit exceeded. Stopping."); break
        except Exception as e: print(f"  > WARNING: Could not fetch repos for {org_name}. Error: {e}"); continue
    
    if not all_repos_data: print("  > No repos found."); return pd.DataFrame()

    df = pd.DataFrame(all_repos_data)
    df['ingestion_timestamp'] = pd.Timestamp.now(tz='UTC')
    print(f"  > Successfully fetched {len(df)} repos.")
    return df

# --- LOAD TO BIGQUERY (Copy the exact same function from fetch_arxiv.py) ---
def load_to_bigquery(df, table_id):
    if df is None or df.empty: print(f"  > No data to load for {table_id}."); return
    full_table_id = f"{PROJECT_ID}.{RAW_DATASET_ID}.{table_id}"
    print(f"--- [LOAD] Loading {len(df)} rows to {full_table_id} ---")
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not credentials_path: raise ValueError("FATAL: GOOGLE_APPLICATION_CREDENTIALS not set.")
    credentials = service_account.Credentials.from_service_account_file(credentials_path)
    client = bigquery.Client(credentials=credentials, project=PROJECT_ID)
    job_config = bigquery.LoadJobConfig(write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE)
    try:
        job = client.load_table_from_dataframe(df, full_table_id, job_config=job_config); job.result()
        print(f"  > Successfully loaded data to {full_table_id}")
    except Exception as e: print(f"  > FATAL: Failed to load data to BigQuery: {e}")

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    print("\n=== STARTING GITHUB INGESTION PIPELINE ===")
    entities_df = pd.read_csv(ENTITIES_FILE)
    github_df = fetch_github_repos(entities_df)
    load_to_bigquery(github_df, TABLE_ID)
    print("\n=== GITHUB PIPELINE FINISHED ===\n")