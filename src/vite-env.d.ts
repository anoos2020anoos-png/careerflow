/// <reference types="vite/client" />

// Brings in Vite's ambient declarations: side-effect CSS imports, asset
// imports and `import.meta.env`. Without this, `import '@/index.css'` in
// `main.tsx` has no type declaration and `tsc` fails the build.
