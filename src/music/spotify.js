// Spotify's iFrame API: no client secret or login flow on this static site.
// Visitors signed in to Spotify hear full songs; everyone else gets previews.
let api;

export function loadSpotifyApi() {
  api ??= new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      api = null;
      script.remove();
      reject(new Error("Spotify could not load"));
    };
    document.head.append(script);
  });
  return api;
}
