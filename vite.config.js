import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
    plugins: [
        preact(),
    ],
    build: {
        outDir: "dist/out",
        assetsDir: ".",
        emptyOutDir: true,
        copyPublicDir: true,
        //minify: 'terser',
    },
})
