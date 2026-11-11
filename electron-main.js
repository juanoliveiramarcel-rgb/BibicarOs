import { app, BrowserWindow, shell, Menu, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Identificação nativa no sistema operacional
app.setName('Bibicar OS');
if (process.platform === 'win32') {
  app.setAppUserModelId('com.bibicar.os');
}

// Previne múltiplas instâncias concorrentes acessando o mesmo localStorage
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow = null;

function resolveAppIcon() {
  const distIcon = path.join(__dirname, 'dist', 'icon.png');
  const publicIcon = path.join(__dirname, 'public', 'icon.png');
  if (fs.existsSync(distIcon)) return distIcon;
  if (fs.existsSync(publicIcon)) return publicIcon;
  return undefined;
}

function createWindow() {
  const iconPath = resolveAppIcon();

  mainWindow = new BrowserWindow({
    title: 'Bibicar OS - Gestão de Oficina Mecânica',
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0f172a',
    autoHideMenuBar: false,
    icon: iconPath,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Trava o título padrão do aplicativo
  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  // Redireciona links externos (WhatsApp, etc.) para o navegador padrão do sistema operacional
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isAppFile = url.startsWith('file://') && url.includes('dist');
    if (!isAppFile && (url.startsWith('http:') || url.startsWith('https:'))) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Menu nativo profissional para desktop
  const menuTemplate = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Imprimir Documento / OS',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.print(),
        },
        { type: 'separator' },
        {
          label: 'Recarregar',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.reload(),
        },
        {
          label: 'Sair do Sistema',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'resetZoom', label: 'Tamanho Padrão (100%)' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Alternar Tela Cheia (F11)' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre o Bibicar OS',
          click: () => {
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Bibicar OS',
                message: 'Bibicar OS - Gestão de Oficina Mecânica',
                detail: 'Versão 2.0 Desktop Offline-First\nTodos os dados são armazenados localmente e com segurança.',
              });
            }
          },
        },
      ],
    },
  ];

  if (process.env.NODE_ENV === 'development') {
    menuTemplate.push({
      label: 'Desenvolvedor',
      submenu: [{ role: 'toggleDevTools', label: 'Ferramentas do Desenvolvedor' }],
    });
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Carrega os arquivos estáticos de produção gerados pelo Vite
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error('[Bibicar Electron] Falha ao carregar dist/index.html:', err);
  });
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

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
}
