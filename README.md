# Menu Memorizer

**Menu Memorizer** is a full-stack application designed to help users memorize menu items, their descriptions, and ingredients through flashcards and quizzes. The application includes a backend built with **Express.js** and **Prisma** (for PostgreSQL database interaction) and a frontend built with **Vue.js**.

---

## Features
- **Flashcards**: Users can view flashcards for menu items, flipping them to see descriptions and ingredients.
- **Quiz**: Users can take quizzes to test their knowledge of menu items, including single-select (description) and multi-select (ingredients) questions.
- **Category Filtering**: Users can filter menu items by category (e.g., main dishes, appetizers, desserts).
- **Admin Features**: Add new menu items, ingredients, and link ingredients to menu items via the backend API.

---

## Technologies Used
### Backend
- **Express.js**: Node.js framework for building the REST API.
- **Prisma**: ORM for interacting with the PostgreSQL database.
- **PostgreSQL**: Relational database for storing menu items, ingredients, and quiz progress.
- **CORS**: Middleware for enabling cross-origin requests.
- **Body-parser**: Middleware for parsing incoming request bodies.

### Frontend
- **Vue.js**: Progressive JavaScript framework for building the user interface.
- **Vue Router**: For handling client-side routing.
- **Axios**: For making HTTP requests to the backend API.

---

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (installed and running)
- npm (Node Package Manager)

---

