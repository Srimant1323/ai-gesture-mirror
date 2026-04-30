# 🔥 AI Gesture Mirror

Real-time AI hand gesture recognition web app that creates 
magical visual effects using your webcam.

## 🌐 Live Demo
👉 https://brahmastra-303193.netlify.app/

## ✨ Features
- 🔥 Fire, ⚡ Plasma, ✨ Gold aura around your hands
- 🫰 Snap fingers → Hearts appear
- 🫶 Both hands heart shape → Flower blooms
- ✋ Open palm → Stars burst
- ✌️ Peace sign → Butterflies fly
- Real-time hand skeleton tracking (21 landmarks per hand)
- Works entirely in the browser — no install, no backend

## 🛠️ Tech Stack
- MediaPipe Hands (Google AI) — hand landmark detection
- HTML5 Canvas — particle animation engine
- Vanilla JavaScript — gesture classification logic
- CSS animations — visual effects overlay
- Netlify — deployment

## 🚀 How to Run Locally
Just open index.html in any modern browser.
No npm install. No server. No dependencies to download.

## 🧠 How It Works
1. MediaPipe detects 21 hand landmarks per hand in real time
2. Gesture classifier checks finger positions (extended vs curled)
3. Matched gesture triggers particle effects on HTML5 Canvas
4. Aura engine spawns 2000 particles per frame around fingertips
