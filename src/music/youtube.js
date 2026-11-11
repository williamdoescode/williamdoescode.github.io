// YouTube's IFrame Player API: full songs for every visitor, no login.
// The player must stay visible (YouTube's terms), so it shows in the panel.
let api;

export function loadYouTubeApi() {
  api ??= new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      api = null;
      script.remove();
      reject(new Error("YouTube could not load"));
    };
    document.head.append(script);
  });
  return api;
}
