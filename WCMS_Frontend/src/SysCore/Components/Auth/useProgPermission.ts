import type { ICurrentUserContextDto } from "@/SysCore/Utils/API/AuthClient";
import { useMemo } from "react";
import { useAuthContext } from "./AuthContext";

// #region Property
export const FuncActionMask = {
    None: 0,
    Use: 1,
    Query: 2,
    View: 4,
    Create: 8,
    Update: 16,
    Delete: 32,
    Invalid: 64,
    All: 127,
} as const;

export interface ProgPermissionResult
{
    grantMask: number;
    canUse: boolean;
    canQuery: boolean;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}
// #endregion

// #region Public
/** 從登入 Context 取得指定功能的有效權限。 */
export const useProgPermission = (progId: string): ProgPermissionResult =>
{
    const auth = useAuthContext();
    const grantMask = useMemo(() => resolveGrantMask(auth.current, progId), [auth.current, progId]);

    return useMemo(() => buildPermissionResult(grantMask, auth.refresh), [auth.refresh, grantMask]);
};
// #endregion

// #region Private
/** 解析管理者或一般角色的有效權限遮罩。 */
const resolveGrantMask = (
    current: ICurrentUserContextDto,
    progId: string,
): number =>
{
    if (current.IsAdmin) return FuncActionMask.All;

    const direct = current.Permissions?.[progId];
    if (direct !== undefined) return Number(direct);

    const key = Object.keys(current.Permissions ?? {}).find(x => x.toLowerCase() === progId.toLowerCase());
    return key ? Number(current.Permissions[key] ?? FuncActionMask.None) : FuncActionMask.None;
};

/** 建立權限 Hook 回傳資料。 */
const buildPermissionResult = (grantMask: number, refetch: () => Promise<void>): ProgPermissionResult =>
{
    return {
        grantMask,
        canUse: hasPermission(grantMask, FuncActionMask.Use),
        canQuery: hasPermission(grantMask, FuncActionMask.Query),
        canView: hasPermission(grantMask, FuncActionMask.View),
        canCreate: hasPermission(grantMask, FuncActionMask.Create),
        canUpdate: hasPermission(grantMask, FuncActionMask.Update),
        canDelete: hasPermission(grantMask, FuncActionMask.Delete),
        isLoading: false,
        error: null,
        refetch,
    };
};

/** 判斷權限遮罩是否包含指定動作。 */
const hasPermission = (grantMask: number, actionMask: number): boolean =>
{
    return (grantMask & actionMask) === actionMask;
};
// #endregion
