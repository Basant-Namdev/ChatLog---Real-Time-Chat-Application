import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // other config...
  preview: {
    allowedHosts: [
      "chatlog-real-time-chat-application.onrender.com"
    ],
    host: true,
    port: process.env.PORT || 4173
  }
});

