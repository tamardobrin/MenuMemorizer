import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { OpenAI } from "openai";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(bodyParser.json());

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


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/menu/parse-ai", async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: "No text provided" });

  const prompt = `You are a helpful assistant that parses restaurant menus.
Given the following OCR'd menu text, extract a list of dishes.
Each dish should include:
- name
- description (if available)
- a list of ingredients
Return a JSON array like this:
[
  {
    "name": "Dish Name",
    "description": "Description here",
    "ingredients": ["ingredient1", "ingredient2"]
  }
]

Text:
"""
${text}
"""`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content;

    const jsonStart = responseText.indexOf("[");
    const jsonString = responseText.slice(jsonStart);
    const items = JSON.parse(jsonString);

    res.json({ items });
  } catch (err) {
    console.error("AI parsing error:", err);
    res.status(500).json({ error: "Failed to parse with AI" });
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
      const category = "Uncategorized"; 
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
