import { useCallback, useMemo } from "react";
import type { components } from "@/types/api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { RolePermissionAdapter } from "@/Features/Hooks/BizFunc/AccountManage/RolePermission/RolePermission_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { AccountFields, RoleDataModelFields } from "@/types/SchemaFields";
type QueryListParam = components["schemas"]["QueryListParam"];
type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];
export interface RolePermissionListRawData {
    list: RolePermissionSet[];
    modelDisplayName: ModelDisplaySchema | null;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}
interface UseRolePermissionListFetchDataResult {
    adapter: ReturnType<typeof RolePermissionAdapter>;
    rawData: RolePermissionListRawData;
    isLoading: boolean;
    errors: (string | null | undefined)[];
    refetchData: () => Promise<void>;
}
/** RolePermission List：只負責純資料抓取 */
export const useRolePermissionListFetchData = (opt: {
    lang: Lang;
    kw: string;
}): UseRolePermissionListFetchDataResult => {
    // 宣告變數
    const adapter = useMemo(() => RolePermissionAdapter(), []);
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function：統一顯示 adapter 錯誤
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const condition = useRolePermissionCondition(opt.kw);

    const model = adapter.hooks.useModelDisplayName({
        deps: [opt.lang],
        onError,
    });

    const baseParam = useMemo<QueryListParam>(() => {
        // return
        return {
            Fields: [
                RoleDataModelFields.InternalId,
                RoleDataModelFields.RoleName,
                RoleDataModelFields.ModifyUserId,
                `${RoleDataModelFields.ModifyUser}.${AccountFields.AccountName}`,
                RoleDataModelFields.CreateTime,
                RoleDataModelFields.ModifyTime,
            ],
            Condition: condition,
            OrderBy: [
                { Col: RoleDataModelFields.CreateTime, Desc: true },
            ],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [condition]);

    const count = adapter.hooks.useQueryCount({
        condition: baseParam,
        deps: [baseParam.Condition ?? ""],
        onError,
    });

    const paged = adapter.hooks.usePagedQueryList({
        baseParam,
        count: count.data ?? 0,
        deps: [baseParam.Condition ?? ""],
        onError,
    });

    const rawData = useMemo<RolePermissionListRawData>(() => {
        // return
        return {
            list: paged.data ?? [],
            modelDisplayName: model.data ?? null,
            pageNumber: paged.pageNumber ?? 1,
            totalPages: paged.totalPages ?? 1,
            onPageChange: paged.onPageChange,
        };
    }, [paged.data, paged.pageNumber, paged.totalPages, paged.onPageChange, model.data]);

    const refetchData = useCallback(async () => {
        // 執行 function：刷新 schema/count/list
        await model.refetch();
        await count.refetch();
        await paged.refetch();
    }, [model, count, paged]);
    const isLoading = useMemo<boolean>(() => {return Boolean(model.isLoading || count.isLoading || paged.isLoading);}, [model.isLoading, count.isLoading, paged.isLoading]);
    const errors = useMemo<(string | null | undefined)[]>(() => {return [model.errorText ?? count.errorText ?? paged.errorText ?? null];}, [model.errorText, count.errorText, paged.errorText]);
    return {adapter,rawData,isLoading,errors,refetchData,};
};

/** 建立搜尋條件 */
const useRolePermissionCondition = (query: string): string => {
    // return
    return useMemo(() => {
        // 宣告變數
        let condition = "";

        // 執行 function：有關鍵字才組查詢條件
        if (query) {
            condition = LibMerge(
                " And ",
                false,
                condition,
                `${RoleDataModelFields.RoleName} Like ${query}`,
            );
        }

        // return
        return condition;
    }, [query]);
};