<template>
  <div>
    <h1>Menu</h1>
    <ul>
      <li v-for="item in menuItems" :key="item.id">
        <h2>{{ item.name }}</h2>
        <p>{{ item.description }}</p>
        <p><strong>Category:</strong> {{ item.category }}</p>
        <p><strong>Price:</strong> ${{ item.price }}</p>
      </li>
    </ul>
  </div>
</template>

<script>
import { fetchMenuItems } from '../api'

export default {
  data() {
    return {
      menuItems: [],
    }
  },
  async mounted() {
    try {
      const response = await fetchMenuItems()
      this.menuItems = response.data
    } catch (error) {
      console.error('Error fetching menu items:', error)
    }
  },
}
</script>

<style scoped>
h1 {
  text-align: center;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ddd;
}
</style>
