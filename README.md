# Vibe Player - Glassmorphic Local Music Hub

A sleek, premium, and feature-rich local music player web application built using **HTML5**, **Vanilla CSS (Glassmorphism)**, and **TypeScript** powered by **Vite**.

Vibe Player runs **100% client-side** in your browser. All selected folders and files are read locally as Blobs/File objects. Your music is never uploaded to any server, offering absolute privacy, zero bandwidth usage, and instant playback load times.

---

## 🌟 Key Features

*   **Glassmorphic Design System**: Sleek frosted glass panels, rotating ambient background glows that sync with active track colors, smooth micro-animations, and fluid responsive layouts (desktop & mobile).
*   **Recursive Folder Traversal**: Select a folder from your device, or drag and drop files/folders directly into the player to load entire music collections recursively.
*   **Offline ID3 Tag Parser**: Uses `jsmediatags` (loaded via CDN) to extract title, artist, album, year, genre, and embedded cover art directly in the browser. Automatically generates unique CSS gradient covers if tags are missing.
*   **5-Band Studio Equalizer**: Route audio through a Web Audio node chain with peaking/shelving Biquad filters (`60Hz`, `230Hz`, `910Hz`, `4kHz`, `14kHz`). Includes presets (*Bass Boost*, *Vocal*, *Electronic*, *Acoustic*, *Treble*) with smooth linear gain transitions.
*   **Real-time Canvas Visualizers**: Dynamic high-DPI rendered visualizer canvas featuring multiple styles:
    *   *Neon Frequency Bars*: Vertical equalizer frequency bars with glowing neon dropshadows.
    *   *Circular Orbit*: A radial spectrum circular wave surrounding the album art.
    *   *Waveform Ribbon*: Smooth bezier wave representing time-domain audio data.
    *   *Color Palettes*: Toggle between *Neon Violet*, *Electric Cyan*, *Sunset Fire*, or *Chromatic Rainbow*.
*   **System Integration (Media Session API)**: Seamless sync with OS notification widgets, allowing control of play, pause, track skip, and timeline seeking via hardware media keys or lock screens.

---

## 📂 Project Structure

```text
├── index.html          # Core HTML structure, links CDNs (Fonts, jsmediatags)
├── package.json        # Project metadata, Vite devDependencies, & scripts
├── tsconfig.json       # TypeScript compiler settings
├── vite.config.ts      # Vite bundler configurations (if applicable)
├── public/             # Static public assets (Vite logo, icons)
└── src/
    ├── main.ts         # TypeScript application controller (Audio graph, Canvas loop, events)
    ├── style.css       # Layout grids, customized inputs, glass effect, & keyframe animations
    └── vite-env.d.ts   # Vite environment types declaration
```

### Key Files Overview
*   **[index.html](file:///c:/Users/samee/OneDrive/Desktop/Coding%20Related%21%21/Guess/Vibe_Coding/index.html)**: Sets up the three-panel layout (Sidebar playlist, Center main player, Right audio dashboard). Defines the hidden inputs for directories and files, and loads standard CDNs.
*   **[src/style.css](file:///c:/Users/samee/OneDrive/Desktop/Coding%20Related%21%21/Guess/Vibe_Coding/src/style.css)**: Implements custom CSS variables, floating blur background blobs, styled vertical range inputs for the EQ sliders, seek fills, custom scrollbars, and off-screen sliding menus for tablet/mobile viewports.
*   **[src/main.ts](file:///c:/Users/samee/OneDrive/Desktop/Coding%20Related%21%21/Guess/Vibe_Coding/src/main.ts)**: Contains the main application code. Organizes track arrays, handles shuffle queues, connects the Web Audio API graph (`AudioContext` -> `BiquadFilterNode` chain -> `AnalyserNode` -> destination), updates the Canvas rendering loops at 60fps, and registers Media Session hooks.

---

## 🚀 How to Run

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Install Dependencies
Navigate to the project root directory in your terminal and install Vite and TypeScript:
```bash
npm install
```

### 2. Start the Development Server
Run Vite's fast development server locally:
```bash
npm run dev
```
Once started, open the local URL in your browser:
👉 **[http://localhost:5173/](http://localhost:5173/)**

### 3. Build for Production
To package the app into optimized, static production files:
```bash
npm run build
```
The compiled build will be generated in the `dist/` directory, ready to be hosted on any static hosting provider (e.g., Vercel, Netlify, GitHub Pages) or run locally.

### 4. Preview Production Build
To preview the compiled production build locally:
```bash
npm run preview
```

---

## 🎧 Usage Instructions

1.  Open the webapp and click the **Load Folder** button (or drag and drop your music folder onto the screen).
2.  Once loaded, your tracks will appear in the scrollable sidebar. Use the **Search bar** to filter tracks by title, artist, or album.
3.  Click on any song to play it.
4.  Expand the right panel (on smaller screens) or use the dashboard to:
    *   Change the **Visualizer type** and **Color theme**.
    *   Switch between **Equalizer presets** or slide individual frequencies manually.
    *   Review the file details (sample rate, size, metadata tags) in the **Track Metadata inspector**.
5.  Use your keyboard media keys to play, pause, or skip tracks even if the browser window is in the background.
