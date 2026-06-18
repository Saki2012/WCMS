import type { SpecManifestInfo } from "@/SysCore/Interface/ISpecManifest_Types";
import { resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import { LibText } from "../Library/LibData";

// #region Property
export interface SystemVersionTextOptions
{
    /** 前端版本 */
    feVersion?: string | null;
    /** 後端版本 */
    beVersion?: string | null;
}
const SPEC_MANIFEST_SLOT_PATH = "SpecManifest.ts";
const EMPTY_SPEC_MANIFEST: SpecManifestInfo = { specCode: "", specTitle: "", specVersion: "" };
// #endregion

// #region Public
/** 建立系統版本顯示文字。 */
export const buildSystemVersionText = (options?: SystemVersionTextOptions): string =>
{
    const feVersion = getFeVersion(options?.feVersion);
    const beVersion = getBeVersion(options?.beVersion);
    return `FE:${feVersion} / BE:${beVersion}`;
};
// #endregion

// #region Private
/** 取得前端版本。 */
const getFeVersion = (value?: string | null): string =>
{
    // 宣告變數
    const envVersion = import.meta.env.VITE_APP_VERSION as string | undefined;
    const version = LibText.safeTrim(value) || envVersion || "0.0.0";
    const specVersion = getSpecVersion();
    return specVersion ? `${version}-${specVersion}` : version;
};
/** 取得後端版本。 */
const getBeVersion = (value?: string | null): string =>
{
    const version = LibText.safeTrim(value);
    return version && version.length > 0 ? version : "-";
};
/** 取得目前 Spec 規格版號。 */
const getSpecVersion = (): string =>
{
    const specManifest = resolveSpecFunc<SpecManifestInfo>(SPEC_MANIFEST_SLOT_PATH, EMPTY_SPEC_MANIFEST, ["SpecManifest"]);
    const specVersion = LibText.safeTrim(specManifest.specVersion);
    return specVersion;
};
// #endregion
