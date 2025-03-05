import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

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

    //format the response to include ingredients as an array of names
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
