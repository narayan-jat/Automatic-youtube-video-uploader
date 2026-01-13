import fs from 'fs';

class GeminiClient {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Gemini API key is required');
        }
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    }

    // Transcribe audio using Gemini's multimodal capabilities
    async transcribeAudio(audioPath) {
        try {
            if (!fs.existsSync(audioPath)) {
                throw new Error(`Audio file not found: ${audioPath}`);
            }

            const audioBuffer = fs.readFileSync(audioPath);
            const audioBase64 = audioBuffer.toString('base64');
            
            const fileExt = audioPath.split('.').pop().toLowerCase();
            let mimeType = 'audio/wav';
            if (fileExt === 'mp3') mimeType = 'audio/mpeg';
            else if (fileExt === 'm4a') mimeType = 'audio/mp4';
            else if (fileExt === 'wav') mimeType = 'audio/wav';
            else if (fileExt === 'webm') mimeType = 'audio/webm';

            const resp = await fetch(
                `${this.baseUrl}/models/gemini-3-flash-preview:generateContent`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': this.apiKey
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {
                                    text: 'Transcribe this audio file in Hindi/Hinglish. Return only the transcribed text without any additional commentary or formatting.'
                                },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: audioBase64
                                    }
                                }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 4096
                        }
                    })
                }
            );

            if (!resp.ok) {
                const errorText = await resp.text();
                console.error(`[ERROR] Gemini transcription API error (${resp.status}): ${errorText}`);
                return null;
            }

            const data = await resp.json();

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error('[ERROR] Invalid response format from Gemini API');
                return null;
            }

            const text = data.candidates[0].content.parts[0].text.trim();

            if (!text || text.trim().length === 0) {
                return null;
            }

            return text;
        } catch (err) {
            console.error(`[ERROR] Transcription failed: ${err.message}`);
            return null;
        }
    }

    async generateTitleAndDescription(videoContext) {
        const prompt = `You are a YouTube content creator assistant that generates viral YouTube titles, descriptions and tags in Hinglish (Hindi-English mix) with emojis. The content should be engaging, use Hindi words mixed with English, and include relevant emojis to attract viewers.

Analyze the following video context and produce a short, viral title (under 60 chars) in Hinglish with emojis, an SEO-friendly description (max 4000 chars) in Hinglish with emojis, and a list of tags in Hinglish/Hindi.

Remember: Use Hinglish (Hindi-English mix), add emojis to make it attractive, and make it engaging for Hindi-speaking audience.

Video Context:
${videoContext}

Return ONLY a valid JSON object with keys: title, description, tags (as an array).`;
        
        try {
            const resp = await fetch(
                `${this.baseUrl}/models/gemini-3-flash-preview:generateContent`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': this.apiKey
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.8,
                            maxOutputTokens: 60000,
                            responseMimeType: 'application/json'
                        }
                    })
                }
            );

            if (!resp.ok) {
                const errorText = await resp.text();
                console.error(`[ERROR] Gemini API error (${resp.status}): ${errorText}`);
                throw new Error(`Failed to generate title and description: ${resp.status} ${errorText}`);
            }
            
            const data = await resp.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response format from Gemini API');
            }

            const content = data.candidates[0].content.parts[0].text.trim();

            try {
                const parsed = JSON.parse(content);
                return {
                    title: parsed.title || '',
                    description: parsed.description || '',
                    tags: Array.isArray(parsed.tags) ? parsed.tags : (parsed.tags ? parsed.tags.split(',').map(t => t.trim()) : [])
                };
            } catch (parseErr) {
                const [titleLine, ...descLines] = content.split('\n');
                return { title: titleLine.trim(), description: descLines.join('\n').trim(), tags: [] };
            }
        } catch (error) {
            throw new Error(`Failed to generate title and description: ${error.message}`);
        }
    }
}

export default GeminiClient;

