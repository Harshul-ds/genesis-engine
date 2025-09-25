import os
from dotenv import load_dotenv

# --- LangChain components for document processing ---
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# --- Our core ML and DB clients ---
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec

# ==============================================================================
# 1. INITIALIZATION & SETUP
# ==============================================================================
print("Initializing ingestion script...")
load_dotenv(dotenv_path="frontend/nextjs-chatbot/.env.local") # Load secrets

# --- Pinecone Configuration ---
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.environ.get("PINECONE_ENVIRONMENT")
INDEX_NAME = "matter-with-things-kb"

if not PINECONE_API_KEY or not PINECONE_ENVIRONMENT:
    raise ValueError("Pinecone API Key or Environment not found in environment variables.")

pc = Pinecone(api_key=PINECONE_API_KEY)

# --- Embedding Model Configuration ---
# Using a high-quality, lightweight model that runs locally on your CPU
MODEL_NAME = 'all-MiniLM-L6-v2'
print(f"Loading embedding model: {MODEL_NAME}...")
# The singleton pattern is implicitly handled by how SentenceTransformer loads models
model = SentenceTransformer(MODEL_NAME)
print("Model loaded successfully.")

# ==============================================================================
# 2. THE INGESTION PIPELINE
# ==============================================================================
def run_ingestion():
    """
    The complete end-to-end pipeline to ingest the book into Pinecone.
    """
    # --- Step A: Load the Document ---
    print("Loading book source from data/the_matter_with_things.txt...")
    loader = TextLoader("data/the_matter_with_things.txt")
    documents = loader.load()
    print(f"Successfully loaded {len(documents)} document sections.")

    # --- Step B: Chunk the Text ---
    print("Splitting document into semantic chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,     # The target size of each chunk in characters
        chunk_overlap=50,   # An overlap to maintain context between chunks
        length_function=len,
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Document split into {len(chunks)} chunks.")

    # --- Step C: Connect to the Pinecone Index ---
    print(f"Connecting to Pinecone index: '{INDEX_NAME}'...")
    if INDEX_NAME not in pc.list_indexes().names():
        raise ValueError(f"Index '{INDEX_NAME}' does not exist in Pinecone. Please create it first.")
    index = pc.Index(INDEX_NAME)
    print("Successfully connected to index. Index stats:", index.describe_index_stats())

    # --- Step D: Embed and Upsert Chunks in Batches ---
    print("Starting embedding and upsert process...")
    batch_size = 32 # Process 32 chunks at a time for efficiency

    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i : i + batch_size]

        # Get the text content from each LangChain Document object
        batch_texts = [chunk.page_content for chunk in batch_chunks]

        # Embed the batch of texts
        print(f"  - Embedding batch {i//batch_size + 1}...")
        embeddings = model.encode(batch_texts).tolist()

        # Prepare the data for Pinecone
        # Each record needs a unique ID, the vector, and the metadata
        vectors_to_upsert = []
        for j, chunk in enumerate(batch_chunks):
            vector_id = f"book_chunk_{i+j}"
            metadata = {
                "text": chunk.page_content,
                "source": chunk.metadata.get("source", "the_matter_with_things.txt"),
            }
            vectors_to_upsert.append({
                "id": vector_id,
                "values": embeddings[j],
                "metadata": metadata
            })

        # Upsert the batch to Pinecone
        print(f"  - Upserting batch {i//batch_size + 1} to Pinecone...")
        index.upsert(vectors=vectors_to_upsert)

    print("\n✅ Ingestion complete!")
    print("Final index stats:", index.describe_index_stats())


# ==============================================================================
# 3. SCRIPT EXECUTION
# ==============================================================================
if __name__ == "__main__":
    run_ingestion()
