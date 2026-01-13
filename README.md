# YouTube Uploader

This project is designed to automate the process of uploading videos to YouTube. It picks videos from a specified folder, analyzes them using OpenAI to generate suitable titles and descriptions, and uploads them to YouTube with the appropriate settings.

## Project Structure

```
youtube-uploader
├── src
│   ├── script.js          # Main entry point for the video uploading process
│   ├── uploader.js        # Handles the logic for uploading videos to YouTube
│   ├── youtubeClient.js    # Interacts with the YouTube Data API
│   ├── openaiClient.js     # Communicates with the OpenAI API for metadata generation
│   ├── metadataExtractor.js # Analyzes video files to extract relevant metadata
│   └── tracker.js         # Manages tracking of uploaded videos
├── videos                 # Folder containing videos to be uploaded
├── data
│   └── uploads.json       # JSON file tracking uploaded videos
├── tests
│   └── uploader.test.js    # Unit tests for the Uploader class
├── .env.example           # Example of environment variables needed for the project
├── package.json           # npm configuration file
└── README.md              # Documentation for the project
```

## Features

- Automatically uploads videos from a specified folder.
- Generates viral titles and descriptions using OpenAI.
- Tracks uploaded videos to avoid duplicates.
- Configurable settings for each upload, including language and audience settings.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd youtube-uploader
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and fill in your API keys for YouTube and OpenAI.

4. Place your videos in the `videos` folder.

5. Run the uploader:
   ```
   node src/script.js
   ```

## Usage

The script will automatically pick videos from the `videos` folder, analyze them, generate suitable titles and descriptions, and upload them to YouTube. It will also update the `data/uploads.json` file to keep track of uploaded videos.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.