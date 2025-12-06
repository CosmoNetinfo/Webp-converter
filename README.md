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



