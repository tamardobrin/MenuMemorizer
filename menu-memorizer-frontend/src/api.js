import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000',
})

export const fetchMenuItems = () => api.get('/menu')
export const fetchQuiz = () => api.get('/quiz')
export const addMenuItem = (data) => api.post('/menu', data)
export const parseAI = (data) => api.post('/menu/parse-ai', data)
export const menuUpload = (data) => api.post('/menu/upload', data)
export const googleOCR = (base64Image) => api.post('/menu/ocr-google', { base64Image });
