// Vibe Player - Core Application Logic
import "./style.css";

// Declare global jsmediatags (loaded via CDN script)
declare const jsmediatags: any;

// Track Interface
interface Track {
  id: string;
  file: File;
  url: string;
  name: string;
  title: string;
  artist: string;
  album: string;
  year: string;
  genre: string;
  duration?: number;
  durationStr?: string;
  coverUrl?: string;
  customGradient: string;
}

// Application State
let playlist: Track[] = [];
let filteredPlaylist: Track[] = [];
let currentIndex: number = -1;
let isPlaying: boolean = false;
let volume: number = 0.7;
let isMuted: boolean = false;
let shuffleMode: boolean = false;
let shuffleQueue: number[] = [];
let repeatMode: "off" | "all" | "one" = "off";
let searchQuery: string = "";

// Web Audio API Nodes
let audioCtx: AudioContext | null = null;
let audioSource: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
let eqFilters: BiquadFilterNode[] = [];

// Audio Element
const audioElement = new Audio();
audioElement.preload = "auto";

// DOM Element Selectors
const folderInput = document.getElementById("folder-input") as HTMLInputElement;
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const btnLoadFolder = document.getElementById(
  "btn-load-folder",
) as HTMLButtonElement;
const btnLoadFiles = document.getElementById(
  "btn-load-files",
) as HTMLButtonElement;
const searchTracks = document.getElementById(
  "search-tracks",
) as HTMLInputElement;
const btnClearSearch = document.getElementById(
  "btn-clear-search",
) as HTMLButtonElement;
const trackList = document.getElementById("track-list") as HTMLUListElement;
const playlistEmpty = document.getElementById(
  "playlist-empty",
) as HTMLDivElement;
const playlistCount = document.getElementById(
  "playlist-count",
) as HTMLSpanElement;
const btnClearPlaylist = document.getElementById(
  "btn-clear-playlist",
) as HTMLButtonElement;

// Center panel (Player) elements
const playerCoverBg = document.getElementById(
  "player-cover-bg",
) as HTMLDivElement;
const coverImage = document.getElementById("cover-image") as HTMLImageElement;
const coverPlaceholder = document.getElementById(
  "cover-placeholder",
) as HTMLDivElement;
const trackTitle = document.getElementById("track-title") as HTMLHeadingElement;
const trackArtist = document.getElementById(
  "track-artist",
) as HTMLParagraphElement;
const trackAlbum = document.getElementById(
  "track-album",
) as HTMLParagraphElement;
const audioSpec = document.getElementById("audio-spec") as HTMLDivElement;

// Playback controls
const seekBar = document.getElementById("seek-bar") as HTMLInputElement;
const seekProgressFill = document.getElementById(
  "seek-progress-fill",
) as HTMLDivElement;
const timeElapsed = document.getElementById("time-elapsed") as HTMLSpanElement;
const timeTotal = document.getElementById("time-total") as HTMLSpanElement;

const btnShuffle = document.getElementById("btn-shuffle") as HTMLButtonElement;
const btnPrev = document.getElementById("btn-prev") as HTMLButtonElement;
const btnPlayPause = document.getElementById(
  "btn-play-pause",
) as HTMLButtonElement;
const playIcon = document.getElementById("play-icon") as any;
const pauseIcon = document.getElementById("pause-icon") as any;
const btnNext = document.getElementById("btn-next") as HTMLButtonElement;
const btnRepeat = document.getElementById("btn-repeat") as HTMLButtonElement;
const repeatBadge = document.getElementById("repeat-badge") as HTMLSpanElement;

// Volume controls
const btnVolume = document.getElementById("btn-volume") as HTMLButtonElement;
const iconVolumeHigh = document.getElementById("icon-volume-high") as any;
const iconVolumeMute = document.getElementById("icon-volume-mute") as any;
const volumeSlider = document.getElementById(
  "volume-slider",
) as HTMLInputElement;
const volumeProgressFill = document.getElementById(
  "volume-progress-fill",
) as HTMLDivElement;

// Equalizer & Visualizer Controls
const eqPresetSelect = document.getElementById(
  "eq-preset",
) as HTMLSelectElement;
const eqSliders = [
  document.getElementById("eq-band-1") as HTMLInputElement,
  document.getElementById("eq-band-2") as HTMLInputElement,
  document.getElementById("eq-band-3") as HTMLInputElement,
  document.getElementById("eq-band-4") as HTMLInputElement,
  document.getElementById("eq-band-5") as HTMLInputElement,
];
const eqVals = [
  document.getElementById("eq-val-1") as HTMLSpanElement,
  document.getElementById("eq-val-2") as HTMLSpanElement,
  document.getElementById("eq-val-3") as HTMLSpanElement,
  document.getElementById("eq-val-4") as HTMLSpanElement,
  document.getElementById("eq-val-5") as HTMLSpanElement,
];

const visStyleSelect = document.getElementById(
  "vis-style",
) as HTMLSelectElement;
const visThemeSelect = document.getElementById(
  "vis-theme",
) as HTMLSelectElement;
const visualizerCanvas = document.getElementById(
  "visualizer-canvas",
) as HTMLCanvasElement;
const ctxCanvas = visualizerCanvas.getContext("2d") as CanvasRenderingContext2D;

