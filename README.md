# CreatorDeck — Standalone YouTube Content Production Suite

All-in-one content production workstation featuring intelligent scriptwriting, studio-grade speech synthesis, broadcast audio mastering, search-grounded SEO metadata, and visual shot sheet direction.

---

## 🚀 Running Locally on Your Computer

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm** or **pnpm** / **yarn**

### Quick Start (3 Steps)

1. **Clone or unzip the repository:**
   ```bash
   cd creatordeck
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in your browser:**
   ```
   http://localhost:3000
   ```

---

## 🔑 Setting Your API Key

CreatorDeck uses a **Bring-Your-Own-Key (BYOK)** architecture:
- When you open the app, it prompts you to enter your **Google Gemini API Key**.
- You can get a free key anytime at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
- Your key is saved locally in your browser and used directly for generations.

### Optional: Set a Master Key on the Server
If you want to host it for personal use without entering the key in the browser:
1. Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```
2. Restart the server with `npm run dev`.

---

## 📦 Production Build & Deployment

### Build the Application:
```bash
npm run build
```
This builds both the optimized client frontend in `/dist` and bundles the backend server into `/dist/server.cjs`.

### Start Production Server:
```bash
npm start
```

### Deploy to Hosting Platforms:
- **Cloud Run / Railway / Render**: Set start command to `npm start` and build command to `npm run build`.
- **Docker**: Node.js alpine container with `npm run build` and `CMD ["npm", "start"]`.
