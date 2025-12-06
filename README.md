# Cosmo Converter (WebP & AVIF)

Un convertitore di immagini ad alte prestazioni ed esteticamente curato che trasforma le tue immagini nei moderni formati web (WebP & AVIF). Realizzato con React, Vite, TailwindCSS ed Electron.

## Caratteristiche

*   **Interfaccia Moderna**: "Cosmo Theme" con gradienti dello spazio profondo ed effetti glassmorphism.
*   **Doppia Modalità**: Funziona come Web App (Vercel) e come App Desktop Portatile (Windows).
*   **Supporto Formati**: Converti immagini in WebP e AVIF.
*   **Galleria Cloud**: (Opzionale) Integrazione con Supabase per salvare e ospitare le immagini convertite.
*   **Privacy First**: L'elaborazione avviene localmente nel tuo browser/app. Le impostazioni sono salvate localmente.

## 🚀 Come Iniziare

### Versione Web
Visita l'applicazione distribuita (es. su Vercel). Nessuna installazione richiesta.

### Versione Desktop Portatile (Windows)
1.  Scarica il file `Cosmo Converter 1.0.0.exe` dalla sezione **Releases** su GitHub.
2.  Fai doppio clic per avviare. Nessuna installazione necessaria.
    *   *Nota: Se appare Windows SmartScreen, clicca su "Ulteriori informazioni" > "Esegui comunque".*

## ☁️ Configurazione Cloud (Opzionale)
Per abilitare la funzionalità "Galleria Cloud":
1.  Apri l'app e vai alla scheda **Settings** (Impostazioni).
2.  Inserisci il tuo **Project URL** e la **Anon Key** di Supabase.
    *   *Questi dati vengono salvati localmente sul tuo dispositivo.*
3.  Clicca su "Save Configuration".
    *   *Vedi la [Guida Completa alla Configurazione](GUIDA_CONFIGURAZIONE.md) per istruzioni passo-passo.*

## 🛠️ Per Sviluppatori

### Installazione
```bash
npm install
```

### Esecuzione Locale (Web)
```bash
npm run dev
```

### Compilazione App Portatile
Per creare il file `.exe` autonomo:
```bash
npm run electron:build
```
Il file generato si troverà nella cartella `dist-electron`.

### Deploy (Vercel)
Il progetto è configurato per Vercel. Assicurati di aggiungere le variabili d'ambiente nelle impostazioni di Vercel se desideri una configurazione cloud predefinita, oppure lascia che siano gli utenti a fornirle tramite l'interfaccia.

## 📦 Come Pubblicare su GitHub
1.  Esegui `npm run electron:build` per generare il file `.exe`.
2.  Vai su GitHub > **Releases** > **Draft a new release**.
3.  Tag version: `v1.0.0`.
4.  Titolo: `Cosmo Converter v1.0.0 (Portable)`.
5.  Descrizione: "Prima release dell'app portatile Cosmo Converter."
6.  **Allega binari**: Trascina e rilascia il file `Cosmo Converter 1.0.0.exe` dalla tua cartella `dist-electron`.
7.  Pubblica la release.