// Metadata Inspector
const metaFilename = document.getElementById(
  "meta-filename",
) as HTMLSpanElement;
const metaTitle = document.getElementById("meta-title") as HTMLSpanElement;
const metaArtist = document.getElementById("meta-artist") as HTMLSpanElement;
const metaAlbum = document.getElementById("meta-album") as HTMLSpanElement;
const metaYear = document.getElementById("meta-year") as HTMLSpanElement;
const metaGenre = document.getElementById("meta-genre") as HTMLSpanElement;
const metaSize = document.getElementById("meta-size") as HTMLSpanElement;

// Mobile Panels Toggles
const btnToggleSidebar = document.getElementById(
  "btn-toggle-sidebar",
) as HTMLButtonElement;
const btnToggleRightPanel = document.getElementById(
  "btn-toggle-right-panel",
) as HTMLButtonElement;
const panelSidebar = document.getElementById("panel-sidebar") as HTMLElement;
const panelControls = document.getElementById("panel-controls") as HTMLElement;
const dropOverlay = document.getElementById("drop-overlay") as HTMLDivElement;
const btnThemeToggle = document.getElementById(
  "btn-theme-toggle",
) as HTMLButtonElement | null;
const iconThemeLight = document.getElementById(
  "icon-theme-light",
) as SVGElement | null;
const iconThemeDark = document.getElementById(
  "icon-theme-dark",
) as SVGElement | null;

// Equalizer Preset Configurations
const EQ_PRESETS: { [key: string]: number[] } = {
  flat: [0, 0, 0, 0, 0],
  bass: [6, 4.5, 0, -1.5, -3],
  vocal: [-3, -1.5, 2.5, 4, 1.5],
  electronic: [5, 2.5, -1, 2, 4],
  acoustic: [2, 1, 1, 2.5, 2],
  treble: [-4.5, -2, 0, 4, 6],
};

// ----------------------------------------------------
// INITIALIZATION & EVENT BINDINGS
// ----------------------------------------------------

function initEvents() {
  // Folder & File selection inputs
  btnLoadFolder.addEventListener("click", () => folderInput.click());
  btnLoadFiles.addEventListener("click", () => fileInput.click());

  folderInput.addEventListener("change", (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) handleFiles(files);
  });
  fileInput.addEventListener("change", (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) handleFiles(files);
  });

  // Drag and Drop
  window.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropOverlay.classList.add("active");
  });

  window.addEventListener("dragleave", (e) => {
    e.preventDefault();
    const rect = dropOverlay.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      dropOverlay.classList.remove("active");
    }
  });

  window.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropOverlay.classList.remove("active");

    if (!e.dataTransfer) return;

    const filesArray: File[] = [];
    const items = e.dataTransfer.items;

    if (items) {
      const promises: Promise<void>[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
          promises.push(traverseFileTree(item, filesArray));
        }
      }
      await Promise.all(promises);
    } else {
      const dtFiles = e.dataTransfer.files;
      for (let i = 0; i < dtFiles.length; i++) {
        filesArray.push(dtFiles[i]);
      }
    }

    if (filesArray.length > 0) {
      handleFiles(filesArray);
    }
  });

  // Search filtering
  searchTracks.addEventListener("input", (e) => {
    searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
    if (searchQuery) {
      btnClearSearch.classList.remove("hidden");
    } else {
      btnClearSearch.classList.add("hidden");
    }
    filterPlaylist();
  });

  btnClearSearch.addEventListener("click", () => {
    searchTracks.value = "";
    searchQuery = "";
    btnClearSearch.classList.add("hidden");
    filterPlaylist();
  });

  btnClearPlaylist.addEventListener("click", clearPlaylist);

  // Playback Control Buttons
  btnPlayPause.addEventListener("click", () => {
    initAudioContext();
    togglePlay();
  });

  btnPrev.addEventListener("click", () => {
    initAudioContext();
    prevTrack();
  });

  btnNext.addEventListener("click", () => {
    initAudioContext();
    nextTrack();
  });

  btnShuffle.addEventListener("click", toggleShuffle);
  btnRepeat.addEventListener("click", toggleRepeat);

  // Seek bar events
  seekBar.addEventListener("input", (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    if (audioElement.duration) {
      const targetTime = (value / 100) * audioElement.duration;
      timeElapsed.textContent = formatTime(targetTime);
      updateSeekProgressFill(value);
    }
  });

  seekBar.addEventListener("change", (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    if (audioElement.duration) {
      audioElement.currentTime = (value / 100) * audioElement.duration;
    }
  });

  // Volume slider events
  btnVolume.addEventListener("click", toggleMute);
  volumeSlider.addEventListener("input", (e) => {
    volume = parseFloat((e.target as HTMLInputElement).value);
    isMuted = volume === 0;
    updateVolumeUI();
    if (!isMuted) {
      audioElement.volume = volume;
    }
  });

  // Audio elements playback callbacks
  audioElement.addEventListener("timeupdate", () => {
    if (!audioElement.duration || isNaN(audioElement.duration)) return;
    const progress = (audioElement.currentTime / audioElement.duration) * 100;
    seekBar.value = progress.toString();
    updateSeekProgressFill(progress);
    timeElapsed.textContent = formatTime(audioElement.currentTime);
  });

  audioElement.addEventListener("durationchange", () => {
    if (audioElement.duration && !isNaN(audioElement.duration)) {
      seekBar.disabled = false;
      timeTotal.textContent = formatTime(audioElement.duration);

      // Update duration in track model if not present
      if (currentIndex !== -1 && !playlist[currentIndex].duration) {
        playlist[currentIndex].duration = audioElement.duration;
        playlist[currentIndex].durationStr = formatTime(audioElement.duration);

        // Find inside list and update display
        const activeItem = document.querySelector(
          `.track-item[data-id="${playlist[currentIndex].id}"]`,
        );
        if (activeItem) {
          const durationVal = activeItem.querySelector(".track-item-duration");
          if (durationVal)
            durationVal.textContent = playlist[currentIndex].durationStr || "";
        }
      }
    }
  });

  audioElement.addEventListener("ended", () => {
    if (repeatMode === "one") {
      audioElement.currentTime = 0;
      audioElement.play().catch((err) => console.warn(err));
    } else {
      nextTrack(true); // pass true to indicate it ended naturally
    }
  });

  // Equalizer events
  eqPresetSelect.addEventListener("change", (e) => {
    const presetName = (e.target as HTMLSelectElement).value;
    applyEQPreset(presetName);
  });

  eqSliders.forEach((slider, index) => {
    slider.addEventListener("input", (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      eqVals[index].textContent = `${val > 0 ? "+" : ""}${val}dB`;

      // Update Biquad filter value
      if (eqFilters[index]) {
        eqFilters[index].gain.setTargetAtTime(val, audioCtx!.currentTime, 0.05);
      }

      // Set preset selector to custom since it doesn't match any preset exactly
      eqPresetSelect.value = "custom";
    });
  });

  // Visualizer resizing
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Mobile panels toggle
  btnToggleSidebar.addEventListener("click", () => {
    panelSidebar.classList.toggle("show");
    panelControls.classList.remove("show");
  });

  btnToggleRightPanel.addEventListener("click", () => {
    panelControls.classList.toggle("show");
    panelSidebar.classList.remove("show");
  });

  // Close panels on clicking main player panel
  document.getElementById("panel-player")?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    // Don't close if clicking toggles
    if (target.closest(".mobile-toggle")) return;
    panelSidebar.classList.remove("show");
    panelControls.classList.remove("show");
  });

  // Theme toggle binding
  if (btnThemeToggle) btnThemeToggle.addEventListener("click", toggleTheme);
  // Apply saved theme on init
  applySavedTheme();

  // Setup media session key listeners
  setupMediaSessionHandlers();
}

