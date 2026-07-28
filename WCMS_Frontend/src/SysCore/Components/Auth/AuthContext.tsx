import type { ICurrentUserContextDto } from "@/SysCore/Utils/API/AuthClient";
import { createContext, type ReactNode, useContext } from "react";

// #region Property
export interface AuthContextValue
{
    current: ICurrentUserContextDto;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
let authContextSnapshot: ICurrentUserContextDto | null = null;
// #endregion

// #region Public
/** 取得 SPA 生命週期內暫存的登入與權限內容。 */
export const getAuthContextSnapshot = (): ICurrentUserContextDto | null =>
{
    return authContextSnapshot;
};

/** 更新 SPA 生命週期內暫存的登入與權限內容。 */
export const setAuthContextSnapshot = (value: ICurrentUserContextDto): void =>
{
    authContextSnapshot = value;
};

/** 清除登入與權限內容。 */
export const clearAuthContextSnapshot = (): void =>
{
    authContextSnapshot = null;
};

/** 提供後台頁面共用的登入與權限 Context。 */
export const AuthContextProvider = (prop: { value: AuthContextValue; children: ReactNode; }) =>
{
    return <AuthContext.Provider value={prop.value}>{prop.children}</AuthContext.Provider>;
};

/** 取得目前登入者與權限內容。 */
export const useAuthContext = (): AuthContextValue =>
{
    const value = useContext(AuthContext);
    if (!value) throw new Error("useAuthContext 必須在 RequireAuth 內使用");
    return value;
};
// #endregion
