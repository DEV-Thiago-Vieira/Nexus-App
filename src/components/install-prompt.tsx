"use client";

import { useState, useSyncExternalStore } from "react";

/** Evento do Chrome/Android que permite abrir o diálogo de instalação. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "nexus:install-dismissed";
const DISMISS_DAYS = 14;

// O evento pode disparar antes do React montar: captura já no carregamento do módulo.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // guarda o evento para o nosso botão
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => clearDeferred());
}

function clearDeferred() {
  deferred = null;
  notify();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function useDeferredPrompt() {
  return useSyncExternalStore(subscribe, () => deferred, () => null);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function isMobile() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/** Convite para instalar o app; só no celular e só se ainda não estiver instalado. Renderizar apenas no cliente. */
export function InstallPrompt() {
  const prompt = useDeferredPrompt();
  const [hidden, setHidden] = useState(() => !isMobile() || isStandalone() || recentlyDismissed());
  const ios = isIOS();

  if (hidden || (!prompt && !ios)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // sem armazenamento: só esconde nesta sessão
    }
    setHidden(true);
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    clearDeferred(); // o evento só pode ser usado uma vez
    if (outcome === "accepted") setHidden(true);
  };

  return (
    <section
      aria-label="Instalar o app"
      className="flex items-start gap-3.5 rounded-[1.25rem] bg-white p-4 ring-1 ring-stone-200/70 motion-safe:animate-rise"
    >
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-600 text-white shadow-sm"
      >
        <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.6 1.2c.3 2.2-.6 3.3-1.6 4.4C6 6.7 5 7.8 5 9.6c0 .9.3 1.7.9 2.3-.1-1.6.8-2.6 1.6-3.4.5.9 1.6 1.6 1.6 3.1 0 .4-.1.8-.3 1.1A3.6 3.6 0 0 0 12 9.4c0-3.7-2.4-5.7-3.4-8.2Z" />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold tracking-tight text-stone-900">Instale o Nexus</p>
        {prompt ? (
          <p className="mt-0.5 text-[13px] leading-relaxed text-stone-500">
            Abra direto da tela inicial, em tela cheia, como um aplicativo.
          </p>
        ) : (
          <p className="mt-0.5 text-[13px] leading-relaxed text-stone-500">
            No Safari, toque em <ShareIcon /> <span className="font-semibold text-stone-700">Compartilhar</span> e depois
            em <span className="font-semibold text-stone-700">Adicionar à Tela de Início</span>.
          </p>
        )}
        <div className="mt-3 flex gap-2">
          {prompt && (
            <button
              type="button"
              onClick={install}
              className="h-10 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-700 active:scale-95"
            >
              Instalar
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="h-10 rounded-xl px-3 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
          >
            {prompt ? "Agora não" : "Entendi"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline -translate-y-px text-blue-500"
    >
      <path d="M8 10V1.5M5 4.5l3-3 3 3M5.5 7H4a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1.5" />
    </svg>
  );
}