// ----------------------------------------------------
// DIRECTORY / FILE TRAVERSAL & READING
// ----------------------------------------------------

async function traverseFileTree(item: any, fileList: File[]): Promise<void> {
  return new Promise((resolve) => {
    if (item.isFile) {
      item.file((file: File) => {
        fileList.push(file);
        resolve();
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const readEntries = () => {
        dirReader.readEntries(
          async (entries: any[]) => {
            if (entries.length === 0) {
              resolve();
            } else {
              const entryPromises = entries.map((entry) =>
                traverseFileTree(entry, fileList),
              );
              await Promise.all(entryPromises);
              readEntries(); // read recursively just in case there are more chunks
            }
          },
          () => resolve(),
        );
      };
      readEntries();
    } else {
      resolve();
    }
  });
}

function getHashGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 45%), hsl(${h2}, 80%, 25%))`;
}

function handleFiles(files: FileList | File[]) {
  // Clear existing blob URLs
  playlist.forEach((t) => {
    if (t.url) URL.revokeObjectURL(t.url);
    if (t.coverUrl) URL.revokeObjectURL(t.coverUrl);
  });

  const audioFiles = Array.from(files).filter((file) => {
    return (
      file.type.startsWith("audio/") ||
      /\.(mp3|wav|ogg|m4a|flac|aac|wma)$/i.test(file.name)
    );
  });

  if (audioFiles.length === 0) {
    alert("No supported audio files found.");
    return;
  }

  // Sort alphabetically
  audioFiles.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  playlist = audioFiles.map((file, idx) => {
    const title =
      file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    return {
      id: `track-${idx}-${Date.now()}`,
      file: file,
      url: URL.createObjectURL(file),
      name: file.name,
      title: title,
      artist: "Unknown Artist",
      album: "Unknown Album",
      year: "Unknown",
      genre: "Unknown",
      customGradient: getHashGradient(title),
    };
  });

  filteredPlaylist = [...playlist];
  currentIndex = -1;
  shuffleQueue = [];

  renderPlaylist();
  updatePlaylistSummary();
  resetPlayerUI();

  // Asynchronously read ID3 metadata
  parseAllMetadata();
}

function clearPlaylist() {
  audioElement.pause();
  isPlaying = false;

  playlist.forEach((t) => {
    if (t.url) URL.revokeObjectURL(t.url);
    if (t.coverUrl) URL.revokeObjectURL(t.coverUrl);
  });

  playlist = [];
  filteredPlaylist = [];
  currentIndex = -1;
  shuffleQueue = [];

  renderPlaylist();
  updatePlaylistSummary();
  resetPlayerUI();

  // Set play button state
  updatePlayPauseUI();
}

// ----------------------------------------------------
// PLAYBACK ENGINE
// ----------------------------------------------------

function initAudioContext() {
  if (audioCtx) return;

  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  audioCtx = new AudioContextClass();

  // Routing: MediaSource -> Filter 1 -> Filter 2 -> Filter 3 -> Filter 4 -> Filter 5 -> Analyser -> Output
  audioSource = audioCtx.createMediaElementSource(audioElement);

  const frequencies = [60, 230, 910, 4000, 14000];
  const filterTypes: BiquadFilterType[] = [
    "lowshelf",
    "peaking",
    "peaking",
    "peaking",
    "highshelf",
  ];

  let lastNode: AudioNode = audioSource;

  eqFilters = frequencies.map((freq, index) => {
    const filter = audioCtx!.createBiquadFilter();
    filter.type = filterTypes[index];
    filter.frequency.value = freq;
    filter.Q.value = 1.0;
    filter.gain.value = 0; // Flat initial

    lastNode.connect(filter);
    lastNode = filter;
    return filter;
  });

  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 256;

  lastNode.connect(analyserNode);
  analyserNode.connect(audioCtx.destination);

  // Apply slider positions to Biquad filters
  eqSliders.forEach((slider, i) => {
    const val = parseFloat(slider.value);
    eqFilters[i].gain.setValueAtTime(val, audioCtx!.currentTime);
  });

  startVisualizerLoop();
}

function loadTrack(index: number, autoPlay: boolean = true) {
  if (index < 0 || index >= filteredPlaylist.length) return;

  currentIndex = index;
  const track = filteredPlaylist[currentIndex];

  audioElement.src = track.url;

  // Select active track in playlist view
  document.querySelectorAll(".track-item").forEach((item) => {
    item.classList.remove("active");
  });
  const activeItem = document.getElementById(`item-${track.id}`);
  if (activeItem) {
    activeItem.classList.add("active");
    activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Update Media Details
  updateNowPlayingUI();
  updateMetadataInspectorUI(track);
  updateAudioSpecInfo(track);

  seekBar.value = "0";
  updateSeekProgressFill(0);
  timeElapsed.textContent = "0:00";
  timeTotal.textContent = track.durationStr || "0:00";

  if (autoPlay) {
    audioCtx?.resume();
    audioElement
      .play()
      .then(() => {
        isPlaying = true;
        updatePlayPauseUI();
        updateMediaSession();
      })
      .catch((err) => {
        console.warn("Autoplay was blocked or file error:", err);
        isPlaying = false;
        updatePlayPauseUI();
      });
  } else {
    isPlaying = false;
    updatePlayPauseUI();
    updateMediaSession();
  }
}

function togglePlay() {
  if (currentIndex === -1 && filteredPlaylist.length > 0) {
    loadTrack(0, true);
    return;
  }

  if (currentIndex === -1) return;

  audioCtx?.resume();

  if (isPlaying) {
    audioElement.pause();
    isPlaying = false;
  } else {
    audioElement
      .play()
      .then(() => {
        isPlaying = true;
      })
      .catch((err) => console.warn(err));
  }
  updatePlayPauseUI();
  updateMediaSession();
}

function prevTrack() {
  if (filteredPlaylist.length === 0) return;

  if (audioElement.currentTime > 3) {
    audioElement.currentTime = 0;
    return;
  }

  let nextIndex = currentIndex - 1;

  if (shuffleMode) {
    const queueIdx = shuffleQueue.indexOf(currentIndex);
    if (queueIdx > 0) {
      nextIndex = shuffleQueue[queueIdx - 1];
    } else {
      nextIndex = shuffleQueue[shuffleQueue.length - 1]; // wrap
    }
  } else {
    if (nextIndex < 0) {
      nextIndex = filteredPlaylist.length - 1; // wrap
    }
  }

  loadTrack(nextIndex, true);
}

function nextTrack(endedNaturally: boolean = false) {
  if (filteredPlaylist.length === 0) return;

  if (repeatMode === "one" && endedNaturally) {
    audioElement.currentTime = 0;
    audioElement.play().catch((err) => console.warn(err));
    return;
  }

  let nextIndex = currentIndex + 1;

  if (shuffleMode) {
    const queueIdx = shuffleQueue.indexOf(currentIndex);
    if (queueIdx !== -1 && queueIdx < shuffleQueue.length - 1) {
      nextIndex = shuffleQueue[queueIdx + 1];
    } else {
      if (repeatMode === "all" || !endedNaturally) {
        nextIndex = shuffleQueue[0]; // Wrap to start of shuffle
      } else {
        // Stop playing
        audioElement.pause();
        isPlaying = false;
        updatePlayPauseUI();
        return;
      }
    }
  } else {
    if (nextIndex >= filteredPlaylist.length) {
      if (repeatMode === "all" || !endedNaturally) {
        nextIndex = 0;
      } else {
        // Stop playing
        audioElement.pause();
        isPlaying = false;
        updatePlayPauseUI();
        return;
      }
    }
  }

  loadTrack(nextIndex, true);
}

function toggleShuffle() {
  shuffleMode = !shuffleMode;
  btnShuffle.classList.toggle("active", shuffleMode);

  if (shuffleMode && filteredPlaylist.length > 0) {
    // Generate a new shuffle queue
    shuffleQueue = Array.from({ length: filteredPlaylist.length }, (_, i) => i);
    // Fisher-Yates
    for (let i = shuffleQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffleQueue[i], shuffleQueue[j]] = [shuffleQueue[j], shuffleQueue[i]];
    }
    // Pull current playing to the top of queue
    if (currentIndex !== -1) {
      const curPos = shuffleQueue.indexOf(currentIndex);
      if (curPos !== -1) {
        shuffleQueue.splice(curPos, 1);
        shuffleQueue.unshift(currentIndex);
      }
    }
  }
}

function toggleRepeat() {
  if (repeatMode === "off") {
    repeatMode = "all";
    btnRepeat.classList.add("active");
    repeatBadge.classList.add("hidden");
  } else if (repeatMode === "all") {
    repeatMode = "one";
    btnRepeat.classList.add("active");
    repeatBadge.classList.remove("hidden");
  } else {
    repeatMode = "off";
    btnRepeat.classList.remove("active");
    repeatBadge.classList.add("hidden");
  }
}

function toggleMute() {
  isMuted = !isMuted;
  audioElement.muted = isMuted;
  updateVolumeUI();
}

// ----------------------------------------------------
// METADATA PARSING (jsmediatags)
// ----------------------------------------------------

async function parseAllMetadata() {
  // Parse in sequence so it doesn't freeze the page
  for (let i = 0; i < playlist.length; i++) {
    const track = playlist[i];
    try {
      const info = await parseID3Tags(track);

      if (info.title) track.title = info.title;
      if (info.artist) track.artist = info.artist;
      if (info.album) track.album = info.album;
      if (info.year) track.year = info.year;
      if (info.genre) track.genre = info.genre;
      if (info.coverUrl) track.coverUrl = info.coverUrl;

      // Update item in sidebar list
      updatePlaylistItemUI(track);

      // If active track tags resolved, update the player details
      if (
        currentIndex !== -1 &&
        filteredPlaylist[currentIndex].id === track.id
      ) {
        updateNowPlayingUI();
        updateMetadataInspectorUI(track);
      }
    } catch (err) {
      console.warn("Failed parsing metadata for file: ", track.name, err);
    }
  }
}

function parseID3Tags(track: Track): Promise<Partial<Track>> {
  return new Promise((resolve) => {
    if (typeof jsmediatags === "undefined") {
      resolve({});
      return;
    }

    jsmediatags.read(track.file, {
      onSuccess: function (tag: any) {
        const tags = tag.tags;
        let coverUrl: string | undefined = undefined;

        if (tags.picture) {
          try {
            const { data, format } = tags.picture;
            const arrayBuffer = new Uint8Array(data);
            const blob = new Blob([arrayBuffer], { type: format });
            coverUrl = URL.createObjectURL(blob);
          } catch (e) {
            console.error("Error creating cover blob url:", e);
          }
        }

        resolve({
          title: tags.title || undefined,
          artist: tags.artist || undefined,
          album: tags.album || undefined,
          year: tags.year || undefined,
          genre: tags.genre || undefined,
          coverUrl: coverUrl,
        });
      },
      onError: function () {
        // Gracefully resolve with empty object, filename fallback is already set
        resolve({});
      },
    });
  });
}

// ----------------------------------------------------
// UI RENDERING & DYNAMIC UPDATES
// ----------------------------------------------------

function renderPlaylist() {
  trackList.innerHTML = "";

  if (filteredPlaylist.length === 0) {
    playlistEmpty.classList.remove("hidden");
    trackList.classList.add("hidden");
    return;
  }

  playlistEmpty.classList.add("hidden");
  trackList.classList.remove("hidden");

  filteredPlaylist.forEach((track, index) => {
    const li = document.createElement("li");
    li.className = `track-item ${index === currentIndex ? "active" : ""}`;
    li.id = `item-${track.id}`;
    li.setAttribute("data-id", track.id);

    // Artwork thumbnail or initials
    let artworkHtml = "";
    if (track.coverUrl) {
      artworkHtml = `<img src="${track.coverUrl}" alt="" />`;
    } else {
      artworkHtml = `<div class="track-item-placeholder" style="background: ${track.customGradient}">${track.title.charAt(0).toUpperCase()}</div>`;
    }

    li.innerHTML = `
      <div class="track-item-artwork">${artworkHtml}</div>
      <div class="track-item-details">
        <span class="track-item-title">${track.title}</span>
        <span class="track-item-artist">${track.artist}</span>
      </div>
      <span class="track-item-duration">${track.durationStr || "--:--"}</span>
    `;

    li.addEventListener("click", () => {
      initAudioContext();
      loadTrack(index, true);
    });

    trackList.appendChild(li);
  });
}

function updatePlaylistItemUI(track: Track) {
  const item = document.querySelector(`.track-item[data-id="${track.id}"]`);
  if (!item) return;

  // Update text values
  const titleEl = item.querySelector(".track-item-title");
  const artistEl = item.querySelector(".track-item-artist");
  const artWrapper = item.querySelector(".track-item-artwork");

  if (titleEl) titleEl.textContent = track.title;
  if (artistEl) artistEl.textContent = track.artist;

  if (artWrapper) {
    if (track.coverUrl) {
      artWrapper.innerHTML = `<img src="${track.coverUrl}" alt="" />`;
    } else {
      artWrapper.innerHTML = `<div class="track-item-placeholder" style="background: ${track.customGradient}">${track.title.charAt(0).toUpperCase()}</div>`;
    }
  }
}

function filterPlaylist() {
  if (!searchQuery) {
    filteredPlaylist = [...playlist];
  } else {
    filteredPlaylist = playlist.filter((track) => {
      return (
        track.title.toLowerCase().includes(searchQuery) ||
        track.artist.toLowerCase().includes(searchQuery) ||
        track.album.toLowerCase().includes(searchQuery) ||
        track.name.toLowerCase().includes(searchQuery)
      );
    });
  }

  // Preserve the currently playing index if it's still in the filtered list
  const currentPlayingTrack =
    currentIndex !== -1
      ? filteredPlaylist.findIndex((t) => t.id === playlist[currentIndex].id)
      : -1;

  renderPlaylist();

  if (currentPlayingTrack !== -1) {
    currentIndex = currentPlayingTrack;
    const activeItem = document.getElementById(
      `item-${filteredPlaylist[currentIndex].id}`,
    );
    if (activeItem) activeItem.classList.add("active");
  }
}

function updatePlaylistSummary() {
  playlistCount.textContent = `${playlist.length} track${playlist.length === 1 ? "" : "s"} loaded`;
}

function updateNowPlayingUI() {
  if (currentIndex === -1) return;
  const track = filteredPlaylist[currentIndex];

  // Title with marquee calculation
  trackTitle.textContent = track.title;
  trackTitle.classList.remove("marquee-animate");

  // Set horizontal marquee if string overflows container width (approx 360px center pane width)
  const tempSpan = document.createElement("span");
  tempSpan.style.font = getComputedStyle(trackTitle).font;
  tempSpan.style.visibility = "hidden";
  tempSpan.style.whiteSpace = "nowrap";
  tempSpan.textContent = track.title;
  document.body.appendChild(tempSpan);
  const textWidth = tempSpan.offsetWidth;
  document.body.removeChild(tempSpan);

  if (textWidth > 320) {
    trackTitle.classList.add("marquee-animate");
    trackTitle.innerHTML = `<span>${track.title}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>${track.title}</span>`;
  }

  trackArtist.textContent = track.artist;
  trackAlbum.textContent = track.album !== "Unknown Album" ? track.album : "";

  // Cover Art Display
  if (track.coverUrl) {
    coverImage.src = track.coverUrl;
    coverImage.classList.remove("hidden");
    coverPlaceholder.classList.add("hidden");
    playerCoverBg.style.backgroundImage = `url(${track.coverUrl})`;
    playerCoverBg.style.opacity = "0.35";
  } else {
    coverImage.classList.add("hidden");
    coverPlaceholder.classList.remove("hidden");
    coverPlaceholder.style.background = track.customGradient;
    playerCoverBg.style.backgroundImage = "none";
    playerCoverBg.style.opacity = "0";
  }
}

function resetPlayerUI() {
  trackTitle.textContent = "No Track Loaded";
  trackTitle.classList.remove("marquee-animate");
  trackArtist.textContent = "Select a folder or file to begin playing music";
  trackAlbum.textContent = "";

  coverImage.classList.add("hidden");
  coverPlaceholder.classList.remove("hidden");
  coverPlaceholder.style.background = "";
  playerCoverBg.style.backgroundImage = "none";
  playerCoverBg.style.opacity = "0";

  seekBar.value = "0";
  seekBar.disabled = true;
  updateSeekProgressFill(0);
  timeElapsed.textContent = "0:00";
  timeTotal.textContent = "0:00";

  audioSpec.textContent = "Stereo • 44.1kHz";

  // Clear metadata panel
  metaFilename.textContent = "-";
  metaTitle.textContent = "-";
  metaArtist.textContent = "-";
  metaAlbum.textContent = "-";
  metaYear.textContent = "-";
  metaGenre.textContent = "-";
  metaSize.textContent = "-";
}

function updatePlayPauseUI() {
  if (isPlaying) {
    playIcon.classList.add("hidden");
    pauseIcon.classList.remove("hidden");
    document.getElementById("cover-wrapper")?.classList.add("playing");
  } else {
    playIcon.classList.remove("hidden");
    pauseIcon.classList.add("hidden");
    document.getElementById("cover-wrapper")?.classList.remove("playing");
  }
}

function updateSeekProgressFill(progress: number) {
  seekProgressFill.style.width = `${progress}%`;
}

function updateVolumeUI() {
  volumeSlider.value = isMuted ? "0" : volume.toString();
  volumeProgressFill.style.width = `${isMuted ? 0 : volume * 100}%`;

  if (isMuted) {
    iconVolumeHigh.classList.add("hidden");
    iconVolumeMute.classList.remove("hidden");
    audioElement.muted = true;
  } else {
    iconVolumeHigh.classList.remove("hidden");
    iconVolumeMute.classList.add("hidden");
    audioElement.muted = false;
    audioElement.volume = volume;
  }
}

function updateMetadataInspectorUI(track: Track) {
  metaFilename.textContent = track.name;
  metaTitle.textContent = track.title;
  metaArtist.textContent = track.artist;
  metaAlbum.textContent = track.album;
  metaYear.textContent = track.year;
  metaGenre.textContent = track.genre;

  // Size format
  const bytes = track.file.size;
  if (bytes === 0) metaSize.textContent = "0 Bytes";
  const k = 1024;
  const dm = 2;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  metaSize.textContent =
    parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function updateAudioSpecInfo(track: Track) {
  const ext = track.name
    .substring(track.name.lastIndexOf(".") + 1)
    .toUpperCase();
  audioSpec.textContent = `${ext} • Stereo • 44.1kHz`;
}

// ----------------------------------------------------
// EQUALIZER ENGINE
// ----------------------------------------------------

function applyEQPreset(presetName: string) {
  if (presetName === "custom") return;
  const gains = EQ_PRESETS[presetName] || EQ_PRESETS.flat;

  eqSliders.forEach((slider, index) => {
    slider.value = gains[index].toString();
    eqVals[index].textContent =
      `${gains[index] > 0 ? "+" : ""}${gains[index]}dB`;

    // Apply to filter node
    if (eqFilters[index]) {
      eqFilters[index].gain.setTargetAtTime(
        gains[index],
        audioCtx!.currentTime,
        0.15,
      );
    }
  });
}

// ----------------------------------------------------
// CANVAS AUDIO VISUALIZER
// ----------------------------------------------------

function resizeCanvas() {
  const rect = visualizerCanvas.getBoundingClientRect();
  visualizerCanvas.width = rect.width * window.devicePixelRatio;
  visualizerCanvas.height = rect.height * window.devicePixelRatio;
}

function startVisualizerLoop() {
  const bufferLength = analyserNode!.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // Color presets corresponding to selected index theme
  const getColors = () => {
    const theme = visThemeSelect.value;
    switch (theme) {
      case "cyan":
        return {
          start: "#06b6d4",
          end: "#10b981",
          glow: "rgba(6, 182, 212, 0.4)",
        };
      case "fire":
        return {
          start: "#f59e0b",
          end: "#ef4444",
          glow: "rgba(245, 158, 11, 0.4)",
        };
      case "rainbow":
        return {
          start: "rainbow",
          end: "rainbow",
          glow: "rgba(255, 255, 255, 0.2)",
        };
      case "violet":
      default:
        return {
          start: "#a78bfa",
          end: "#ec4899",
          glow: "rgba(167, 139, 250, 0.4)",
        };
    }
  };

  let angleOffset = 0; // Circular orbit rotation speed tracker

  function draw() {
    requestAnimationFrame(draw);

    const style = visStyleSelect.value;
    const w = visualizerCanvas.width;
    const h = visualizerCanvas.height;

    // Clear canvas
    ctxCanvas.clearRect(0, 0, w, h);

    if (style === "none" || !analyserNode || !isPlaying) return;

    const colors = getColors();

    if (style === "bars") {
      analyserNode.getByteFrequencyData(dataArray);

      const barCount = Math.min(64, bufferLength);
      const barWidth = (w / barCount) * 0.8;
      const barGap = (w / barCount) * 0.2;

      // Draw neon spectrum bars
      for (let i = 0; i < barCount; i++) {
        const percent = dataArray[i] / 255;
        const barHeight = percent * h * 0.7;

        const x = i * (barWidth + barGap) + barGap / 2;
        const y = h - barHeight;

        // Define color gradient
        let gradient: string | CanvasGradient;
        if (colors.start === "rainbow") {
          const hue = (i / barCount) * 360;
          gradient = `hsl(${hue}, 85%, 60%)`;
        } else {
          gradient = ctxCanvas.createLinearGradient(x, y, x, h);
          gradient.addColorStop(0, colors.start);
          gradient.addColorStop(1, colors.end);
        }

        ctxCanvas.fillStyle = gradient;
        ctxCanvas.shadowBlur = percent * 15;
        ctxCanvas.shadowColor =
          colors.start === "rainbow" ? "rgba(255,255,255,0.3)" : colors.glow;

        // Rounded bars
        ctxCanvas.beginPath();
        ctxCanvas.roundRect(x, y, barWidth, barHeight, [6, 6, 0, 0]);
        ctxCanvas.fill();
      }
      ctxCanvas.shadowBlur = 0; // reset
    } else if (style === "circular") {
      analyserNode.getByteFrequencyData(dataArray);

      const centerX = w / 2;
      const centerY = h / 2;

      // Select base radius fitting inside the cover art wrapper
      const isMobile = window.innerWidth <= 768;
      const baseRadius = isMobile ? 100 : 130;

      const pointCount = Math.min(80, bufferLength);
      angleOffset += 0.003; // Rotate spectrum circle slowly

      ctxCanvas.shadowBlur = 10;

      for (let i = 0; i < pointCount; i++) {
        const percent = dataArray[i] / 255;
        const amplitude = percent * 60; // Max line height

        const angle = (i / pointCount) * Math.PI * 2 + angleOffset;

        const startX = centerX + Math.cos(angle) * baseRadius;
        const startY = centerY + Math.sin(angle) * baseRadius;

        const endX = centerX + Math.cos(angle) * (baseRadius + amplitude);
        const endY = centerY + Math.sin(angle) * (baseRadius + amplitude);

        let color = "";
        if (colors.start === "rainbow") {
          const hue = (i / pointCount) * 360;
          color = `hsl(${hue}, 85%, 60%)`;
        } else {
          // Lerp start/end colors based on index
          color = i % 2 === 0 ? colors.start : colors.end;
        }

        ctxCanvas.strokeStyle = color;
        ctxCanvas.shadowColor =
          colors.start === "rainbow" ? "rgba(255,255,255,0.3)" : colors.glow;
        ctxCanvas.lineWidth = isMobile ? 2.5 : 4;
        ctxCanvas.lineCap = "round";

        ctxCanvas.beginPath();
        ctxCanvas.moveTo(startX, startY);
        ctxCanvas.lineTo(endX, endY);
        ctxCanvas.stroke();
      }
      ctxCanvas.shadowBlur = 0; // reset
    } else if (style === "waveform") {
      analyserNode.getByteTimeDomainData(dataArray);

      ctxCanvas.beginPath();
      ctxCanvas.lineWidth = 4;
      ctxCanvas.shadowBlur = 15;

      let strokeStyle: string | CanvasGradient;
      if (colors.start === "rainbow") {
        strokeStyle = ctxCanvas.createLinearGradient(0, 0, w, 0);
        strokeStyle.addColorStop(0, "red");
        strokeStyle.addColorStop(0.2, "orange");
        strokeStyle.addColorStop(0.4, "yellow");
        strokeStyle.addColorStop(0.6, "green");
        strokeStyle.addColorStop(0.8, "blue");
        strokeStyle.addColorStop(1, "violet");
        ctxCanvas.shadowColor = "rgba(255, 255, 255, 0.4)";
      } else {
        strokeStyle = ctxCanvas.createLinearGradient(0, 0, w, 0);
        strokeStyle.addColorStop(0, colors.start);
        strokeStyle.addColorStop(1, colors.end);
        ctxCanvas.shadowColor = colors.glow;
      }

      ctxCanvas.strokeStyle = strokeStyle;

      const sliceWidth = w / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // 0.0 to 2.0
        const y = (v * h) / 2; // centered

        if (i === 0) {
          ctxCanvas.moveTo(x, y);
        } else {
          ctxCanvas.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctxCanvas.lineTo(w, h / 2);
      ctxCanvas.stroke();
      ctxCanvas.shadowBlur = 0; // reset
    }
  }

  draw();
}

// ----------------------------------------------------
// UTILITIES
// ----------------------------------------------------

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// ----------------------------------------------------
// MEDIA SESSION API SUPPORT
// ----------------------------------------------------

function updateMediaSession() {
  if (!("mediaSession" in navigator)) return;
  if (currentIndex === -1) return;

  const track = filteredPlaylist[currentIndex];

  const metadataInit: MediaMetadataInit = {
    title: track.title,
    artist: track.artist,
    album: track.album,
  };

  if (track.coverUrl) {
    metadataInit.artwork = [
      { src: track.coverUrl, sizes: "512x512", type: "image/png" },
    ];
  }

  navigator.mediaSession.metadata = new MediaMetadata(metadataInit);
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
}

function setupMediaSessionHandlers() {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.setActionHandler("play", () => {
    initAudioContext();
    if (!isPlaying) togglePlay();
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    if (isPlaying) togglePlay();
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    prevTrack();
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => {
    nextTrack();
  });
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime !== undefined && audioElement.duration) {
      audioElement.currentTime = details.seekTime;
    }
  });
}

// Startup the app
window.addEventListener("DOMContentLoaded", () => {
  initEvents();
});

// ----------------------------------------------------
// THEME TOGGLE / PERSISTENCE (Neon Gaming Theme)
// ----------------------------------------------------
function setTheme(isNeon: boolean) {
  const root = document.documentElement;
  if (isNeon) root.classList.add("theme-neon");
  else root.classList.remove("theme-neon");

  if (iconThemeLight) iconThemeLight.classList.toggle("hidden", isNeon);
  if (iconThemeDark) iconThemeDark.classList.toggle("hidden", !isNeon);

  try {
    localStorage.setItem("vibe-theme", isNeon ? "neon" : "default");
  } catch (e) {
    /* ignore */
  }
}

function applySavedTheme() {
  try {
    const saved = localStorage.getItem("vibe-theme");
    const preferNeon = saved === "neon";
    if (saved) setTheme(preferNeon);
    else {
      // default to neon for a gaming look, but respect prefers-color-scheme dark
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark || true);
    }
  } catch (e) {
    setTheme(true);
  }
}

function toggleTheme() {
  const isNeon = !document.documentElement.classList.contains("theme-neon");
  setTheme(isNeon);
}
