// Updated MenuOCR.vue - Improved prompt handling for AI parsing
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

        <div v-if="aiResponse">
            <h3>Raw AI Response</h3>
            <pre>{{ aiResponse }}</pre>
        </div>

        <div v-if="parsed.length">
            <h3>🍽 Parsed Menu</h3>
            <div v-for="(group, index) in parsed" :key="index" class="category-group">
                <h4 class="category-title">{{ group.category }}</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Dish</th>
                            <th>Description</th>
                            <th>Ingredients</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(dish, i) in group.dishes || []" :key="i">
                            <td>{{ dish.name }}</td>
                            <td>{{ dish.description || '-' }}</td>
                            <td>{{ (dish.ingredients || []).join(', ') }}</td>
                            <td>{{ dish.price != null ? '₪' + dish.price : '-' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <button @click="submitToBackend">💾 Save to DB</button>
        </div>
    </div>
</template>

<script>
import { parseAI, menuUpload, googleOCR } from "../api";
import Tesseract from 'tesseract.js';

export default {
    data() {
        return {
            rawText: '',
            loading: false,
            error: '',
            parsed: [],
            aiResponse: '',
        };
    },
    methods: {
        handleFile(event) {
            const file = event.target.files[0];
            if (!file) return;
            this.loading = true;
            this.error = '';

            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                try {
                    const res = await googleOCR(base64);
                    this.rawText = res.data.text;
                } catch (e) {
                    this.error = 'Google Vision OCR failed.';
                } finally {
                    this.loading = false;
                }
            };
            reader.readAsDataURL(file);
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
                this.parsed = res.data.items || [];
                console.log("Parsed categories:", this.parsed);
                this.aiResponse = JSON.stringify(res.data.original, null, 2);
            } catch (e) {
                console.error(e);
                this.error = 'AI parsing failed.';
            } finally {
                this.loading = false;
            }
        },
        async submitToBackend() {
            try {
                await menuUpload(parsed.flatMap(group => group.dishes.map(dish => ({
                    ...dish,
                    category: group.category
                }))));

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

.category-group {
    margin-bottom: 2rem;
}

.category-title {
    font-size: 1.4rem;
    font-weight: bold;
    color: #4caf50;
    margin: 1rem 0 0.5rem;
}
</style>
