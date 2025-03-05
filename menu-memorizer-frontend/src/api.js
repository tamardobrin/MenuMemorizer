import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000',
})

export const fetchMenuItems = () => api.get('/menu')
export const fetchQuiz = () => api.get('/quiz')
export const addMenuItem = (data) => api.post('/menu', data)
