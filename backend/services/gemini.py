import httpx
import os
import json

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.api_key = self.api_key.strip().strip("'").strip('"')
        else:
            print("Warning: GEMINI_API_KEY not found.")
        # User explicitly requested 3.0 (preview)
        self.model_name = "gemini-3-flash-preview" 
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    async def generate_content(self, prompt: str) -> str:
        if not self.api_key:
             return "Error: Gemini API Key not found."
             
        url = f"{self.base_url}/{self.model_name}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, json=data, timeout=120.0)
                
                if resp.status_code != 200:
                    return f"Error: API Request Failed ({resp.status_code}) - {resp.text}"
                    
                result = resp.json()
                # Parse response structure
                try:
                    return result['candidates'][0]['content']['parts'][0]['text']
                except (KeyError, IndexError):
                    return f"Error: Unexpected API Response format - {result}"
                    
            except Exception as e:
                print(f"Error calling Gemini via REST: {e}")
                return f"Error: {str(e)}"

gemini_service = GeminiService()
