const colors = require('tailwindcss/colors')
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    colors:{
      ...colors,
      "h-bg":colors['slate']['900'],
      "h-text":colors['gray']['200'],
      "h-hover-text":colors['sky']['400']
    }
  },
  plugins: [],
}