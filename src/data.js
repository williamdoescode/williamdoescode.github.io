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
// Covers come from Apple Music; duration (ms) helps pick the matching lyrics.
const appleCover = (path) =>
  `https://is1-ssl.mzstatic.com/image/thumb/${path}/600x600bb.jpg`;

export const playlist = [
  {
    id: "blah-blah",
    title: "Blah Blah",
    artist: "Joji",
    youtube: "g8SQa3icsj4", // Joji
    duration: 162000,
    cover: appleCover(
      "Music211/v4/70/9c/53/709c53a0-693c-8644-9480-232da0197dfa/00823375199489_Cover.jpg",
    ),
  },
  {
    id: "past-wont-leave-my-bed",
    title: "Past Won't Leave My Bed",
    artist: "Joji",
    youtube: "acA8Rr3gEco", // Joji, Official Video
    duration: 166000,
    cover: appleCover(
      "Music221/v4/58/1b/85/581b8559-1868-e64c-c796-b117bb417dcc/198704821745_Cover.jpg",
    ),
  },
  {
    id: "love-you-less",
    title: "LOVE YOU LESS",
    artist: "Joji",
    youtube: "ylFHA2hQPn0", // Joji, 360° Visualizer
    duration: 201000,
    cover: appleCover(
      "Music221/v4/58/1b/85/581b8559-1868-e64c-c796-b117bb417dcc/198704821745_Cover.jpg",
    ),
  },
  {
    id: "rearrange-my-world",
    title: "Rearrange My World",
    artist: "Daniel Caesar, Rex Orange County",
    youtube: "mZOf5_rIfK4", // DanielCaesarVEVO, Official Audio
    duration: 229000,
    cover: appleCover(
      "Music211/v4/b1/1a/02/b11a024f-9da5-3304-2a42-a215e50ff909/25UMGIM11252.rgb.jpg",
    ),
  },
  {
    id: "angel",
    title: "ANGEL",
    artist: "keshi",
    youtube: "nVLfZmVpVOI", // keshiVEVO, Visualizer
    duration: 247000,
    cover: appleCover(
      "Music126/v4/63/05/ff/6305ff3d-7399-976f-c853-6b7e62ff2314/22UMGIM07344.rgb.jpg",
    ),
  },
];

// Extra project technologies share the toolkit's icon component.
export const projectTools = {
  "Inertia.js": { icon: "solid fa-arrows-left-right" },
  "Tailwind CSS": { icon: "solid fa-wind" },
  Bootstrap: { icon: "brands fa-bootstrap" },
};
