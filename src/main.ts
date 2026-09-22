import './style.css';

type Mode = 'comecar' | 'investigar' | 'aprender' | 'especialista';

const frame = document.querySelector<HTMLIFrameElement>('#appFrame')!;
const workspace = document.querySelector<HTMLElement>('#workspace')!;
const status = document.querySelector<HTMLElement>('#status')!;
const title = document.querySelector<HTMLElement>('#modeTitle')!;
const close = document.querySelector<HTMLButtonElement>('#closeApp')!;

const modes: Record<Mode, {tab: string; label: string}> = {
  comecar: {tab: 'dados', label: 'Começar'},
  investigar: {tab: 'analise', label: 'Investigar'},
  aprender: {tab: 'metodo', label: 'Aprender'},
  especialista: {tab: 'mapa', label: 'Especialista'}
};

let loaded = false;
let pending: Mode | null = null;

function selectInside(mode: Mode) {
  const doc = frame.contentDocument;
  if (!doc) return;
  const tab = modes[mode].tab;
  const button = doc.querySelector<HTMLButtonElement>('[data-tab="' + tab + '"]');
  if (button) button.click();
  doc.getElementById(tab)?.scrollIntoView({block: 'start'});
}

function open(mode: Mode) {
  pending = mode;
  title.textContent = 'Modo ' + modes[mode].label;
  workspace.hidden = false;
  status.textContent = loaded
    ? 'Aplicativo já carregado neste dispositivo.'
    : 'Carregando o aplicativo completo sob demanda…';
  if (!loaded) {
    frame.src = './app.html';
    loaded = true;
  } else {
    selectInside(mode);
  }
  workspace.scrollIntoView({behavior: 'smooth', block: 'start'});
}

frame.addEventListener('load', () => {
  status.textContent = 'Aplicativo completo carregado. Os próximos modos reutilizam esta sessão.';
  if (pending) selectInside(pending);
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
  button.addEventListener('click', () => open(button.dataset.mode as Mode));
}

close.addEventListener('click', () => {
  workspace.hidden = true;
  status.textContent = 'Aplicativo fechado visualmente; a sessão permanece carregada para reabertura rápida.';
  document.querySelector<HTMLButtonElement>('[data-mode]')?.focus();
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./service-worker.js', {
    scope: './',
    updateViaCache: 'none'
  }).catch(() => {});
}
