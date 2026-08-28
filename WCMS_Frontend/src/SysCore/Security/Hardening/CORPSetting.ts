// #region Property
/** CORP 可用的資源隔離策略。 */
export type CorpPolicy = "same-origin" | "same-site" | "cross-origin";

/** WCMS 自有資源預設僅允許同 Origin 使用；/Service PDF 例外只沿用 Backend 明確核准的 Native Preview Context。 */
export const crossOriginResourcePolicyValue: CorpPolicy = "same-origin";
// #endregion
