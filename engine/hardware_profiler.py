import os
import psutil
from dataclasses import dataclass

try:
    import torch
except ImportError:
    torch = None

@dataclass
class HardwareProfile:
    ram_gb: float
    cpu_cores: int
    has_cuda: bool
    gpu_name: str
    vram_total_gb: float | None
    vram_free_gb: float | None

def profile_hardware() -> HardwareProfile:
    # RAM
    ram = psutil.virtual_memory().total / (1024 ** 3)
    
    # CPU Cores
    cores = os.cpu_count() or 4
    
    # GPU VRAM detection
    has_cuda = torch.cuda.is_available() if torch else False
    gpu_name = "N/A"
    vram_total = None
    vram_free = None
    
    if has_cuda:
        try:
            device = torch.cuda.current_device()
            gpu_name = torch.cuda.get_device_name(device)
            # Total Memory
            vram_total = torch.cuda.get_device_properties(device).total_memory / (1024 ** 3)
            # Live Free Memory
            free_mem, _ = torch.cuda.mem_get_info(device)
            vram_free = free_mem / (1024 ** 3)
        except Exception as e:
            print(f"Failed to fetch detailed VRAM: {e}")
            
    # Force CPU fallback if no CUDA
    if not has_cuda:
        gpu_name = "CPU Only"
        
    return HardwareProfile(
        ram_gb=round(ram, 2),
        cpu_cores=cores,
        has_cuda=has_cuda,
        gpu_name=gpu_name,
        vram_total_gb=round(vram_total, 2) if vram_total is not None else None,
        vram_free_gb=round(vram_free, 2) if vram_free is not None else None
    )

if __name__ == "__main__":
    prof = profile_hardware()
    print("Detected System Profile:")
    print(f"GPU: {prof.gpu_name}")
    print(f"RAM: {prof.ram_gb} GB")
    print(f"CPU Cores: {prof.cpu_cores}")
    print(f"VRAM: {prof.vram_free_gb}/{prof.vram_total_gb} GB (Free/Total)" if prof.has_cuda else "VRAM: N/A")
