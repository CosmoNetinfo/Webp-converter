# Cosmo Converter (WebP & AVIF)

A high-performance image converter built with React, Vite, and Supabase.
Convert your images to modern web formats (WebP, AVIF) and seamlessly upload them to your localized cloud gallery.

## Features

- **Local Conversion**: Convert images to WebP and AVIF entirely in your browser.
- **Cloud Gallery**: Integrated with Supabase to host your images and provide public URLs.
- **Portable App**: Can be built as a standalone portable executable for Windows.
- **Cosmo Theme**: A beautiful, deep-space inspired dark interface.

## Setup & Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *Note: Without these, the Cloud Gallery feature will be disabled.*

3. **Run the development server:**
   ```bash
   npm run dev
   ```

## Build Portable App (Windows)

To create a standalone `.exe` file that you can carry on a USB drive:

1. **Run the builder:**
   ```bash
   npm run electron:build
   ```

2. **Locate the executable:**
   The portable app will be created in the `dist-electron` folder.

## Technologies

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Supabase (Database & Storage)
- Electron (for desktop version)
