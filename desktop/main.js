const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let engineProcess;

function startEngine() {
    const enginePath = path.join(__dirname, '..', 'engine', 'main.py');
    
    // Spawn FastAPI server
    engineProcess = spawn('python', [enginePath], {
        cwd: path.dirname(enginePath),
    });

    engineProcess.stdout.on('data', (data) => console.log(`Engine: ${data.toString().trim()}`));
    engineProcess.stderr.on('data', (data) => console.error(`Engine Error: ${data.toString().trim()}`));

    engineProcess.on('close', (code) => {
        console.log(`Engine process exited with code ${code}`);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        title: 'Scaloop',
        width: 1280,
        height: 800,
        backgroundColor: '#171717', // Neutral-900 equivalent to match dark mode UI
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // In local development, loading the dev server. 
    // In production, load Next.js static export.
    mainWindow.loadURL('http://localhost:3000').catch((err) => {
        console.error('Frontend UI not reachable:', err);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    startEngine();
    
    // Simplistic delay to allow UI to spin up before showing wrapper window.
    // For robust setups, we'd loop-poll localhost:3000 to ensure connectivity first.
    setTimeout(() => {
        createWindow();
    }, 2000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    // Process Safety: Implement strict teardown logic. 
    // Prevent zombie processes and memory leaks by killing the Python child process.
    if (engineProcess) {
        console.log('Terminating FastAPI engine process gracefully...');
        try {
            engineProcess.kill('SIGTERM');
        } catch (e) {
            console.error('Failed to kill engine process: ', e);
        }
    }
});
