const postcssImport = require("postcss-import");
const tailwindcss = require("tailwindcss");
const nesting = require("tailwindcss/nesting");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const presetEnv = require("postcss-preset-env")({
  stage: 1,
  features: {
    // tailwind plugin handles
    "nesting-rules": false,
  },
});

const mode = process.env.NODE_ENV;
const dev = mode === "development";

const config = {
  plugins: [
    postcssImport,
    nesting,
    //Some plugins, like tailwindcss/nesting, need to run before Tailwind,
    tailwindcss,
    //But others, like autoprefixer, need to run after,
    autoprefixer,
    presetEnv,
    !dev &&
      cssnano({
        preset: "default",
      }),
  ],
};

module.exports = config;
