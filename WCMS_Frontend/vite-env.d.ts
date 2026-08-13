/// <reference types="vite/client" />
interface ImportMetaEnv
{
    /** 前端版本，由 vite.config.ts 從 package.json 注入。 */
    readonly VITE_APP_VERSION?: string;
    /** 目前啟用的 Spec Code；Feature 模式不設定。 */
    readonly VITE_SPEC_CODE?: string;
}
interface ImportMeta
{
    readonly env: ImportMetaEnv;
}