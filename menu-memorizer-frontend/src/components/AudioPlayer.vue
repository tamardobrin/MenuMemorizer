<template>
    <div>
      <button @click="playText" class="audio-btn">
        🔊 Play
      </button>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      text: {
        type: String,
        required: true,
      },
    },
    methods: {
      playText() {
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(this.text);
          utterance.lang = "he"; 
          window.speechSynthesis.speak(utterance);
        } else {
          alert("Your browser does not support text-to-speech.");
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .audio-btn {
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 15px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-top: 10px;
  }
  
  .audio-btn:hover {
    background-color: #45a049;
  }
  </style>
  