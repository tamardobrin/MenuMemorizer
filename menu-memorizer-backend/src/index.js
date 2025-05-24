import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { OpenAI } from "openai";
import vision from '@google-cloud/vision';
import path from 'path';
import fs from 'fs';

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(process.cwd(), 'vision-key.json'),
});

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/categories", async (req, res) => {
  const categories = await prisma.menuItem.findMany({
    select: { category: true },
    distinct: ["category"],
  });
  res.json(categories.map(c => c.category));
});


app.post("/menu", async (req, res) => {
  const { name, description, category, price, ingredients } = req.body;
  try {
    const menuItem = await prisma.menuItem.create({
      data: { name, description, category, price, ingredients },
    });
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/ingredients", async (req, res) => {
  const { name } = req.body;
  try {
    const ingredient = await prisma.ingredient.create({
      data: { name },
    });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/menu/:id/ingredients", async (req, res) => {
  const { id } = req.params;
  const { ingredientIds } = req.body;

  try {
    const links = await Promise.all(
      ingredientIds.map(ingredientId =>
        prisma.menuItemIngredient.create({
          data: {
            menuItemId: parseInt(id, 10),
            ingredientId,
          },
        })
      )
    );
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post("/menu/parse-ai", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const prompt = `Extract a structured list of menu items from the OCR text below.

Split the menu into categories (like Starters, Main dishes, Pasta, Desserts) based on section headers.

Each item must include:
- name (required)
- price (number, if found)
- description (optional, a short general summary or how it's prepared)
- ingredients (optional, split into 3–6 core ingredients used, not general phrases)

Avoid putting ingredients in the description. Parse ingredients from the text when available.
If a dish mentions ingredients like "chicken, garlic, lemon", split them as ingredients.
Only use description for prep style or presentation like "served over rice with sauce".

Respond ONLY with a JSON array. No extra text.

OCR text:
"""
${text}
"""`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content.trim();
    console.log("GPT Response:\n", responseText);

    const jsonStart = responseText.indexOf("[");
    const jsonEnd = responseText.lastIndexOf("]") + 1;
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Could not locate JSON array in GPT response.");
    }
    
    const jsonString = responseText.slice(jsonStart, jsonEnd);
    
    let items;
    try {
      items = JSON.parse(jsonString);
    } catch (err) {
      console.log("GPT raw output:\n", responseText);
      throw new Error("Invalid JSON in trimmed GPT output:\n" + jsonString);
    }    

    res.json({ items, original: responseText });
  } catch (err) {
    console.error("AI parsing error:\n", err.message);
    res.status(500).json({
      error: "Failed to parse with AI",
      details: err.message,
    });
  }
});

app.post('/menu/ocr-google', async (req, res) => {
  const { base64Image } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    const [result] = await client.documentTextDetection({
      image: { content: base64Image },
    });

    const text = result.fullTextAnnotation?.text || '';
    res.json({ text });
  } catch (err) {
    console.error('Vision OCR error:', err.message);
    res.status(500).json({
      error: 'Vision OCR failed',
      details: err.message,
    });
  }
});

app.post("/menu/upload", async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Items should be an array" });
  }

  try {
    const savedItems = [];

    for (const item of items) {
      const { name, description, ingredients } = item;
      const category = item.category || "Uncategorized";
      const price = 0; 

      const menuItem = await prisma.menuItem.create({
        data: { name, description, category, price },
      });

      const ingredientRecords = await Promise.all(
        ingredients.map(async (ingName) => {
          const existing = await prisma.ingredient.findUnique({
            where: { name: ingName },
          });

          if (existing) return existing;

          return await prisma.ingredient.create({
            data: { name: ingName },
          });
        })
      );

      // 3. Link ingredients to menu item
      await Promise.all(
        ingredientRecords.map((ing) =>
          prisma.menuItemIngredient.create({
            data: {
              menuItemId: menuItem.id,
              ingredientId: ing.id,
            },
          })
        )
      );

      savedItems.push(menuItem);
    }

    res.json({ success: true, items: savedItems });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/menu", async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    const formattedMenuItems = menuItems.map(item => ({
      ...item,
      ingredients: item.ingredients.map(link => link.ingredient.name),
    }));

    res.json(formattedMenuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get("/quiz", async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    const quiz = menuItems.flatMap(item => {
      const correctIngredients = item.ingredients.map(link => link.ingredient.name);

      const ingredientDistractors = menuItems
        .flatMap(mi => mi.ingredients.map(link => link.ingredient.name))
        .filter(ingredient => !correctIngredients.includes(ingredient));

      const descriptionDistractors = menuItems
        .filter(mi => mi.id !== item.id)
        .map(mi => mi.description);

      const ingredientQuestion = generateMultiSelectQuestion(
        `Select all ingredients for "${item.name}":`,
        correctIngredients,
        shuffle(ingredientDistractors).slice(0, 5)
      );

      const descriptionQuestion = generateSingleSelectQuestion(
        `What is the correct description for "${item.name}"?`,
        item.description,
        shuffle(descriptionDistractors).slice(0, 3)
      );

      return [ingredientQuestion, descriptionQuestion];
    });

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//generate multi-select questions
function generateMultiSelectQuestion(question, correctAnswers, distractorOptions) {
  const allOptions = shuffle([...correctAnswers, ...distractorOptions]);
  return {
    type: "multi-select",
    question,
    correctAnswers,
    options: allOptions,
  };
}

//generate single-select questions
function generateSingleSelectQuestion(question, correctAnswer, distractorOptions) {
  const allOptions = shuffle([correctAnswer, ...distractorOptions]);
  return {
    type: "single-select",
    question,
    correctAnswer,
    options: allOptions,
  };
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
