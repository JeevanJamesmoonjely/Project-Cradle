# Project Cradle: Open-World Planetary Surveyor
> **NASA Space Apps Challenge Submission**  
> An interactive, open-world 3D Martian planetary exploration simulator and real-time mission telemetry platform built with Next.js 16, Three.js, React Three Fiber (R3F), Zustand, and authentic NASA aerospace datasets.

---

## 🚀 Overview

**Project Cradle** puts the user in command of an autonomous six-wheel rocker-bogie planetary rover exploring the rich geological landscapes of Mars' **Jezero Crater**. Every terrain formation, rock outcrop, and ambient condition provides authentic scientific telemetry, chemical composition, Raman/XRD spectrogram curves, and peer-reviewed NASA citations (Perseverance, Curiosity, and Mars Reconnaissance Orbiter datasets).

---

## 🪐 Key Features

### 1. Seamless 3D Surface & Atmospheric Engine
- **Procedural Multi-Biome Terrain**:
  - **Ancient Riverbed Delta**: Terraced sedimentary mudstones rich in smectite clay and hydrated silica.
  - **Basaltic Dune Fields**: Dark volcanic ripples with increased regolith wheel resistance and motor slip.
  - **Belva Crater Rim**: Shock metamorphic shatter-cone quartz, impact glass breccias, and fault fractures.
  - **Exposed Escarpment**: Stratified horizontal sulfate canyon walls and hyper-saline evaporitic brines.
- **Dynamic Diurnal & Weather Simulation**:
  - Solar irradiance shifts (0W at night up to 580W at solar noon).
  - Ambient Martian temperature changes (-80°C night to -5°C midday).
  - Atmospheric optical depth ($\tau$) dust haze and localized storm conditions.
  - Real-time sky dome with directional sunlight, celestial stars, and Phobos moon orbits.

### 2. Scientific Knowledge Engine & Proximity Scanner
- **Authentic NASA Dataset Grounding**:
  - Sample targets cite real Perseverance Sol campaigns, PIXL micro-XRF analysis, SuperCam LIBS laser pulses, and MRO CRISM spectral targets.
  - Deep astrobiological preservation assessments (biosignature potential ratings).
- **Proximity Scanner & Holographic Beacons**:
  - 3D world-space targeting reticles hover over formations within 15 meters.
  - **[F] Key Deep Scan Mode**: Triggers a pulsed Raman/LIBS laser sweep animation from the rover's remote sensing mast to the target rock, draining battery wattage and unlocking high-resolution science dossiers.

### 3. Flight Telemetry & Heads-Up Display (HUD)
- **Real-Time Artificial Horizon / Inclinometer**: Live pitch and roll pitch visualization with steep incline rollover hazard warnings.
- **Digital Speedometer & Wheel Slip**: Accurate drivetrain velocity and regolith friction telemetry.
- **Power Budget**: Real-time solar panel generation versus active subsystem draw (avionics, motors, payload instruments).
- **Deep Space Network (DSN) Telemetry Downlink**: Transmit cached sample data to Earth ground stations for Science Points and mission rewards.

### 4. Interactive Mission Operations Tablet (`[Tab]` Key)
- **Topographic Sat-Nav & Radar**: Top-down orbital map showing biome contours, rover heading vector, and interactive click-to-set GPS waypoints.
- **Planetary Encyclopedia (PDS)**: Comprehensive catalog searchable across Astrobiology, Volcanology, Hydrology, Atmospheric, and Mineralogy categories.
- **Subsystem Diagnostics & Switchboard**: Toggle individual payload sensors (Mastcam-Z, SuperCam, RIMFAX, Hazcams) to manage power, plus manual solar array dust-clearing vibrations.
- **Space Apps Mission Objectives**: Tiered primary and secondary mission goals with real-time progress bars.

### 5. Procedural Web Audio API Engine
- **Electric Drivetrain Pitch**: Pitch-modulated servo motor whine scaling with rover velocity.
- **Wheel Regolith Crunch**: Procedural gravel/sand friction audio.
- **LIBS Laser Burst**: Pulsed spectroscopic sound sweeps.
- **Authentic Quindar Tones**: 2525 Hz and 2475 Hz Apollo/DSN radio communication chimes.
- **Martian Wind Atmosphere**: Bandpass-filtered pink noise modulated by optical dust tau.

---

## 🎮 Flight Controls

| Key | Action |
| :--- | :--- |
| `W` / `↑` | Drive Rover Forward |
| `S` / `↓` | Reverse / Brake |
| `A` / `←` | Steer Left |
| `D` / `→` | Steer Right |
| `Space` | Emergency Mechanical Handbrake |
| `F` | Engage Deep Spectrometric Scan (within 15m of outcrop) |
| `Tab` | Open / Close Mission Operations Tablet |
| `C` | Cycle Camera Mode (Follow 3rd-Person / Orbit / Mastcam Cockpit) |
| `Esc` | Close Active Modals |

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **3D Graphics Engine**: [Three.js](https://threejs.org/), [@react-three/fiber](https://r3f.docs.pmnd.rs/), [@react-three/drei](https://github.com/pmndrs/drei)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & UI Assets**: [Lucide React](https://lucide.dev/)
- **Celebrations**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Audio**: Procedural Web Audio API Synthesizer (Zero external audio file dependency)

---

## 🏁 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to command Project Cradle.
