export const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
export const email = "williamvelasco41@gmail.com";
export const socials = [
  {
    name: "GitHub",
    icon: "brands fa-github",
    url: "https://github.com/williamdoescode",
  },
  {
    name: "LinkedIn",
    icon: "brands fa-linkedin-in",
    url: "https://www.linkedin.com/in/williamlouhvelasco/",
  },
];
export const projects = [
  {
    id: "inventory",
    title: "Inventory System",
    category: "FULL-STACK APPLICATION",
    summary:
      "Bringing stock, reporting, and everyday operations into one organized workspace.",
    description:
      "An inventory management application with custom reporting, stock alerts, and multi-user support. Built to bring complex warehouse operations into a clear, practical workspace.",
    tags: ["Laravel", "Vue.js", "Inertia.js", "MySQL", "Tailwind CSS"],
    images: [2, 3, 4, 5].map((n) => asset(`images/inventory project/${n}.png`)),
  },
  {
    id: "atpeis",
    title: "ATPEIS",
    category: "TRACKING & EVALUATION",
    summary:
      "A clearer way to track assignments and evaluate staff performance.",
    description:
      "Assignment Tracking and Performance Evaluation Information System. An HR and tracking platform designed to organize assignments and support detailed staff performance monitoring.",
    tags: ["PHP", "MySQL", "Bootstrap"],
    images: [3, 4, 5, 1, 2].map((n) => asset(`images/atpeis ${n}.png`)),
  },
];
export const toolkit = [
  {
    title: "Frontend",
    tools: [
      { name: "HTML", icon: "brands fa-html5" },
      { name: "CSS", icon: "brands fa-css3-alt" },
      { name: "JavaScript", icon: "brands fa-js" },
      { name: "Vue.js", icon: "brands fa-vuejs" },
      { name: "React · Learning", icon: "brands fa-react" },
    ],
  },
  {
    title: "Backend",
    tools: [
      { name: "PHP", icon: "brands fa-php" },
      { name: "Laravel", icon: "brands fa-laravel" },
      { name: "Python", icon: "brands fa-python" },
      { name: "MySQL", mark: "my", sub: "SQL" },
      { name: "MS SQL", icon: "solid fa-database" },
    ],
  },
  {
    title: "APIs & integrations",
    tools: [
      { name: "Xero", mark: "xero" },
      { name: "Stripe", icon: "brands fa-stripe-s" },
      { name: "Klaviyo", mark: "K." },
      { name: "Ajax", icon: "solid fa-bolt" },
      { name: "Discord bots", icon: "brands fa-discord" },
    ],
  },
  {
    title: "Tools & deployment",
    tools: [
      { name: "Git", icon: "brands fa-git-alt" },
      { name: "GitHub", icon: "brands fa-github" },
      { name: "cPanel", icon: "brands fa-cpanel" },
      { name: "DigitalOcean", icon: "brands fa-digital-ocean" },
      { name: "GitHub Pages", icon: "solid fa-file-code" },
    ],
  },
];

// Entertainment playlist. Each track needs a title + artist (used to find
// synced lyrics on LRCLIB) and a cover (its colors tint the page).
// Sources, pick one per track (if several are set: audio, then youtube, then spotify):
//   youtube: "<video id>"           full song for every visitor, no login. The id
//            is the part after watch?v= in the link. Pick the artist's official
//            "(Official Audio)" or "- Topic" upload: music videos often have
//            intros or skits that push the lyrics out of sync.
//   audio:   "music/song.mp3"       a file in public/music/. Only for music you
//            own or have the rights to share.
//   spotify: "spotify:track:<id>"   Spotify's embed. Full songs only for visitors
//            logged in to Spotify; everyone else hears a 30-second preview.
// Optional: lyrics: "music/song.lrc" (your own synced lyrics),
//           color: "hsl(200 70% 60%)" (skip the automatic cover color),
//           lyricsOffset: 300 (ms; positive shows lines earlier, negative later).
export const playlist = [
  {
    id: "blinding-lights",
    title: "Blinding Lights",
    artist: "The Weeknd",
    youtube: "fHI8X4OXluQ", // TheWeekndVEVO, Official Audio
    cover: "https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36",
  },
  {
    id: "die-with-a-smile",
    title: "Die With A Smile",
    artist: "Lady Gaga, Bruno Mars",
    youtube: "PfH7jq_uSCM", // LadyGagaVEVO, Audio
    cover: "https://i.scdn.co/image/ab67616d00001e0282ea2e9e1858aa012c57cd45",
  },
  {
    id: "as-it-was",
    title: "As It Was",
    artist: "Harry Styles",
    youtube: "V1Z586zoeeE", // HarryStylesVEVO, Audio
    cover: "https://i.scdn.co/image/ab67616d00001e0282ce362511fb3d9dda6578ee",
  },
  {
    id: "espresso",
    title: "Espresso",
    artist: "Sabrina Carpenter",
    youtube: "51zjlMhdSTE", // Sabrina Carpenter, Official Audio
    cover: "https://i.scdn.co/image/ab67616d00001e02659cd4673230913b3918e0d5",
  },
];

// Extra project technologies share the toolkit's icon component.
export const projectTools = {
  "Inertia.js": { icon: "solid fa-arrows-left-right" },
  "Tailwind CSS": { icon: "solid fa-wind" },
  Bootstrap: { icon: "brands fa-bootstrap" },
};
