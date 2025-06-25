import os
import requests
import pandas as pd
from lxml import etree as ET
from datetime import datetime, timedelta
from dotenv import load_dotenv
from google.cloud import bigquery
from google.oauth2 import service_account
from pathlib import Path
# --- A. LOAD CONFIGURATION ---

# This loads the .env file and makes GOOGLE_APPLICATION_CREDENTIALS available
load_dotenv() 





PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

ENTITIES_FILE = PROJECT_ROOT / "seeds" / "entities.csv"
TECHNOLOGIES_FILE = PROJECT_ROOT / "seeds" / "technologies.csv"


# Your BigQuery project and dataset details
PROJECT_ID = 'genesis-engine-prod' # IMPORTANT: Replace with your actual GCP Project ID
DATASET_ID = 'raw_data'
TABLE_ID = 'raw_arxiv'

# --- B. DATA ACQUISITION ---
def fetch_arxiv_data(technologies_df):
    """Fetches new AI papers from the arXiv API based on a list of keywords."""
    print("Fetching data from arXiv API...")
    
    # Create a search query from all keywords in our config file
    all_keywords = '"' + '" OR "'.join(technologies_df['search_keywords'].dropna()) + '"'
    search_query = f'all:({all_keywords})'
    
    base_url = 'http://export.arxiv.org/api/query?'
    # Note: arXiv API is powerful but can be slow. We fetch a reasonable number of recent papers.
    query = f'search_query={search_query}&sortBy=submittedDate&sortOrder=descending&max_results=500'
    
    try:
        response = requests.get(base_url + query)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from arXiv: {e}")
        return pd.DataFrame()

    print("Parsing XML response...")
    root = ET.fromstring(response.content)
    
    papers = []
    # The arXiv API uses a specific XML namespace, which we need to include when finding tags
    namespace = '{http://www.w3.org/2005/Atom}'
    for entry in root.findall(f'{namespace}entry'):
        paper_data = {
            'paper_id': entry.find(f'{namespace}id').text,
            'published_date': entry.find(f'{namespace}published').text,
            'updated_date': entry.find(f'{namespace}updated').text,
            'title': entry.find(f'{namespace}title').text,
            'summary': entry.find(f'{namespace}summary').text.strip(),
            'authors': ', '.join([author.find(f'{namespace}name').text for author in entry.findall(f'{namespace}author')])
        }
        papers.append(paper_data)
        
    if not papers:
        print("No new papers found for the given keywords.")
        return pd.DataFrame()
        
    df = pd.DataFrame(papers)
    df['published_date'] = pd.to_datetime(df['published_date'])
    df['updated_date'] = pd.to_datetime(df['updated_date'])
    df['ingestion_timestamp'] = datetime.utcnow() # Add a timestamp for when we ingested the data
    
    print(f"Successfully fetched and parsed {len(df)} papers.")
    return df

# --- C. DATA LOADING ---
def load_data_to_bigquery(df, project_id, dataset_id, table_id):
    """Loads a Pandas DataFrame into a BigQuery table, overwriting it."""
    if df.empty:
        print("No data to load. Skipping BigQuery upload.")
        return

    full_table_id = f"{project_id}.{dataset_id}.{table_id}"
    print(f"Loading data to BigQuery table: {full_table_id}")
    
    # Use the service account key from the environment variable for authentication
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not credentials_path:
        raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable not set.")
        
    credentials = service_account.Credentials.from_service_account_file(credentials_path)
    client = bigquery.Client(credentials=credentials, project=project_id)
    
    job_config = bigquery.LoadJobConfig(
        # Overwrite the table every time. This is simpler for our V1.
        # Later, we can change this to append only new data.
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )
    
    try:
        job = client.load_table_from_dataframe(df, full_table_id, job_config=job_config)
        job.result()
        print(f"Successfully loaded {len(df)} rows to {full_table_id}")
    except Exception as e:
        print(f"Failed to load data to BigQuery: {e}")

# --- D. MAIN EXECUTION SCRIPT ---
if __name__ == "__main__":
    print("--- Starting arXiv Ingestion Pipeline ---")
    
    # Load our strategic configuration
    tech_df = pd.read_csv(TECHNOLOGIES_FILE)
    
    # Run the pipeline
    arxiv_df = fetch_arxiv_data(tech_df)
    load_data_to_bigquery(arxiv_df, PROJECT_ID, DATASET_ID, TABLE_ID)
    
    print("--- Pipeline finished successfully. ---")