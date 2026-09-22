import './style.css';

type Mode = 'comecar' | 'investigar' | 'aprender' | 'especialista';

const frame = document.querySelector<HTMLIFrameElement>('#appFrame')!;
const workspace = document.querySelector<HTMLElement>('#workspace')!;
const status = document.querySelector<HTMLElement>('#status')!;
const title = document.querySelector<HTMLElement>('#modeTitle')!;
const close = document.querySelector<HTMLButtonElement>('#closeApp')!;
const prepareOffline = document.querySelector<HTMLButtonElement>('#prepareOffline')!;

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

let serviceRegistration: Promise<ServiceWorkerRegistration | null> = Promise.resolve(null);
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  serviceRegistration = navigator.serviceWorker.register('./service-worker.js', {
    scope: './',
    updateViaCache: 'none'
  }).then(() => navigator.serviceWorker.ready).catch(() => null);
}
navigator.serviceWorker?.addEventListener('message', event => {
  const message = event.data as {type?:string; id?:string; count?:number; total?:number; errors?:string[]} | null;
  if (!message || message.id !== prepareOffline.dataset.job) return;
  if (message.type === 'OA_OFFLINE_PROGRESS') {
    status.textContent = 'Preparando offline: ' + message.count + '/' + message.total +
      ((message.errors?.length || 0) ? ' · falhas: ' + message.errors!.length : '');
  }
  if (message.type === 'OA_OFFLINE_DONE') {
    prepareOffline.disabled = false;
    delete prepareOffline.dataset.job;
    status.textContent = message.errors?.length
      ? 'Preparação offline incompleta: ' + message.errors.join('; ')
      : 'Offline PREPARADO: ' + message.count + '/' + message.total + ' arquivos públicos verificados.';
  }
});
prepareOffline.addEventListener('click', async () => {
  prepareOffline.disabled = true;
  const registration = await serviceRegistration;
  const worker = registration?.active || registration?.waiting || registration?.installing;
  if (!worker) {
    prepareOffline.disabled = false;
    status.textContent = 'Service Worker indisponível neste contexto.';
    return;
  }
  const id = crypto.randomUUID?.() || String(Date.now());
  prepareOffline.dataset.job = id;
  status.textContent = 'Iniciando preparação offline…';
  worker.postMessage({type:'OA_OFFLINE_PREPARE',id});
});
