# Cosmo Converter (WebP & AVIF)

A high-performance, aesthetically pleasing image converter that transforms your images into modern web formats (WebP & AVIF). Built with React, Vite, TailwindCSS, and Electron.

## Features

*   **Modern UI**: "Cosmo Theme" with deep space gradients and glassmorphism.
*   **Dual Mode**: Works as a Web App (Vercel) and a Portable Desktop App (Windows).
*   **Format Support**: Convert images to WebP and AVIF.
*   **Cloud Gallery**: (Optional) Integrate with Supabase to save and host converted images.
*   **Privacy First**: Processing happens locally in your browser/app. Settings are stored locally.

## 🚀 Getting Started

### Web Version
Visit the deployed application (e.g., on Vercel). No installation required.

### Portable Desktop Version (Windows)
1.  Download the `Cosmo Converter 1.0.0.exe` file from the **Releases** section.
2.  Double-click to run. No installation needed.
    *   *Note: If Windows SmartScreen appears, click "More info" > "Run anyway".*

## ☁️ Cloud Configuration (Optional)
To enable the "Cloud Gallery" feature:
1.  Open the app and go to the **Settings** tab.
2.  Enter your **Supabase Project URL** and **Anon Key**.
    *   *These are saved locally on your device.*
3.  Click "Save Configuration".

## 🛠️ For Developers

### Installation
```bash
npm install
```

### Run Locally (Web)
```bash
npm run dev
```

### Build Portable App
To create the standalone `.exe` file:
```bash
npm run electron:build
```
The output file will be in the `dist-electron` folder.

### Deployment (Vercel)
The project is configured for Vercel. Ensure you add the environment variables in Vercel settings if you want a default cloud config, or let users provide their own via the UI.

## 📦 How to Release on GitHub
1.  Run `npm run electron:build` to generate the `.exe`.
2.  Go to GitHub > **Releases** > **Draft a new release**.
3.  Tag version: `v1.0.0`.
4.  Title: `Cosmo Converter v1.0.0 (Portable)`.
5.  Description: "First release of the Cosmo Converter portable app."
6.  **Attach binaries**: Drag and drop the `Cosmo Converter 1.0.0.exe` from your `dist-electron` folder.
7.  Publish release.
