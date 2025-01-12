import os
from dotenv import load_dotenv
from pathlib import Path

# Get the path to the .env.local file (assuming backend is in project root)
env_path = Path(__file__).parent.parent / '.env.local'

# Load the .env.local file
load_dotenv(env_path)

# Get the AI provider type
AI_PROVIDER = os.getenv('AI_PROVIDER')

# Get the appropriate API key based on provider
def get_ai_api_key():
    if AI_PROVIDER == 'anthropic':
        return os.getenv('ANTHROPIC_API_KEY')
    elif AI_PROVIDER == 'openai':
        return os.getenv('OPENAI_API_KEY')
    elif AI_PROVIDER == 'bedrock':
        return None  # Bedrock uses AWS credentials
    return None

AI_API_KEY = get_ai_api_key()

if not AI_API_KEY and AI_PROVIDER not in ['bedrock']:
    raise ValueError(f"API key not found for provider {AI_PROVIDER}") 