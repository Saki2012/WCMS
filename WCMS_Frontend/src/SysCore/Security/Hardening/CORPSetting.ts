// #region Property
/** CORP 可用的資源隔離策略。 */
export type CorpPolicy = "same-origin" | "same-site" | "cross-origin";

/** WCMS 自有資源預設僅允許同 Origin 使用；PDF Response 由 Header 套用層排除。 */
export const crossOriginResourcePolicyValue: CorpPolicy = "same-origin";
// #endregion
