# 🌐 Global OCR Vision Pro  
**Privacy-First • Browser-Native • WebAssembly-Powered OCR**

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Tesseract.js-v5-4CAF50" />
  <img src="https://img.shields.io/badge/WebAssembly-Enabled-654FF0?logo=webassembly&logoColor=white" />
  <img src="https://img.shields.io/badge/Privacy-100%25%20Client--Side-success" />
  <img src="https://img.shields.io/badge/License-MIT-blue" />
  <img src="https://img.shields.io/badge/PWA-Ready-orange" />
</p>

<p align="center">
  <b>A production-grade, browser-only OCR engine built for accuracy, privacy, and extensibility.</b>
</p>

---

## 🚀 Overview

**Global OCR Vision Pro** is a next-generation **client-side Optical Character Recognition (OCR)** platform that runs entirely in the browser using **WebAssembly (Wasm)** and **Web Workers** via **Tesseract.js**.

📌 **No server uploads. No tracking. No compromise on privacy.**

It is designed for:
- Students & researchers  
- Privacy-sensitive document processing  
- Hackathons & academic projects  
- Enterprise-grade frontend OCR solutions  

---

## ✨ Key Features

- 🔐 **100% Client-Side OCR** – Zero backend dependency  
- ⚡ **Wasm + Web Workers** – High-performance parallel OCR  
- 🖼️ **Advanced Image Preprocessing** – Canvas-level pixel control  
- 🧠 **Confidence Heatmaps** – Word-level OCR confidence visualization  
- 📤 **Multi-Format Export** – TXT, JSON, Markdown  
- 🔊 **Text-to-Speech (TTS)** – Native browser speech synthesis  
- 🌗 **Dark / Light Mode** – System-aware theming  
- 🗂️ **Persistent History** – LocalStorage-based OCR archive  
- 🧩 **Highly Modular Architecture** – Easy to extend & maintain  

---

## 🧱 Tech Stack

| Layer | Technology |
|-----|-----------|
| UI Framework | **React 19** |
| Styling | **Tailwind CSS v3.4 (CDN)** |
| OCR Engine | **Tesseract.js v5** |
| Runtime | **WebAssembly (Wasm)** |
| Multithreading | **Web Workers** |
| Icons | **Lucide React** |
| Storage | **Browser localStorage** |
| Module System | **ES Modules (Import Maps)** |

---

## 🏗️ Architecture Overview

User
└─▶ React UI (SPA)
└─▶ Services Layer
├─ imageService (Canvas Processing)
└─ tesseractService (OCR Worker)
└─▶ WebAssembly OCR Engine

yaml
Copy code

✔ Top-down data flow  
✔ Stateless services  
✔ Strict TypeScript models  

---

## 📁 Project Structure

/
├── index.html # Entry point, Import Maps, CSP
├── index.tsx # React DOM bootstrap
├── App.tsx # Global state & layout shell
├── types.ts # Strong OCR data models
├── metadata.json # App / PWA metadata
│
├── services/
│ ├── tesseractService.ts
│ ├── imageService.ts
│ └── geminiService.ts (deprecated)
│
└── components/
├── OCRApp.tsx
├── ResultsView.tsx
└── History.tsx

yaml
Copy code

---

## 🔁 OCR Data Flow

1. 📂 User uploads an image  
2. 🎨 Canvas preprocessing (resize, grayscale, contrast)  
3. ⚙️ Tesseract Web Worker spins up  
4. 📊 Live OCR progress tracking  
5. 🧠 OCR output normalized into strict models  
6. 🔍 Heatmap + extracted text rendered  
7. 💾 Result persisted in localStorage  

---

## 🧠 Core Components

### `App.tsx` – Root Controller
- Theme persistence  
- Settings & history storage  
- Layout orchestration  

### `OCRApp.tsx` – OCR Engine Room
- File validation  
- Image preprocessing  
- OCR execution lifecycle  

### `ResultsView.tsx` – Visualization Layer
- Word-level confidence heatmaps  
- Export utilities  
- Text-to-Speech  

### `History.tsx` – Scan Archive
- Responsive grid  
- LocalStorage backed previews  
- Read-only optimized rendering  

---

## 🧪 Image Processing Pipeline

- Resize image → **max 1500px**
- Convert to grayscale using luminance formula:
Y = 0.2126R + 0.7152G + 0.0722B

yaml
Copy code
- Apply contrast factor transformation
- Output:
- Original preview
- Processed preview  

---

## 📦 Data Models

### `OCRResult`
```ts
interface OCRResult {
fullText: string;
confidence: number;
language: string;
words: OCRWord[];
lines: OCRLine[];
blocks: OCRBlock[];
previewUrl: string;
id: string;
timestamp: number;
fileName: string;
}
OCRSettings
ts
Copy code
interface OCRSettings {
  language: string;
  psm: PSM;
  preprocessing: {
    grayscale: boolean;
    contrast: number;
    threshold: number;
  };
}
🗝️ Local Storage Keys
Key	Description
ocr_settings	User preferences & OCR configuration
ocr_history	Last 20 OCR results (includes Base64 images)

⚠️ Heavy usage may approach browser storage limits.

🌍 Browser Support
✔ Chrome
✔ Firefox
✔ Safari
✔ Edge

Requirements

ES Modules

Web Workers

WebAssembly

📡 Offline & PWA Readiness
PWA-ready architecture

Currently CDN-dependent

Full offline OCR possible by caching:

Tesseract workers

.traineddata language files via Service Worker

🔮 Roadmap
📷 Webcam OCR capture

📄 Multi-page PDF OCR

🌐 Auto language detection

🧠 AI semantic post-analysis

📦 IndexedDB migration

🔐 Encrypted local storage

🏆 Why Global OCR Vision Pro?
✅ Privacy-first by design
✅ Enterprise-grade OCR pipeline
✅ Clean & explainable architecture
✅ Hackathon & portfolio ready
✅ Future-proof extensibility

📜 License
MIT License
Free to use, modify, and distribute.