<template>
    <div class="category-selector">
      <h1 class="title">Select a Category</h1>
      <div class="categories">
        <button
          v-for="(category, index) in categories"
          :key="index"
          @click="selectCategory(category)"
          class="category-button"
        >
          {{ category }}
        </button>
      </div>
    </div>
  </template>
  
  <script>
import { inject } from "vue";

export default {
  setup() {
    const setCategory = inject("setCategory");

    return {
      setCategory,
    };
  },
  data() {
    return {
      categories: ["עיקריות", "ראשונות", "קינוחים"], 
    };
  },
  methods: {
    selectCategory(category) {
      this.setCategory(category);
      this.$router.push({ path: "/flashcards", query: { category } });
    },
  },
};
</script>
  
<style scoped>
.category-selector {
  text-align: center;
  margin-top: 50px;
}

.title {
  font-size: 2rem;
  color: #4caf50;
  margin-bottom: 30px;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.category-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  margin: 10px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.category-button:hover {
  background-color: #45a049;
}
</style>