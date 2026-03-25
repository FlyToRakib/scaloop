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

pip install -r requirements.txt
```

### 3. Setup the Frontend Interface (Next.js)
Navigate to the `frontend` directory and install the Node runtime packages:
```bash
cd ../frontend
npm install
# To run the development server later: npm run dev
```

### 4. Setup the Desktop Client (Electron)
Navigate to the `desktop` directory to install the wrapper bounds:
```bash
cd ../desktop
npm install
# To start the desktop app: npm start
```

## 🤝 Contributing

Ensure that you have set up all three environments before attempting to run full-stack integration tests. Refer to the `CHANGELOG.md` for historical version updates.
