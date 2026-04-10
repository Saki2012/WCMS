import type { ComponentType } from "react";

export type SlotModule = { default?: unknown; [key: string]: unknown; };

export interface ResolveSlotOptions<T>
{
    relativePath: string;
    core: T;
    exportNames?: string[];
    modules: Record<string, SlotModule>;
}

export type SlotComponent<TProps = Record<string, never>> = ComponentType<TProps>;

// Spec：Component 專用模組集合
const specComponentModules = import.meta.glob("SpecFeature/**/*.tsx", { eager: true }) as Record<string, SlotModule>;
// Spec：Func / Extension 專用模組集合
const specFuncModules = import.meta.glob(
    [
        "SpecFeature/**/*.{ts,tsx}",
        "!SpecFeature/**/Assets/**",
    ],
    { eager: true },
) as Record<string, SlotModule>;
/** 正規化路徑，避免 slash 差異 */
export const normalizeSlotPath = (value: string): string =>
{
    return `${value ?? ""}`.trim().replace(/\\/g, "/").replace(/^\/+/, "");
};

/** 依 export 名稱優先序挑出要用的 export */
export const pickSlotExport = (mod: SlotModule, exportNames: string[] = []): unknown =>
{
    for (const name of exportNames)
    {
        if (name && mod[name]) return mod[name];
    }

    return mod.default;
};

/** 依 suffix 尋找對應模組 */
export const findSlotModuleBySuffix = (
    modules: Record<string, SlotModule>,
    relativePath: string,
): SlotModule | undefined =>
{
    const rel = normalizeSlotPath(relativePath);
    const hitKey = Object.keys(modules).find(key => normalizeSlotPath(key).endsWith(rel));
    return hitKey ? modules[hitKey] : undefined;
};

/** 共用底層 resolver：找得到 slot 就用，否則回 core */
export const resolveSlot = <T>(opt: ResolveSlotOptions<T>): T =>
{
    const mod = findSlotModuleBySuffix(opt.modules, opt.relativePath);
    if (!mod) return opt.core;

    const resolved = pickSlotExport(mod, opt.exportNames ?? []);
    if (!resolved) return opt.core;

    return resolved as T;
};

/** 共用 Component resolver */
export const resolveComponent = <TComponent>(
    relativePath: string,
    core: TComponent,
    exportNames: string[] = [],
    modules: Record<string, SlotModule>,
): TComponent =>
{
    return resolveSlot<TComponent>({ relativePath, core, exportNames, modules });
};

/** 共用 Func / Extension resolver */
export const resolveFunc = <TFunc>(
    relativePath: string,
    core: TFunc,
    exportNames: string[] = [],
    modules: Record<string, SlotModule>,
): TFunc =>
{
    return resolveSlot<TFunc>({ relativePath, core, exportNames, modules });
};

/** Spec Component resolver：只從目前 SpecFeature 範圍取值 */
export const resolveSpecComponent = <TComponent>(
    relativePath: string,
    core: TComponent,
    exportNames: string[] = [],
): TComponent =>
{
    return resolveComponent(relativePath, core, exportNames, specComponentModules);
};

/** Spec Func resolver：只從目前 SpecFeature 範圍取值 */
export const resolveSpecFunc = <TFunc>(
    relativePath: string,
    core: TFunc,
    exportNames: string[] = [],
): TFunc =>
{
    return resolveFunc(relativePath, core, exportNames, specFuncModules);
};

/** 取得目前 Spec 的 Component 模組集合 */
export const getSpecComponentModules = (): Record<string, SlotModule> =>
{
    return specComponentModules;
};

/** 取得目前 Spec 的 Func 模組集合 */
export const getSpecFuncModules = (): Record<string, SlotModule> =>
{
    return specFuncModules;
};

export type SlotModuleLoader = () => Promise<SlotModule>;

// Spec：Asset loader 專用模組集合（lazy）
const specAssetModules = import.meta.glob("SpecFeature/**/Assets/*.{ts,tsx}") as Record<string, SlotModuleLoader>;
/** 依 suffix 尋找對應 asset loader */
const findSlotLoaderBySuffix = (
    modules: Record<string, SlotModuleLoader>,
    relativePath: string,
): SlotModuleLoader | undefined =>
{
    const rel = normalizeSlotPath(relativePath);
    const hitKey = Object.keys(modules).find(key => normalizeSlotPath(key).endsWith(rel));
    return hitKey ? modules[hitKey] : undefined;
};
/** 若 spec asset 存在就載入；不存在就略過 */
export const importSpecAssets = async (relativePath: string): Promise<boolean> =>
{
    const loader = findSlotLoaderBySuffix(specAssetModules, relativePath);
    if (!loader) return false;
    await loader();
    return true;
};
