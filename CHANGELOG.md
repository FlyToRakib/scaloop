# Changelog

All notable changes to the Scaloop project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), 
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-03-25

### Added
- **AI Models:** Fully integrated `RealESRGAN` and `Stable Diffusion x4` model weights and pipelines directly into the inference backend.
- **Robustness:** Added silent error handling for connection issues in the UI to prevent unhandled fetch crashes when the engine goes offline.

### Fixed
- **Stable Diffusion Load:** Addressed issues where large Stable Diffusion model downloads (3.4GB) on first run caused apparent failure states.

## [1.0.0] - 2026-03-25

### Added
- **Project Structure:** Properly scaffolded monorepo-style structure featuring decoupled environments (`desktop/`, `engine/`, `frontend/`).
- **AI Engine:** Python environment configuration (`main.py`, `hardware_profiler.py`, `requirements.txt`).
- **Next.js Frontend:** UI scaffolding containing basic layout, global CSS, and page setups.
- **Desktop Wrapper:** Electron integration structure initialized within `desktop/`.
- **Git Context:** Configured correct, complete, and robust `.gitignore` ensuring clean future deployments.
- **Documentation:** Initial comprehensive `README.md` containing fresh installation instructions.
