# Facebook Integration Setup Guide

This guide will help you set up Facebook integration to automatically post reels and videos to Facebook.

## Features

- **Post Reels**: Upload videos as Facebook Reels with rich metadata
- **Post Videos**: Upload videos as regular Facebook video posts
- **Post Status**: Post text/image posts with hashtags
- **Rich Parameters**: Support for captions, hashtags, locations, thumbnails, and more

## Setup Instructions

### Step 1: Create Facebook App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as app type
4. Fill in app details and create

### Step 2: Add Required Products

1. In your app dashboard, go to "Add Products"
2. Add these products:
   - **Facebook Login** (for authentication)
   - **Instagram Graph API** (if posting to Instagram too)
   - **Pages** (for page management)

### Step 3: Configure App Settings

1. Go to **Settings** → **Basic**
2. Add **OAuth Redirect URIs**: `http://localhost:3000/facebook-callback`
3. Save changes

### Step 4: Get Required Permissions

Your app needs these permissions:
- `pages_manage_posts` - To post on pages
- `pages_read_engagement` - To read page data
- `pages_show_list` - To list user's pages
- `publish_video` - To publish videos
- `publish_to_groups` - If posting to groups (optional)

### Step 5: Get Access Token

#### Option A: Using Graph API Explorer (Quick Test)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Add permissions: `pages_manage_posts`, `pages_read_engagement`
4. Generate access token
5. Copy the token (short-lived, expires in 1-2 hours)

#### Option B: Get Long-Lived Page Access Token (Recommended)

1. Get User Access Token (from Graph API Explorer or OAuth flow)
2. Exchange for Long-Lived User Token:
   ```
   GET https://graph.facebook.com/v21.0/oauth/access_token?
     grant_type=fb_exchange_token&
     client_id=YOUR_APP_ID&
     client_secret=YOUR_APP_SECRET&
     fb_exchange_token=SHORT_LIVED_TOKEN
   ```

3. Get Page Access Token:
   ```
   GET https://graph.facebook.com/v21.0/me/accounts?
     access_token=LONG_LIVED_USER_TOKEN
   ```

4. Use the `access_token` from the response (this is your Page Access Token)

### Step 6: Get Page ID (Optional)

If posting to a specific page:
1. Go to your Facebook Page
2. Click "About" → "Page ID" is shown there
3. Or use Graph API: `GET /me/accounts` to list all pages

### Step 7: Update .env File

Add these variables to your `.env` file:

```bash
# Facebook Integration
ENABLE_FACEBOOK=true
FACEBOOK_ACCESS_TOKEN=your_page_access_token_here
FACEBOOK_PAGE_ID=your_page_id_here  # Optional, leave empty for personal profile
```

## Usage

### Automatic Upload (Integrated)

The uploader will automatically post to Facebook as a Reel after YouTube upload if:
- `ENABLE_FACEBOOK=true` is set
- `FACEBOOK_ACCESS_TOKEN` is provided

### Manual Usage

```javascript
import FacebookClient from './src/facebookClient.js';

const facebook = new FacebookClient(
    process.env.FACEBOOK_ACCESS_TOKEN,
    process.env.FACEBOOK_PAGE_ID  // Optional
);

// Post as Reel
const result = await facebook.postReel('/path/to/video.mp4', {
    caption: 'Check out this amazing video!',
    hashtags: ['viral', 'trending', 'funny'],
    publishToFeed: true
});

// Post as regular video
const result = await facebook.postVideo('/path/to/video.mp4', {
    message: 'My new video!',
    hashtags: ['video', 'content'],
    published: true
});

// Post status with image
const result = await facebook.postStatus({
    message: 'Check this out!',
    hashtags: ['update'],
    imagePath: '/path/to/image.jpg'
});
```

## API Methods

### `postReel(videoPath, options)`

Upload video as Facebook Reel.

**Parameters:**
- `videoPath` (string): Path to video file
- `options` (object):
  - `caption` (string): Caption/text for the reel
  - `hashtags` (array): Array of hashtags (without #)
  - `locationId` (string): Facebook location ID (optional)
  - `thumbOffset` (number): Thumbnail offset in seconds (optional)
  - `publishToFeed` (boolean): Publish to feed (default: true)
  - `targeting` (object): Targeting options (optional)

**Returns:** `{ success: true, reelId: string, permalink: string }`

### `postVideo(videoPath, options)`

Upload video as regular Facebook post.

**Parameters:**
- `videoPath` (string): Path to video file
- `options` (object):
  - `message` (string): Post message
  - `hashtags` (array): Array of hashtags
  - `locationId` (string): Facebook location ID (optional)
  - `thumbOffset` (number): Thumbnail offset (optional)
  - `title` (string): Video title (optional)
  - `description` (string): Video description (optional)
  - `published` (boolean): Publish immediately (default: true)
  - `privacy` (string): Privacy setting (default: 'EVERYONE')

**Returns:** `{ success: true, postId: string, permalink: string }`

### `postStatus(options)`

Post text/image status.

**Parameters:**
- `options` (object):
  - `message` (string): Post message
  - `hashtags` (array): Array of hashtags
  - `imagePath` (string): Path to image file (optional)
  - `locationId` (string): Facebook location ID (optional)
  - `link` (string): Link to attach (optional)
  - `published` (boolean): Publish immediately (default: true)

**Returns:** `{ success: true, postId: string, permalink: string }`

## Video Requirements

### For Reels:
- **Aspect Ratio**: 9:16 (vertical)
- **Duration**: 4 to 60 seconds
- **Resolution**: Minimum 540 x 960 pixels
- **Format**: MP4, MOV, or other supported formats

### For Regular Videos:
- **Duration**: Up to 240 minutes
- **Resolution**: Various supported
- **Format**: MP4, MOV, or other supported formats

## Troubleshooting

### "Invalid OAuth access token"
- Token may have expired
- Get a new long-lived token
- Make sure token has required permissions

### "Permission denied"
- Check app permissions in Meta for Developers
- Ensure `pages_manage_posts` permission is granted
- App may need to be in Live mode for production

### "Video upload failed"
- Check video format and size
- Ensure video meets requirements
- Check network connection

### "Page not found"
- Verify `FACEBOOK_PAGE_ID` is correct
- Ensure access token has access to the page
- Try leaving `FACEBOOK_PAGE_ID` empty for personal profile

## Security Notes

- **Never commit** `.env` file with tokens
- **Use Page Access Tokens** instead of User Access Tokens when possible
- **Rotate tokens** periodically
- **Keep tokens secure** and don't share them

## Additional Resources

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Reels Publishing API](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Video Upload API](https://developers.facebook.com/docs/graph-api/reference/video)

