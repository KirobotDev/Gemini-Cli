#!/usr/bin/env node
/**
 * Minimal HTTP server to expose the bundled Gemini CLI as a web endpoint.
 * - GET / serves a tiny web UI
 * - POST /api/prompt with JSON { prompt: string } invokes the bundled CLI and returns the output
 * - https://kirosb.fr For Dev Project
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundlePath = join(__dirname, '..', 'bundle', 'gemini.js');

const DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function serveIndex(res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gemini CLI Web</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    @layer utilities {
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slide-in-from-top-4 {
        from {
          transform: translateY(-1rem);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes slide-in-from-bottom-4 {
        from {
          transform: translateY(1rem);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .animate-in {
        animation-fill-mode: both;
      }

      .fade-in {
        animation-name: fade-in;
      }

      .slide-in-from-top-4 {
        animation-name: slide-in-from-top-4;
      }

      .slide-in-from-bottom-4 {
        animation-name: slide-in-from-bottom-4;
      }

      .duration-300 {
        animation-duration: 300ms;
      }

      .duration-500 {
        animation-duration: 500ms;
      }
    }

    /* Scrollbar styling */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    .dark ::-webkit-scrollbar-track {
      background: #2d3748;
    }
    .dark ::-webkit-scrollbar-thumb {
      background: #a0aec0;
    }

    /* Gradient text for header */
    .gradient-text {
      background: linear-gradient(to right, #1e293b, #1e40af, #1e293b);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    /* KBD styling */
    kbd {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background-color: #f1f5f9;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.75rem;
      color: #475569;
    }
    .dark kbd {
      background-color: #374151;
      border-color: #4b5563;
      color: #9ca3af;
    }

    /* Code block styling */
    .code-block {
      position: relative;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    .copy-button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .code-block:hover .copy-button {
      opacity: 1;
    }
    .copy-button.copied {
      background-color: #10b981;
    }
    .copy-button.copied svg {
      display: none;
    }
    .copy-button.copied::after {
      content: 'Copied!';
      color: white;
      font-size: 0.75rem;
    }
  </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 transition-all">
  <div class="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>

  <div class="relative z-10 min-h-screen flex flex-col">
    <header class="px-6 py-8 md:py-12 animate-in slide-in-from-top-4 duration-300">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center gap-3 mb-3">
          <div class="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 4.5a.75.75 0 01.53.22l1.5 1.5a.75.75 0 11-1.06 1.06l-1.5-1.5a.75.75 0 01.53-1.28zM16.5 4.5a.75.75 0 01.53 1.28l-1.5 1.5a.75.75 0 01-1.06-1.06l1.5-1.5a.75.75 0 01.53-.22zM21 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25a.75.75 0 01.75.75zM7.5 19.5a.75.75 0 01-.53-.22l-1.5-1.5a.75.75 0 011.06-1.06l1.5 1.5a.75.75 0 01-.53 1.28zM16.5 19.5a.75.75 0 01-.53-1.28l1.5-1.5a.75.75 0 011.06 1.06l-1.5 1.5a.75.75 0 01-.53.22zM12 21.75a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM12 15a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold gradient-text">Gemini CLI</h1>
          <button id="themeToggle" class="ml-auto p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" aria-label="Toggle theme">
            <svg class="w-6 h-6 text-gray-800 dark:text-gray-100" fill="currentColor" viewBox="0 0 20 20">
              <path id="sun" class="block dark:hidden" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.586 2.414a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zM17 10a1 1 0 110 2h-1a1 1 0 110-2h1zm-2.414 4.586a1 1 0 011.414-1.414l.707.707a1 1 0 11-1.414 1.414l-.707-.707zM10 17a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.414 14.586a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zM4 10a1 1 0 110 2H3a1 1 0 110-2h1zm1.414-5.414a1 1 0 011.414-1.414l.707.707a1 1 0 11-1.414 1.414l-.707-.707zM10 15a5 5 0 100-10 5 5 0 000 10z"></path>
              <path id="moon" class="hidden dark:block" d="M12.458 2.826a6 6 0 00-7.632 7.632c.884 1.545 2.3 2.705 4.042 3.142a6 6 0 003.59-10.774z"></path>
            </svg>
          </button>
        </div>
        <p class="text-slate-600 dark:text-slate-300 text-lg ml-14">Gemini Ai Web Ui By Xql.dev</p>
      </div>
    </header>

    <main class="flex-1 px-6 pb-12">
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-gray-700/50 p-6 md:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 animate-in fade-in duration-500">
          <label for="prompt" class="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Your Prompt</label>
          <textarea
            id="prompt"
            placeholder="Ask anything... Try Cmd/Ctrl + Enter to run"
            class="w-full h-40 px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder-slate-400 animate-in slide-in-from-bottom-4 duration-300"
          >Summarize the advantages of TypeScript over plain JavaScript.</textarea>
          <div class="flex items-center justify-between mt-4">
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Press <kbd>⌘</kbd> + <kbd>Enter</kbd> to run
            </p>
            <button
              id="run"
              class="group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-bottom-4 duration-300"
            >
              <span class="flex items-center gap-2">
                <svg id="run-icon" class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 3.5a.5.5 0 01.5-.5h6.793l4.147-4.146a.5.5 0 01.707 0l1.414 1.414a.5.5 0 010 .707L12.414 5H16.5a.5.5 0 01.5.5v11a.5.5 0 01-.5.5h-13a.5.5 0 01-.5-.5v-13z"></path>
                </svg>
                <svg id="loading-icon" class="w-4 h-4 animate-spin hidden" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3a7 7 0 00-7 7c0 1.48.463 2.856 1.25 3.99a1 1 0 001.73-1C5.36 12.33 5 11.21 5 10a5 5 0 0110 0c0 1.21-.36 2.33-.98 3.01a1 1 0 001.73 1A7 7 0 0010 3z"></path>
                </svg>
                <span id="run-text">Run</span>
              </span>
            </button>
          </div>
        </div>

        <div id="error" class="hidden bg-red-50/80 dark:bg-red-900/80 backdrop-blur-sm border border-red-200 dark:border-red-700 rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 110-12 6 6 0 010 12zm0-9a1 1 0 011 1v4a1 1 0 01-2 0V8a1 1 0 011-1zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
            </svg>
            <div>
              <h3 class="font-semibold text-red-900 dark:text-red-200 mb-1">Error</h3>
              <p id="error-text" class="text-red-700 dark:text-red-300 text-sm"></p>
            </div>
          </div>
        </div>

        <div id="output" class="hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-gray-700/50 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <div class="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            Response
          </h3>
          <div class="code-block bg-slate-50 dark:bg-gray-700 rounded-xl p-5 border border-slate-200 dark:border-gray-600 max-h-[500px] overflow-auto">
            <button id="copy-button" class="copy-button px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-xs font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-all">
              <svg class="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 2a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-2V2H8zm2 2h4v10h-4V4zm-2 2H6v8a1 1 0 001 1h6v2a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h2v2z"></path>
              </svg>
              Copy
            </button>
            <pre id="output-text" class="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed"></pre>
          </div>
        </div>

        <div id="placeholder" class="text-center py-12 animate-in fade-in duration-500">
          <div class="inline-flex p-4 bg-slate-100/50 dark:bg-gray-700/50 rounded-2xl mb-4">
            <svg class="w-8 h-8 text-slate-400 dark:text-slate-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 4.5a.75.75 0 01.53.22l1.5 1.5a.75.75 0 11-1.06 1.06l-1.5-1.5a.75.75 0 01.53-1.28zM16.5 4.5a.75.75 0 01.53 1.28l-1.5 1.5a.75.75 0 01-1.06-1.06l1.5-1.5a.75.75 0 01.53-.22zM21 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25a.75.75 0 01.75.75zM7.5 19.5a.75.75 0 01-.53-.22l-1.5-1.5a.75.75 0 011.06-1.06l1.5 1.5a.75.75 0 01-.53 1.28zM16.5 19.5a.75.75 0 01-.53-1.28l1.5-1.5a.75.75 0 011.06 1.06l-1.5 1.5a.75.75 0 01-.53.22zM12 21.75a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM12 15a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          <p class="text-slate-500 dark:text-slate-400">Enter a prompt above and click Run to get started</p>
        </div>
      </div>
    </main>

    <footer class="px-6 py-6 text-center text-sm text-slate-500 dark:text-slate-400 animate-in fade-in duration-500">
      <p>Powered by Gemini AI · Built with modern web technologies</p>
    </footer>
  </div>

  <script>
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    // Load saved theme
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    // Run button and prompt handling
    const promptInput = document.getElementById('prompt');
    const runButton = document.getElementById('run');
    const runIcon = document.getElementById('run-icon');
    const loadingIcon = document.getElementById('loading-icon');
    const runText = document.getElementById('run-text');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error-text');
    const outputDiv = document.getElementById('output');
    const outputText = document.getElementById('output-text');
    const placeholder = document.getElementById('placeholder');
    const copyButton = document.getElementById('copy-button');

    runButton.addEventListener('click', async () => {
      if (!promptInput.value.trim() || runButton.disabled) return;

      runButton.disabled = true;
      runIcon.classList.add('hidden');
      loadingIcon.classList.remove('hidden');
      runText.textContent = 'Running...';
      errorDiv.classList.add('hidden');
      outputDiv.classList.add('hidden');
      placeholder.classList.add('hidden');

      try {
        const res = await fetch('/api/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptInput.value }),
        });
        const json = await res.json();
        if (res.ok) {
          outputText.textContent = json.output || json.stdout || JSON.stringify(json, null, 2);
          outputDiv.classList.remove('hidden');
        } else {
          errorText.textContent = json.error || 'An error occurred';
          errorDiv.classList.remove('hidden');
        }
      } catch (e) {
        errorText.textContent = 'Request failed: ' + e;
        errorDiv.classList.remove('hidden');
      } finally {
        runButton.disabled = false;
        runIcon.classList.remove('hidden');
        loadingIcon.classList.add('hidden');
        runText.textContent = 'Run';
      }
    });

    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        runButton.click();
      }
    });

    // Copy to clipboard functionality
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(outputText.textContent).then(() => {
        copyButton.classList.add('copied');
        setTimeout(() => {
          copyButton.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        errorText.textContent = 'Failed to copy to clipboard';
        errorDiv.classList.remove('hidden');
      });
    });
  </script>
