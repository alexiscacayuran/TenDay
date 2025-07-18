import express from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const router = express.Router();

// Your actual entry file — adjust if needed
const entryFilePath = path.resolve('server/server.js'); // Absolute path to entry file
const entryFile = path.relative(process.cwd(), entryFilePath); // Relative from root for node command

// GET current OS-level token
router.get('/', (req, res) => {
  res.json({ token: process.env.A_TOKEN || '' });
});

// PATCH to update the OS-level token and restart app
router.patch('/', (req, res) => {
  const newToken = req.body.token?.trim();
  if (!newToken) return res.status(400).json({ message: 'Token is required' });

  const platform = os.platform(); // 'linux' | 'win32'
  let restartCommand = '';

  if (platform === 'linux') {
    // Linux (tmux) — save to ~/.bashrc and restart
    updateBashrcEnvVar('A_TOKEN', newToken);

    restartCommand = `
      tmux send-keys -t tanawph C-c &&
      tmux send-keys -t tanawph "cd ${process.cwd()} && source ~/.bashrc && node ${entryFile}" Enter
    `;
  } else if (platform === 'win32') {
    // Windows — update with setx, then restart in new cmd
    restartCommand = `
      setx A_TOKEN "${newToken}" /M &&
      taskkill /F /IM node.exe &&
      start cmd /k "cd /d ${process.cwd()} && node ${entryFile}"
    `;
  } else {
    return res.status(500).json({ message: 'Unsupported platform' });
  }

  exec(restartCommand, (err, stdout, stderr) => {
    if (err) {
      console.error('Restart error:', err);
      return res.status(500).json({ message: 'Failed to restart app', error: stderr });
    }

    console.log(`✅ A_TOKEN updated to "${newToken}" and app restarted`);
    res.json({ message: 'Token updated and app restarted' });
  });
});

// Helper to persist A_TOKEN in ~/.bashrc
function updateBashrcEnvVar(key, value) {
  const bashrcPath = path.join(os.homedir(), '.bashrc');
  const exportLine = `export ${key}='${value}'`;
  const regex = new RegExp(`^export\\s+${key}=.*$`, 'm');

  let content = fs.existsSync(bashrcPath) ? fs.readFileSync(bashrcPath, 'utf8') : '';

  if (regex.test(content)) {
    content = content.replace(regex, exportLine);
  } else {
    content += `\n${exportLine}`;
  }

  fs.writeFileSync(bashrcPath, content);
}

export default router;
