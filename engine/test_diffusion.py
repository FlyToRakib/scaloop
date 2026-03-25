try:
    from diffusers import StableDiffusionUpscalePipeline
    import torch
    print("Diffusers loaded successfully")
    model_id = "stabilityai/stable-diffusion-x4-upscaler"
    dtype = torch.float16 if torch.cuda.is_available() else torch.float32
    print("Attempting to load pipeline...")
    pipeline = StableDiffusionUpscalePipeline.from_pretrained(model_id, torch_dtype=dtype)
    print("Pipeline loaded successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
