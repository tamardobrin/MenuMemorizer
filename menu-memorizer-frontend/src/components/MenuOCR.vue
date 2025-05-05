// MenuOCR.vue - Upload menu image, extract text with Tesseract.js, and parse with optional GPT
<template>
    <div class="ocr-container">
        <h2>📷 Upload Menu Image</h2>
        <input type="file" accept="image/*,application/pdf" @change="handleFile" />

        <div v-if="loading">⏳ Scanning menu...</div>
        <div v-if="error" class="error">{{ error }}</div>

        <div v-if="rawText">
            <h3>📝 Raw Text Extracted:</h3>
            <pre>{{ rawText }}</pre>
            <button @click="parseText">🧪 Parse Locally</button>
            <button @click="parseWithAI">🧠 Use AI to Parse</button>
        </div>

        <div v-if="parsed.length">
            <h3>🍽 Parsed Dishes & Ingredients</h3>
            <table>
                <thead>
                    <tr>
                        <th>Dish</th>
                        <th>Description</th>
                        <th>Ingredients</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, i) in parsed" :key="i">
                        <td>{{ item.name }}</td>
                        <td>{{ item.description }}</td>
                        <td>{{ item.ingredients.join(', ') }}</td>
                    </tr>
                </tbody>
            </table>
            <button @click="submitToBackend" :disabled="loading">
                💾 Save to DB
            </button>
        </div>
    </div>
</template>

<script>
import { parseAI, menuUpload } from "../api";
import Tesseract from 'tesseract.js';

export default {
    data() {
        return {
            rawText: '',
            loading: false,
            error: '',
            parsed: [],
        };
    },
    methods: {
        handleFile(event) {
            const file = event.target.files[0];
            if (!file) return;
            this.loading = true;
            this.error = '';

            Tesseract.recognize(file, 'eng')
                .then(({ data: { text } }) => {
                    this.rawText = text;
                })
                .catch(err => {
                    this.error = 'Failed to read image.';
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        parseText() {
            const lines = this.rawText.split('\n').filter(line => line.trim());
            this.parsed = lines.map(line => {
                const match = line.match(/^(.*?)\s*[-–—:]\s*(.*)$/);
                const name = match?.[1]?.trim() || "Unnamed";
                const description = match?.[2]?.trim() || "";
                const ingredients = description
                    .split(",")
                    .map(word => word.trim().toLowerCase())
                    .filter(word => word.length > 1);
                return { name, description, ingredients };
            });
        },
        async parseWithAI() {
            this.loading = true;
            try {
                const res = await parseAI({ text: this.rawText });
                this.parsed = res.data.items;
            } catch (e) {
                console.error(e);
                this.error = 'AI parsing failed.';
            }
            finally {
                this.loading = false;
            }
        },
        async submitToBackend() {
            try {
                await menuUpload(this.parsed);
                alert('Menu saved successfully!');
            } catch (e) {
                alert('Failed to save to backend.');
            }
        }
    }
};
</script>

<style scoped>
.ocr-container {
    padding: 2rem;
    max-width: 800px;
    margin: auto;
}

pre {
    background: #f9f9f9;
    padding: 1rem;
    border: 1px solid #ccc;
    white-space: pre-wrap;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

th,
td {
    border: 1px solid #ccc;
    padding: 0.5rem;
    text-align: left;
}

.error {
    color: red;
}

button {
    margin: 0.5rem;
    padding: 0.5rem 1rem;
    font-weight: bold;
}
</style>
