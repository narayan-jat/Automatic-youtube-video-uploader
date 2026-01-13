import fs from 'fs';
import OpenAI from 'openai';

class OpenAIClient {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this.client = new OpenAI({ apiKey });
    }

    // Optional: transcribe audio (requires whisper access)
    async transcribeAudio(audioPath) {
        try {
            if (!fs.existsSync(audioPath)) {
                throw new Error(`Audio file not found: ${audioPath}`);
            }
            
            const transcription = await this.client.audio.transcriptions.create({
                file: fs.createReadStream(audioPath),
                model: 'whisper-1',
                response_format: 'json',
                language: 'hi'
            });
            
            const text = transcription.text;
            
            if (!text || text.trim().length === 0) {
                return null;
            }
            
            return text;
        } catch (err) {
            console.error(`[ERROR] OpenAI transcription failed: ${err.message}`);
            return null;
        }
    }

}

export default OpenAIClient;