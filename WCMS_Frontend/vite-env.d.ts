/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SHOW_LEGACY?: string;
  // 你有其他自訂變數也可以一起加在這裡
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}