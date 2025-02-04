const tailwindcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');
module.exports = {
    plugins: [
        autoprefixer,
        tailwindcss("./tailwind.config.js")
    ],
};
