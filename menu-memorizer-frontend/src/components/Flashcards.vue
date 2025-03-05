<template>
    <div class="flashcards-container">
      <h1 class="title">Flashcards</h1>
      <div v-if="filteredItems.length">
        <div class="flashcard" :class="{ flipped: isFlipped }" @click="flipCard">
          <div class="front">
            <p class="flashcard-text">{{ filteredItems[currentIndex].name }}</p>
          </div>
          <div class="back">
            <div class="scrollable-content">
              <p class="flashcard-text">
                <strong>Description:</strong> {{ filteredItems[currentIndex].description }}
              </p>
              <p class="flashcard-text">
                <strong>Ingredients:</strong>
              </p>
              <ul class="ingredients-list">
                <li
                  v-for="(ingredient, index) in filteredItems[currentIndex].ingredients"
                  :key="index"
                >
                  {{ ingredient }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="navigation">
          <button @click="prevCard" :disabled="currentIndex === 0">Previous</button>
          <button @click="nextCard" :disabled="currentIndex === filteredItems.length - 1">
            Next
          </button>
        </div>
      </div>
      <div v-else>
        <p class="loading-text">Loading flashcards...</p>
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
        menuItems: [],
        filteredItems: [],
        currentIndex: 0,
        isFlipped: false,
      };
    },
    async mounted() {
      try {
        const response = await fetchMenuItems();
        this.menuItems = response.data;
  
        const category = this.$route.query.category || null;
        this.filteredItems = category
          ? this.menuItems.filter(item => item.category === category)
          : this.menuItems;
      } catch (error) {
        console.error("Error fetching menu items:", error);
      }
    },
    methods: {
      flipCard() {
        this.isFlipped = !this.isFlipped;
      },
      nextCard() {
        if (this.currentIndex < this.filteredItems.length - 1) {
          this.currentIndex++;
          this.isFlipped = false;
        }
      },
      prevCard() {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          this.isFlipped = false;
        }
      },
      startQuiz() {
        const category = this.$route.query.category || null;
        this.$router.push({ path: "/quiz", query: { category } });
      },
    },
  };
  </script>
  

  
  <style scoped>
  .flashcards-container {
  width: 100%; 
  max-width: 1200px; 
  margin: 0 auto;
  text-align: center;
  font-family: Arial, sans-serif;
}
  
  .title {
    font-size: 2rem;
    color: #4caf50;
    margin-bottom: 20px;
  }
  
  .flashcard {
  width: 100%;
  height: 300px;
  perspective: 1000px; 
  margin-bottom: 20px;
  cursor: pointer;
  position: relative; 
}

.flashcard div {
  width: 100%;
  height: 100%;
  position: absolute;
  backface-visibility: hidden; 
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-size: 1.2rem;
  padding: 10px;
  box-sizing: border-box;
}

.flashcard .front {
  background-color: #ffffff;
  z-index: 2; 
  transform: rotateY(0deg); 
}

.flashcard .back {
  background-color: #f7f7f7;
  transform: rotateY(180deg); 
  overflow-y: auto; 
}

.flashcard.flipped .front {
  transform: rotateY(-180deg); 
}

.flashcard.flipped .back {
  transform: rotateY(0deg); 
}

.scrollable-content {
  width: 100%;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  text-align: left;
  overflow-y: auto; /* Ensures scrolling for long content!!!!!!!!! */
}

.ingredients-list {
  list-style-type: disc;
  margin: 10px 0;
  padding-left: 20px;
}

.ingredients-list li {
  font-size: 1rem;
  margin-bottom: 5px;
}

  .navigation button {
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 20px;
    margin: 10px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
  }
  
  .navigation button:hover {
    background-color: #45a049;
  }
  
  .navigation button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .loading-text {
    font-size: 1.5rem;
    color: #777;
  }
  </style>
  