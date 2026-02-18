from backend.main import app

# Vercel needs a handler or just exposing app might work if using "builds" config.
# But for modern Zero configuration:
# It looks for `app` variable.
