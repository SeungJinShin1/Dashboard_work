try:
    from google import genai
    print("Success: google.genai imported")
except ImportError as e:
    print(f"Error: {e}")
