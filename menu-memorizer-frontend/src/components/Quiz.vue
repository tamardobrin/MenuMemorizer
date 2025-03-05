<template>
  <div class="quiz-container">
    <h1 class="title">Quiz</h1>
    <div v-if="quiz.length">
      <div v-for="(question, index) in quiz" :key="index" class="question-card">
        <p class="question-text">{{ question.question }}</p>
        <audio-player :text="question.question" />
        <div class="options-container">
          <!-- Multi-select (ingredients) -->
          <label
            v-if="question.type === 'multi-select'"
            v-for="(option, i) in question.options"
            :key="i"
            class="option-label"
          >
            <input
              type="checkbox"
              :value="option"
              :checked="selectedAnswers[index]?.includes(option)"
              @change="updateMultiSelect(index, option)"
              class="option-input"
            />
            <span class="option-text">{{ option }}</span>
          </label>

          <!-- Single-select (description) -->
          <label
            v-if="question.type === 'single-select'"
            v-for="(option, i) in question.options"
            :key="i"
            class="option-label"
          >
            <input
              type="radio"
              :value="option"
              v-model="selectedAnswers[index]"
              :name="`question-${index}`"
              class="option-input"
            />
            <span class="option-text">{{ option }}</span>
          </label>
        </div>
        <button
          @click="checkAnswer(index, question.correctAnswers || question.correctAnswer)"
          class="submit-btn"
        >
          Submit
        </button>
        <p v-if="feedback[index]" class="feedback-text">{{ feedback[index] }}</p>
      </div>
    </div>
    <div v-else>
      <p class="loading-text">Loading quiz...</p>
    </div>
  </div>
</template>

<script>
import { fetchMenuItems } from "../api";
import AudioPlayer from "./AudioPlayer.vue";

export default {
  components: { AudioPlayer },
  data() {
    return {
      quiz: [], // quiz questions
      selectedAnswers: {}, // tracks user-selected answers per question
      feedback: {}, // feedback for each question
    };
  },
  async mounted() {
    try {
      const response = await fetchMenuItems();
      const category = this.$route.query.category || null;

      const menuItems = response.data;

      //filter items by category if one is selected
      const filteredItems = category
        ? menuItems.filter(item => item.category === category)
        : menuItems;

      // generate questions
      this.quiz = filteredItems.flatMap(item => {
        const descriptionQuestion = {
          type: "single-select",
          question: `What is the description of "${item.name}"?`,
          correctAnswer: item.description,
          options: [
            item.description,
            ...this.generateDistractors(menuItems, item.id, "description"),
          ].sort(() => Math.random() - 0.5),
        };

        const ingredientQuestion = {
          type: "multi-select",
          question: `Which of these are ingredients for "${item.name}"?`,
          correctAnswers: item.ingredients || [],
          options: [
            ...(item.ingredients || []),
            ...this.generateDistractors(menuItems, item.id, "ingredients"),
          ].sort(() => Math.random() - 0.5),
        };

        return [descriptionQuestion, ingredientQuestion];
      });

      // initialize selectedAnswers for each question
      this.quiz.forEach((_, index) => {
        this.selectedAnswers[index] = [];
      });
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  },
  methods: {
    generateDistractors(items, excludeId, key) {
      return items
        .filter(item => item.id !== excludeId)
        .flatMap(item => (Array.isArray(item[key]) ? item[key] : [item[key]]))
        .filter(Boolean)
        .slice(0, 3); // limit to 3 distractors
    },
    updateMultiSelect(index, option) {
      const answers = this.selectedAnswers[index] || [];
      if (answers.includes(option)) {
        this.selectedAnswers[index] = answers.filter(answer => answer !== option);
      } else {
        this.selectedAnswers[index] = [...answers, option];
      }
    },
    checkAnswer(index, correctAnswers) {
      const selected = this.selectedAnswers[index] || [];
      const isCorrect =
        Array.isArray(correctAnswers)
          ? selected.length === correctAnswers.length &&
            selected.every(answer => correctAnswers.includes(answer))
          : selected === correctAnswers;

      this.feedback[index] = isCorrect
        ? "Correct! 🎉"
        : Array.isArray(correctAnswers)
        ? `Incorrect. The correct answers are: ${correctAnswers.join(", ")}`
        : `Incorrect. The correct answer is: ${correctAnswers}`;
    },
  },
};
</script>


<style scoped>
.quiz-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.title {
  text-align: center;
  font-size: 2.5rem;
  color: #4caf50;
  margin-bottom: 30px;
}

.question-card {
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.question-text {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.options-container {
  margin-bottom: 20px;
}

.option-label {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  cursor: pointer;
}

.option-input {
  margin-right: 10px;
  transform: scale(1.2);
}

.option-text {
  font-size: 1rem;
}

.submit-btn {
  display: inline-block;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #45a049;
}

.feedback-text {
  margin-top: 10px;
  font-size: 1rem;
  font-weight: bold;
  color: #f44336;
}

.feedback-text.correct {
  color: #4caf50;
}

.loading-text {
  text-align: center;
  font-size: 1.5rem;
  color: #777;
}
</style>
