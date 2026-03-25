'use client';
import { useState, useEffect, useRef } from 'react';

// Using Lucide-React icons if installed, but since I didn't install it, I'll use standard emojis or SVG strings to be completely safe.
export default function ScaloopPage() {
  const [model, setModel] = useState<'ESRGAN' | 'Diffusion'>('ESRGAN');
  const [scaleFactor, setScaleFactor] = useState<number>(4);
  const [gpuLimit, setGpuLimit] = useState<number>(80);
  const [sourceDir, setSourceDir] = useState<string>('');
  const [outputDir, setOutputDir] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [sysStatus, setSysStatus] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/progress');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress({
        current: data.current,
        total: data.total,
        percentage: data.file_percentage,
      });
    };
    wsRef.current = ws;

    // Fetch System Status dynamically
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/system-status');
        const data = await res.json();
        setSysStatus(data);
      } catch (err) {
        console.error("Engine offline", err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => {
        ws.close();
        clearInterval(interval);
    }
  }, []);

  const handleStart = async () => {
    if (!sourceDir || !outputDir || isProcessing) return;
    setIsProcessing(true);
    try {
      await fetch('http://127.0.0.1:8000/api/upscale/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          directory_path: sourceDir, 
          output_dir: outputDir, 
          model,
          gpu_limit: gpuLimit,
          scale_factor: scaleFactor
        }),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBrowseSource = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/utils/browse-folder');
      const data = await res.json();
      if (data.path) setSourceDir(data.path);
    } catch(err) { console.error(err); }
  };

  const handleBrowseOutput = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/utils/browse-folder');
      const data = await res.json();
      if (data.path) setOutputDir(data.path);
    } catch(err) { console.error(err); }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-8 font-sans selection:bg-indigo-500/30">
      {/* Top Navbar & Hardware Dashboard */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto mb-10 bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">S</div>
          <h1 className="text-xl font-bold tracking-tight text-white flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            Scaloop <span className="text-[10px] font-mono font-medium text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full tracking-wider mt-1 sm:mt-0">v1.0.0</span>
          </h1>
        </div>
        
        {/* Hardware Widget */}
        <div className="flex items-center gap-4 text-xs font-mono">
           {sysStatus ? (
             <div className="hidden md:flex flex-row items-center gap-4">
                 <div className="flex flex-col">
                    <span className="text-neutral-500 tracking-wider">GPU</span>
                    <span className="text-indigo-400 font-semibold">{sysStatus.gpu_name}</span>
                 </div>
                 {sysStatus.has_cuda && (
                     <div className="flex flex-col border-l border-neutral-800 pl-4">
                        <span className="text-neutral-500 tracking-wider">VRAM</span>
                        <span className={sysStatus.vram_free_gb < 2 ? "text-red-400" : "text-emerald-400 font-medium"}>
                            {sysStatus.vram_free_gb}GB / {sysStatus.vram_total_gb}GB Free
                        </span>
                     </div>
                 )}
                 <div className="flex flex-col border-l border-neutral-800 pl-4">
                    <span className="text-neutral-500 tracking-wider">RAM / CPU</span>
                    <span className="text-neutral-300">{sysStatus.ram_gb}GB | {sysStatus.cpu_cores} Cores</span>
                 </div>
             </div>
           ) : (
             <span className="text-neutral-500 animate-pulse hidden sm:block">Connecting to Engine...</span>
           )}
           <button onClick={() => setShowSettings(true)} className="p-2 ml-4 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition">
              ⚙️
           </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Targeting */}
        <div className="lg:col-span-7 space-y-6">
            
            {/* Folder Targets */}
            <section className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800/80 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] rounded-full point-events-none" />
                <h2 className="text-lg font-semibold text-white mb-4">I/O Targeting</h2>
                <div className="space-y-4 relative z-10">
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Source Folder</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={sourceDir}
                                onChange={(e) => setSourceDir(e.target.value)}
                                placeholder="e.g. C:\Images\Inputs" 
                                className="flex-1 bg-neutral-950/50 border border-neutral-800/80 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                            />
                            <button onClick={handleBrowseSource} className="px-5 font-semibold text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors border border-neutral-700 uppercase tracking-wider">Browse</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Destination Folder</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={outputDir}
                                onChange={(e) => setOutputDir(e.target.value)}
                                placeholder="e.g. C:\Images\Outputs" 
                                className="flex-1 bg-neutral-950/50 border border-neutral-800/80 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                            />
                            <button onClick={handleBrowseOutput} className="px-5 font-semibold text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors border border-neutral-700 uppercase tracking-wider">Browse</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scale Slider */}
            <section className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800/80 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[80px] rounded-full point-events-none" />
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Upscale Factor</h2>
                        <p className="text-xs text-neutral-500 mt-1">Select the geometric multiplier.</p>
                    </div>
                    <span className="text-indigo-400 font-mono text-xl tabular-nums font-bold">{scaleFactor}x</span>
                </div>
                <div className="flex gap-2 relative z-10">
                    {[1, 2, 4, 8, 16].map((sf) => (
                        <button 
                            key={sf}
                            onClick={() => setScaleFactor(sf)}
                            className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${scaleFactor === sf ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/50' : 'bg-neutral-800/50 text-neutral-400 border border-neutral-800 hover:bg-neutral-700/50'}`}
                        >
                            {sf}x
                        </button>
                    ))}
                </div>
            </section>

            {/* GPU Slider */}
            <section className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800/80 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">GPU Power Limit</h2>
                        <p className="text-xs text-neutral-500 mt-1">Limits max PyTorch VRAM allocation footprint.</p>
                    </div>
                    <span className="text-purple-400 font-mono text-xl tabular-nums font-bold">{gpuLimit}%</span>
                </div>
                <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="5"
                    value={gpuLimit} 
                    onChange={(e) => setGpuLimit(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500" 
                />
                <div className="flex justify-between text-xs mt-2 font-mono">
                    <span className="text-neutral-600">10% (Safe)</span>
                    <span className="text-emerald-500 font-medium tracking-wide">80% (Recommended)</span>
                    <span className="text-red-500/70">100% (Max)</span>
                </div>
            </section>
        </div>

        {/* Right Column: Execution & Models */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
            
            {/* Model Selection */}
            <section className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 flex-1 flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-white">AI Model</h2>
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                    <button
                        onClick={() => setModel('ESRGAN')}
                        className={`w-full p-4 rounded-xl text-left border-[1.5px] transition-all ${model === 'ESRGAN' ? 'border-indigo-500 bg-indigo-500/10 shadow-[inset_0px_0px_20px_rgba(99,102,241,0.1)]' : 'border-transparent bg-neutral-800/50 hover:bg-neutral-700/50'}`}
                    >
                        <div className="flex justify-between items-center">
                            <div className="font-semibold text-white text-base">Real-ESRGAN</div>
                            {model === 'ESRGAN' && <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">Extremely fast multi-pass upscaler. Best for general use, illustrations, and 2D art.</div>
                    </button>
                    <button
                        onClick={() => setModel('Diffusion')}
                        className={`w-full p-4 rounded-xl text-left border-[1.5px] transition-all ${model === 'Diffusion' ? 'border-purple-500 bg-purple-500/10 shadow-[inset_0px_0px_20px_rgba(168,85,247,0.1)]' : 'border-transparent bg-neutral-800/50 hover:bg-neutral-700/50'}`}
                    >
                        <div className="flex justify-between items-center">
                            <div className="font-semibold text-white text-base">Stable Diffusion</div>
                            {model === 'Diffusion' && <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">Slower diffusion generator. Exceptional for highly degraded photographic restoration.</div>
                    </button>
                </div>
            </section>

            {/* Execution Stats Container */}
            <section className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 relative shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent pointer-events-none" />
                {progress.total > 0 && (
                    <div className="mb-6 space-y-3 relative z-10">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-indigo-400 animate-pulse flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                Running Batch Queue
                            </span>
                            <span className="text-white bg-neutral-800 px-2 py-1 rounded border border-neutral-700 font-mono">
                                {progress.current} / {progress.total}
                            </span>
                        </div>
                        <div className="h-3 bg-neutral-900/50 border border-neutral-800 rounded-full overflow-hidden relative shadow-inner">
                            <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-neutral-500 text-right font-mono text-purple-400/80">Sub-File Parse: {progress.percentage.toFixed(1)}%</p>
                    </div>
                )}
                
                <button 
                    onClick={handleStart}
                    disabled={!sourceDir || !outputDir || isProcessing}
                    className="relative z-10 w-full py-4 rounded-xl font-bold text-white uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:brightness-110 active:scale-[0.98] border border-white/10"
                >
                    {isProcessing ? 'Processing Queue...' : 'Start Upscale'}
                </button>
            </section>
        </div>
      </div>

      {/* Settings Modal Setup */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                    <h3 className="text-xl font-bold text-white">Advanced Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-neutral-500 hover:text-white transition w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center">✕</button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-sm font-medium text-neutral-300">Default Output Format</label>
                        <select className="w-full mt-2 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition">
                            <option value="png">PNG (Lossless & High Quality)</option>
                            <option value="jpg">JPG (Smaller Space)</option>
                            <option value="webp">WEBP (Modern Compression)</option>
                        </select>
                    </div>
                    <div className="pt-4 border-t border-neutral-800">
                        <button className="w-full py-3 bg-red-500/10 text-red-500 hover:bg-red-500 text-sm font-bold transition-all border border-red-500/20 hover:text-white rounded-lg group flex items-center justify-center gap-2">
                            <span>Wipe PyTorch Cache (.pt)</span>
                        </button>
                        <p className="text-center text-xs text-neutral-600 mt-2">Clears unmapped tensor memory hooks globally.</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </main>
  );
}
