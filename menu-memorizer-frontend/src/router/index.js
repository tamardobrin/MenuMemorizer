import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import QuizPage from "../pages/QuizPage.vue";
import Flashcards from "../pages/FlashCardsPage.vue";  
import CategorySelector from "../components/CategorySelector.vue";
import MenuOCR from "../components/MenuOCR.vue";

const routes = [
  { path: "/", component: CategorySelector },
  { path: "/quiz", component: QuizPage },
  { path: "/flashcards", component: Flashcards },
  { path: "/menuOCR", component: MenuOCR} 
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
