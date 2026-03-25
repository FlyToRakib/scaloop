# Scaloop

A battle-proof, industry-standard AI Image Upscaling Application. Scaloop is designed to process images with state-of-the-art AI tensor inference models, wrapped in a beautiful, modern multi-platform shell. 

## 🏗️ Architecture Stack

The application is built using a modern, decoupled architecture with three main components:

- **`engine/`**: The Python backend powering the AI tensor inference logic, hardware profiling, and FastAPI services.
- **`frontend/`**: The Next.js application providing a fast, reactive user interface with sleek visual design.
- **`desktop/`**: The Electron-based desktop wrapper that provides seamless OS integration (e.g., native folder selection).

## 🚀 Getting Started & Fresh Installation

Follow these instructions to set up Scaloop from a fresh `git clone`.

### Prerequisites
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python 3.12](https://www.python.org/downloads/) (or compatible Python version)

### 1. Clone the Repository
```bash
git clone https://github.com/FlyToRakib/scaloop.git
cd scaloop
```

### 2. Setup the AI Engine (Python)
Navigate to the `engine` directory and install the required Python packages into a virtual environment:
```bash
cd engine
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# Install PyTorch for NVIDIA GPU (Recommended for faster AI inference):
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126
# OR for CPU only:
# pip install torch torchvision torchaudio

# Install remaining backend requirements:
pip install -r requirements.txt
```

### 3. Setup the Frontend Interface (Next.js)
Navigate to the `frontend` directory and install the Node runtime packages:
```bash
cd ../frontend
npm install
```

### 4. Setup the Desktop Client (Electron)
Navigate to the `desktop` directory to install the wrapper bounds:
```bash
cd ../desktop
npm install
```

## 🏃 Running the Application

> [!NOTE]
> **First Run Model Downloads**: The first time you select and run either RealESRGAN or Stable Diffusion, the AI Engine will download the pre-trained weights automatically (up to ~3.5GB). Please ensure you have an active internet connection and wait for the engine terminal to finish downloading.

To run Scaloop locally, you will need to start all three components in separate terminal windows:

**1. Start the AI Engine (Terminal 1)**
```bash
cd engine
# Ensure your virtual environment is activated (e.g., venv\Scripts\activate)
python main.py
```

**2. Start the Frontend UI (Terminal 2)**
```bash
cd frontend
npm run dev
```

**3. Start the Desktop Wrapper (Terminal 3)**
```bash
cd desktop
npm start
```

## 🤝 Contributing

Ensure that you have set up all three environments before attempting to run full-stack integration tests. Refer to the `CHANGELOG.md` for historical version updates.
