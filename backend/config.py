import os
from dotenv import load_dotenv
from pathlib import Path

# Get the path to the .env.local file (assuming backend is in project root)
env_path = Path(__file__).parent.parent / '.env.local'

# Load the .env.local file
load_dotenv(env_path)

# Get the API key
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("AI_API_KEY not found in .env.local") 