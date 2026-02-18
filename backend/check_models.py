import os
import asyncio
from dotenv import load_dotenv
from google import genai

load_dotenv()

async def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("No API Key found")
        return

    try:
        client = genai.Client(api_key=api_key)
        # Verify if list() is async or sync. Usually sync in new client or async in aio.
        # Let's try sync client for listing.
        
        print("Listing models...")
        # Pagination might be needed but usually returns iterable
        # Inspecting available models
        # Note: 'models.list' might not exist in exactly this form in 0.x versions?
        # Standard code for google-genai:
        pager = client.models.list()
        for model in pager:
            print(f"Model: {model.name}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import sys
    # asyncio.run(main()) 
    # Actually list is likely sync in standard client
    main() # try sync first logic
    try:
        asyncio.run(main())
    except:
        pass
