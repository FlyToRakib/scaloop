import asyncio
import gc
import os
import tkinter as tk
from tkinter import filedialog
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import torch
except ImportError:
    torch = None

try:
    import cv2
except ImportError:
    cv2 = None

from hardware_profiler import profile_hardware, HardwareProfile

# Globals
hardware_profile: HardwareProfile = None
progress_connections: list[WebSocket] = []


def select_directory_dialog() -> str:
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    folder_path = filedialog.askdirectory(parent=root, title="Select Folder")
    root.destroy()
    return folder_path


class UpscaleWorker:
    def __init__(self, model_name: str, hw_profile: HardwareProfile, gpu_limit: float, scale_factor: int):
        self.model_name = model_name
        self.hw_profile = hw_profile
        self.gpu_limit = gpu_limit / 100.0
        self.scale_factor = scale_factor
        self.model = None
        
        self._apply_gpu_limits()
        self._load_model()
        
    def _apply_gpu_limits(self):
        """
        Dynamically adjusts PyTorch's max VRAM allocation footprint per process.
        Requires the memory fraction (0.0 to 1.0) slider value from the frontend.
        """
        if torch and torch.cuda.is_available() and self.gpu_limit > 0.0:
            try:
                torch.cuda.set_per_process_memory_fraction(self.gpu_limit)
                print(f"GPU Memory Fraction Limited To: {self.gpu_limit * 100}%")
            except Exception as e:
                print(f"Warning: Could not set memory fraction: {e}")

    def _load_model(self):
        print(f"Instantiating {self.model_name}...")
        if self.model_name == "ESRGAN":
            # Stub integration ready for RealESRGAN
            print("ESRGAN structure compiled (Awaiting 'realesrgan' import/weights).")
        elif self.model_name == "Diffusion":
            print("Stable Diffusion pipeline logic prepped (Awaiting 'diffusers').")
            
    async def process_image(self, input_path: str, output_path: str):
        print(f"Loading image {input_path}...")
        if cv2 is None:
            print("Error: CV2 not installed (`pip install opencv-python`), skipping file I/O.")
            return

        # 1. Load source image tensor
        img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            print(f"Error: Could not read {input_path}")
            return

        print(f"Processing {input_path} at {self.scale_factor}x scale using {self.model_name}...")
        
        # 2. Engine Pass (Simulating upscale explicitly until PyTorch weight arrays are provided)
        # Using native CV2 Lanczos processing to complete the true file I/O circuit.
        # In a real pipeline: `output, _ = self.model.enhance(img, outscale=self.scale_factor)`
        output = cv2.resize(img, None, fx=self.scale_factor, fy=self.scale_factor, interpolation=cv2.INTER_LANCZOS4)
        
        # 3. Explicitly write back to the user's filesystem
        cv2.imwrite(output_path, output)
        print(f"Successfully saved Up-Scaled output to: {output_path}")


class SingleRequest(BaseModel):
    image_path: str
    output_dir: str
    model: str
    gpu_limit: float
    scale_factor: int

class BatchRequest(BaseModel):
    directory_path: str
    output_dir: str
    model: str
    gpu_limit: float
    scale_factor: int

@asynccontextmanager
async def lifespan(app: FastAPI):
    global hardware_profile
    hardware_profile = profile_hardware()
    print(f"Hardware Profile Booted. GPU: {hardware_profile.gpu_name}")
    yield
    print("Shutting down engine...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/utils/browse-folder")
async def browse_folder():
    """ Native OS folder selection modal routed asynchronously via tkinter. """
    loop = asyncio.get_running_loop()
    # Runs the tkinter GUI thread outside the main event loop to prevent async blocking
    folder_path = await loop.run_in_executor(None, select_directory_dialog)
    return {"path": folder_path}


async def broadcast_progress(current: int, total: int, file_pct: float = 100.0):
    to_remove = []
    for conn in progress_connections:
        try:
            await conn.send_json({
                "current": current,
                "total": total,
                "file_percentage": file_pct
            })
        except Exception:
            to_remove.append(conn)
            
    for conn in to_remove:
        progress_connections.remove(conn)

def clean_vram():
    print("Sweeping execution garbage... (VRAM cache clearing)")
    gc.collect()
    if torch and torch.cuda.is_available():
        torch.cuda.empty_cache()

@app.get("/api/system-status")
async def get_system_status():
    global hardware_profile
    # We profile live during this GET request to return instantaneous Available Free VRAM strings
    hardware_profile = profile_hardware()
    return hardware_profile

@app.post("/api/upscale/single")
async def upscale_single(req: SingleRequest):
    worker = UpscaleWorker(req.model, hardware_profile, req.gpu_limit, req.scale_factor)
    await broadcast_progress(0, 1, 0.0)
    
    # Construct output cleanly (e.g. name_4x_esrgan.png)
    base = os.path.basename(req.image_path)
    name, ext = os.path.splitext(base)
    clean_name = f"{name}_{req.scale_factor}x_{req.model.lower()}{ext}"
    safe_out = os.path.join(req.output_dir, clean_name)
    
    await worker.process_image(req.image_path, safe_out)
    
    clean_vram()
    await broadcast_progress(1, 1, 100.0)
    return {"status": "success", "file": safe_out}

@app.post("/api/upscale/batch")
async def upscale_batch(req: BatchRequest):
    # Verify exact path input strings mapping to OS directories
    if not os.path.isdir(req.directory_path):
        return {"status": "error", "message": "Invalid Source Directory requested."}
        
    valid_exts = {".png", ".jpg", ".jpeg", ".webp"}
    files = [os.path.join(req.directory_path, f) for f in os.listdir(req.directory_path) 
             if os.path.splitext(f)[1].lower() in valid_exts]
             
    total = len(files)
    if total == 0:
        return {"status": "success", "processed": 0}
    
    # Init once
    worker = UpscaleWorker(req.model, hardware_profile, req.gpu_limit, req.scale_factor)
    
    for idx, f in enumerate(files):
        await broadcast_progress(idx, total, 0.0)
        
        # Format the processed file name to include scale factors
        base = os.path.basename(f)
        name, ext = os.path.splitext(base)
        clean_name = f"{name}_{req.scale_factor}x_{req.model.lower()}{ext}"
        safe_out = os.path.join(req.output_dir, clean_name)
        
        await worker.process_image(f, safe_out)
        
        # CRITICAL FIX: Memory sweep immediately after safely writing out the exact file
        clean_vram()
        
        await broadcast_progress(idx + 1, total, 100.0)
        
    return {"status": "success", "processed": total}

@app.websocket("/ws/progress")
async def websocket_progress(websocket: WebSocket):
    await websocket.accept()
    progress_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        progress_connections.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
