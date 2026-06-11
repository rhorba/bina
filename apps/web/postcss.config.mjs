// Tailwind v4 is a PostCSS plugin. Without this config Next.js never runs
// the `@import "tailwindcss"` in globals.css through Tailwind, so no utility
// classes are generated and the app renders as unstyled HTML.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
