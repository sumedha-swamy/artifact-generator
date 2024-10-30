/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // Note: includes all files in app directory
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // If you have pages directory
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // If you have components directory
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // If you have src directory
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
        secondary: {
          DEFAULT: '#6b7280',
          dark: '#4b5563',
        },
      },
    },
  },
  plugins: [],
}