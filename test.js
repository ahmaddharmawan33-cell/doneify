const API_KEY = process.env.VITE_GEMINI_API_KEY || 'AIzaSyDh1EArAhNbuiIuO6righLpww1SB_69aJU';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const body = {
  contents: [
    {
      role: "user",
      parts: [{ text: "Halo" }]
    }
  ],
  systemInstruction: {
    parts: [{ text: "You are Vox." }]
  },
  generationConfig: {
    temperature: 0.9,
    maxOutputTokens: 1000
  }
};

fetch(`${BASE_URL}/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
}).then(async res => {
  console.log(res.status, await res.text());
}).catch(console.error);