</body>
</html>`);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function invokeCli(prompt, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const command = process.execPath;
    const args = [bundlePath, '--yolo', '--prompt', prompt];
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    const killTimer = setTimeout(() => {
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (b) => (stdout += b.toString()));
    child.stderr.on('data', (b) => (stderr += b.toString()));

    child.on('close', (code) => {
      clearTimeout(killTimer);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (err) => {
      clearTimeout(killTimer);
      reject(err);
    });
  });
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      return res.end();
    }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      return serveIndex(res);
    }

    if (req.method === 'POST' && req.url === '/api/prompt') {
      const body = await parseJsonBody(req);
      if (!body || typeof body.prompt !== 'string') {
        return sendJson(res, 400, { error: 'Missing prompt in request body' });
      }

      try {
        const result = await invokeCli(body.prompt, Number(process.env.CLI_TIMEOUT_MS || 30000));
        return sendJson(res, 200, { output: result.stdout, stderr: result.stderr });
      } catch (e) {
        return sendJson(res, 500, { error: String(e) });
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (e) {
    sendJson(res, 500, { error: String(e) });
  }
});

const portArgIndex = process.argv.indexOf('--port');
let port = DEFAULT_PORT;
if (portArgIndex !== -1 && process.argv.length > portArgIndex + 1) {
  const p = parseInt(process.argv[portArgIndex + 1], 10);
  if (!Number.isNaN(p)) port = p;
}

server.listen(port, () => {
  console.log(`Gemini CLI web server listening on http://localhost:${port}/`);
});
