import type { ClientPreviewEntry } from "@/Features/Pages/Client/Scaffold/Preview/Registry/ClientPreviewRegistry";
import { mergeClientPreviewEntries } from "@/Features/Pages/Client/Scaffold/Preview/Registry/ClientPreviewRegistry";
import { featureClientPreviewEntries } from "@/Features/Pages/Client/Scaffold/Preview/Registry/FeatureClientPreviewEntries";

// #region Property
interface ClientPreviewEntrySlotModule
{
    specClientPreviewEntries?: ClientPreviewEntry[];
    clientPreviewEntries?: ClientPreviewEntry[];
    default?: ClientPreviewEntry[];
}
// #endregion

// #region Initialization
/** 從單一 Spec slot module 解析 preview entries。 */
const resolveSpecPreviewEntries = (mod: ClientPreviewEntrySlotModule): ClientPreviewEntry[] =>
{
    return mod.specClientPreviewEntries ?? mod.clientPreviewEntries ?? mod.default ?? [];
};
/** 收集 SpecFeature 提供的預覽註冊。 */
const collectSpecClientPreviewEntries = (modules: Record<string, ClientPreviewEntrySlotModule>): ClientPreviewEntry[] =>
{
    return Object.values(modules).flatMap(resolveSpecPreviewEntries);
};
const specPreviewEntryModules = import.meta.glob<ClientPreviewEntrySlotModule>("SpecFeature/**/Pages/Client/Scaffold/Preview/Registry/ClientPreviewEntries.{ts,tsx}", { eager: true }) as Record<string, ClientPreviewEntrySlotModule>;
/** 目前 SpecFeature 追加的前台預覽註冊。 */
export const specClientPreviewEntries: ClientPreviewEntry[] = collectSpecClientPreviewEntries(specPreviewEntryModules);
/** 前台預覽註冊總表，Feature 為基礎，Spec 可追加或覆寫。 */
export const clientPreviewEntries: ClientPreviewEntry[] = mergeClientPreviewEntries(featureClientPreviewEntries, specClientPreviewEntries);
// #endregion
