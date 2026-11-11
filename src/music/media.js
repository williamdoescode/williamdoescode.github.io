import { asset } from "../data.js";

// Covers, audio, and .lrc files can be full URLs or paths inside public/.
export const mediaUrl = (path) =>
  /^https?:\/\//.test(path) ? path : asset(path);
