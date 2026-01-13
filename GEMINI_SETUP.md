# How to Get Gemini API Key (Free)

Google's Gemini API is **FREE** with generous limits! Here's how to set it up:

## Step 1: Get Your API Key

1. **Go to Google AI Studio:**
   - Visit: https://aistudio.google.com/app/apikey
   - Or: https://makersuite.google.com/app/apikey

2. **Sign in with your Google account**
   - Use the same account or any Google account

3. **Create API Key:**
   - Click "Create API Key" or "Get API Key"
   - Select your Google Cloud project (or create a new one)
   - Copy the API key that's generated

4. **Add to .env file:**
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Step 2: Free Tier Limits

- **Free tier includes:**
  - 60 requests per minute
  - 1,500 requests per day
  - Perfect for personal use!

## Step 3: Update Your .env File

Add this line to your `.env` file:
```
GEMINI_API_KEY=your_actual_api_key_here
```

## Important Notes

- ✅ **FREE** - No credit card required
- ✅ **Generous limits** - More than enough for personal use
- ✅ **Same quality** - Uses Google's Gemini Pro model
- ✅ **Fast** - Low latency API

## Troubleshooting

If you get errors:
1. Make sure the API key is correct (no extra spaces)
2. Check that Gemini API is enabled in your Google Cloud project
3. Wait a few minutes after creating the key for it to activate

## That's it!

Once you add `GEMINI_API_KEY` to your `.env` file, the script will use Gemini instead of OpenAI for generating titles and descriptions.

