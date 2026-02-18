import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_model():
    api_key = os.getenv("GEMINI_API_KEY")
    # model = "gemini-3.0-flash" # Failed with 404
    model = "gemini-3-flash-preview" # User suggestion
    
    base_url = "https://generativelanguage.googleapis.com/v1beta/models"
    url = f"{base_url}/{model}:generateContent?key={api_key}"
    
    print(f"Testing URL: {url.split('?')[0]}?key=HIDDEN")
    
    data = {
        "contents": [{"parts": [{"text": "Hello, are you working?"}]}]
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=data, timeout=30.0)
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_model())
