import { defineConfig } from 'vite';
// base './' يجعل الملفات تعمل من أي مسار وداخل تطبيق الأندرويد (Capacitor)
export default defineConfig({ base: './', build: { outDir: 'dist', target: 'es2020' } });
