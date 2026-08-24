// #region Property
/** COEP 可用的前端隔離策略；來源白名單不由 COEP 管理。 */
export type CoepPolicy = "require-corp" | "credentialless";

/** WCMS 前端目前採用的 COEP 策略。 */
export const crossOriginEmbedderPolicyValue: CoepPolicy = "require-corp";
// #endregion
