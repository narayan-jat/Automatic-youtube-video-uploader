import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_PATH = path.resolve(__dirname, '..', 'data', 'uploads.json');

class Tracker {
    constructor(filePath = DEFAULT_PATH) {
        this.filePath = filePath;
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.filePath)) {
            const raw = fs.readFileSync(this.filePath, 'utf8');
            this.data = JSON.parse(raw || '{}');
            } else {
                this.data = {};
                this._save();
            }
        } catch (err) {
            this.data = {};
            this._save();
        }
    }

    _save() {
        try {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        } catch (err) {
            console.error(`[ERROR] Failed to save tracking file: ${err.message}`);
            throw err;
        }
    }

    isUploaded(fileName) {
        return !!this.data[fileName];
    }

    markUploaded(fileName) {
        this.data[fileName] = true;
        this._save();
    }
}

export default Tracker;