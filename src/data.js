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

// Extra project technologies share the toolkit's icon component.
export const projectTools = {
  "Inertia.js": { icon: "solid fa-arrows-left-right" },
  "Tailwind CSS": { icon: "solid fa-wind" },
  Bootstrap: { icon: "brands fa-bootstrap" },
};
