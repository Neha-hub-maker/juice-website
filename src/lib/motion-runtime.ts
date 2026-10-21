type Cleanup = () => void;

/** Let the server-rendered hero paint before downloading animation code. */
export function afterPaint(setup: (cancelled: () => boolean) => Promise<Cleanup | void>): Cleanup {
  let cancelled = false;
  let cleanup: Cleanup | void;
  let secondFrame = 0;
  let idle = 0;
  const launch = () => {
    if (cancelled) return;
    void setup(() => cancelled).then(result => {
      if (cancelled) result?.();
      else cleanup = result;
    }).catch(() => { /* A failed enhancement download leaves the static page usable. */ });
  };
  const firstFrame = requestAnimationFrame(() => {
    secondFrame = requestAnimationFrame(() => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(launch, { timeout: 1000 });
      else launch();
    });
  });
  return () => {
    cancelled = true;
    cancelAnimationFrame(firstFrame);
    cancelAnimationFrame(secondFrame);
    if (idle) window.cancelIdleCallback(idle);
    cleanup?.();
  };
}

export async function loadGsap() {
  return (await import("gsap")).default;
}

export async function loadScrollMotion() {
  const [gsap, { ScrollTrigger }] = await Promise.all([loadGsap(), import("gsap/ScrollTrigger")]);
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}

let subscribers = 0;
let stopWatching: Cleanup | undefined;

/** Share one batched refresh listener across all active ScrollTrigger consumers. */
export function watchScrollLayout(ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger): Cleanup {
  if (subscribers++ === 0) {
    let enabled = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (enabled) ScrollTrigger.refresh(true); }, 80);
    };
    const mediaReady = (event: Event) => {
      if (event.target instanceof HTMLImageElement || event.target instanceof HTMLVideoElement) refresh();
    };
    void document.fonts.ready.then(() => { if (enabled) refresh(); });
    document.fonts.addEventListener("loadingdone", refresh);
    document.addEventListener("load", mediaReady, true);
    document.addEventListener("loadedmetadata", mediaReady, true);
    stopWatching = () => {
      enabled = false;
      clearTimeout(timer);
      document.fonts.removeEventListener("loadingdone", refresh);
      document.removeEventListener("load", mediaReady, true);
      document.removeEventListener("loadedmetadata", mediaReady, true);
    };
  }
  return () => {
    if (--subscribers === 0) { stopWatching?.(); stopWatching = undefined; }
  };
}
