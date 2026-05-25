# Vibe Player - Architecture & Workflow
 

This document explains the architecture, file communication, and workflow of the Vibe Player application. It describes how the HTML, CSS, and TypeScript modules interact to create a real-time, hardware-integrated local audio hub.

---

## 🗺️ Workflow and Connection Tree

The diagram below illustrates the relationship between the front-end layout structure, the styling engine, the core TypeScript logic, and the Web Audio digital signal processing (DSP) pipeline:

```mermaid
graph TD
    %% Define styles
    classDef html fill:#f06529,stroke:#333,stroke-width:2px,color:#fff;
    classDef css fill:#2965f1,stroke:#333,stroke-width:2px,color:#fff;
    classDef ts fill:#007acc,stroke:#333,stroke-width:2px,color:#fff;
    classDef browser fill:#34a853,stroke:#333,stroke-width:2px,color:#fff;
    
    %% Nodes
    Index[index.html <br/> DOM Layout & CDNs]:::html
    Style[src/style.css <br/> Glassmorphic Styles & Keyframes]:::css
    Main[src/main.ts <br/> Playback & Audio Engine]:::ts
    
    FolderInput[Folder Picker / Drag-and-Drop Zone]:::html
    AudioTag[HTML5 Audio Element]:::html
    Canvas[HTML5 Canvas]:::html
    
    AudioGraph[Web Audio API DSP Graph <br/> AudioSource ➔ 5x Biquad Filters ➔ Analyser ➔ Output]:::ts
    RenderLoop[60FPS Visualizer Loop]:::ts
    MetaParser[ID3 Metadata Parser <br/> jsmediatags CDN]:::ts
    
    OSMedia[OS Media Drawer <br/> Media Session API]:::browser
    
    %% Relationships
    Index -->|Loads| Style
    Index -->|Loads Module| Main
    
    FolderInput -->|Provides File Handles| Main
    Main -->|Parses Metadata via| MetaParser
    MetaParser -->|Returns title, artist, cover Blob| Main
    Main -->|Updates DOM nodes with tags| Index
    
    Main -->|Generates local Blobs & controls| AudioTag
    AudioTag -->|Pipes raw audio stream| AudioGraph
    
    AudioGraph -->|Extracts frequency/waveform data| RenderLoop
    RenderLoop -->|Draws active frame| Canvas
    
    Style -->|Applies frosted-glass / colors| Index
    Main -->|Dynamically adjusts progress fills| Style
    
    Main -->|Registers metadata & controls| OSMedia
    OSMedia -->|Sends keyboard keys Play/Pause/Skip| Main
```

---

## 🔗 File Communications

### 1. HTML (`index.html`) — *The Skeleton and Entry Point*
*   **Structure**: It defines the 3-panel layout (Sidebar, Center Player, Right Dashboard) and interactive DOM controls (buttons, custom range sliders, canvas, and file inputs).
*   **Bridge to TS**: Loads `src/main.ts` as an ES module (`type="module"`). Vite reads this entry point and bundles all imported resources automatically.
*   **Bridge to CSS**: Imports the style module using Vite assets resolving mechanism, applying the core visual layouts.
*   **External Assets**: Links the Outfit/Inter Google fonts and the `jsmediatags` library via CDN.

### 2. CSS (`src/style.css`) — *The Aesthetic and Layout System*
*   **Theme & Glassmorphism**: Defines custom CSS variables (`--color-primary`, `--shadow-glass`, etc.), frosted-glass layers using `backdrop-filter: blur()`, and animated backgrounds.
*   **Responsive Grid**: Manages transitions for screen layouts. On mobile screens, it hides the Sidebar and Dashboard and shifts them off-canvas.
*   **Bridge to TS**: TS queries the layout classes to show/hide menus (e.g. `.show` class on sidebar). TS also writes inline styles directly to CSS variables to update the track progress bar fill (`--seek-progress-fill`) and volume tracks.

### 3. TypeScript (`src/main.ts`) — *The Brain and Engine*
*   **Event Handling**: Targets the DOM elements defined in HTML (`document.getElementById`) and attaches listeners for folder loading, playback clicks, search filtering, and slider drags.
*   **Audio DSP Pipeline**: Sets up the Web Audio API connection. It routes the browser `<audio>` node stream through a chain of five physical filter nodes (`BiquadFilterNode`) acting as the 5-band Equalizer, then pipes it to an `AnalyserNode` which captures raw frequency data.
*   **Canvas Painting**: Obtains a 2D context of the HTML5 `<canvas>` and runs a 60fps `requestAnimationFrame` loop. It samples the audio analyser's spectrum data and calculates pixels to draw bars, waves, or circular ripples.
*   **Data Integration**: Acts as the orchestrator: 
    *   Reads the local files -> outputs standard object URLs -> passes them to the HTML audio tag.
    *   Funnels parsed metadata from `jsmediatags` back to the HTML display.
    *   Sends metadata and listens for key actions from the browser's OS Media session.
