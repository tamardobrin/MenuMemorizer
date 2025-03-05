<template>
  <div id="app">
    <header>
      <h1>Menu Memorizer</h1>
      <nav>
        <router-link :to="generateLink('/')">Home</router-link>
        <router-link :to="generateLink('/flashcards')">Flashcards</router-link>
        <router-link :to="generateLink('/quiz')">Quiz</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedCategory: null,
    };
  },
  provide() {
    return {
      selectedCategory: this.selectedCategory,
      setCategory: this.setCategory,
    };
  },
  methods: {
    setCategory(category) {
      this.selectedCategory = category;
    },
    generateLink(path) {
      return this.selectedCategory
        ? { path, query: { category: this.selectedCategory } }
        : { path };
    },
  },
};
</script>

<style scoped>
/* Basic layout */
#app {
  display: flex;
  flex-direction: column;
  align-items: center; /* Center all content horizontally */
  justify-content: flex-start; /* Adjust this for vertical centering */
  min-height: 100vh;
  font-family: Arial, sans-serif;
  text-align: center;
}

/* Header */
header {
  background-color: #4caf50;
  color: white;
  padding: 1rem;
  text-align: center;
  width: 100%;
}

nav {
  margin-top: 10px;
}

nav a {
  color: white;
  text-decoration: none;
  margin: 0 10px;
}

nav a:hover {
  text-decoration: underline;
}

/* Main Content */
main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center; /* Centers child components horizontally */
  justify-content: center; /* Centers child components vertically */
  width: 100%; /* Allow the main content to take the full width */
  max-width: 1200px; /* Constrain content to a reasonable maximum width */
  padding: 20px;
  box-sizing: border-box;
}
</style>

