import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, BannerDetailFields, BannerFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
type QueryListParam = components["schemas"]["QueryListParam"];
type BannerSet = components["schemas"]["BannerSet_DTO"];

// #region Public
export type BannerSliderListRawData = {
    modelDisplayName: ModelDisplaySchema | null;
    count: number;
    list: BannerSet[];
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
};
export type BannerSliderListAdapter = {
    BannerSlider: ReturnType<typeof BannerSliderAdapter>;
};
export const useBannerSliderListFetchData = (
    opt: { lang: Lang; kw: string; },
): UseFetchDataResult<BannerSliderListRawData, BannerSliderListAdapter> =>
{
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const adapter = useMemo(() =>
    {
        return { BannerSlider: BannerSliderAdapter() };
    }, []);
    // 執行 function：Query param（穩定 reference，避免 deps 無限觸發）
    const baseParam = useBannerSliderListQueryParam({ kw: opt.kw });
    // 執行 function：主資料（公告 Grid）
    const grid = adapter.BannerSlider.hooks.useQueryGridData({
        baseParam,
        deps: [baseParam.Condition ?? "", baseParam.PageSize ?? 0],
        modelDeps: [opt.lang],
        onError,
    });
    // 宣告變數：loading / errors 統一出口
    const isLoading = Boolean(grid.isLoading);
    const errors = useMemo(() =>
    {
        const list = [...(grid.errors ?? [])];
        return list.filter((x): x is string => Boolean(x));
    }, [grid.errors]);
    // 宣告變數：rawData（你要的自定義出口）
    const rawData = useMemo<BannerSliderListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param]);
    const refetchData = useCallback(async () =>
    {
        await grid.refetchData();
    }, [grid]);
    return { adapter, rawData, isLoading, errors, refetchData };
};
// #endregion

// #region Private
const useBannerSliderListQueryParam = (p: { kw: string; }): QueryListParam =>
{
    const fields = useMemo<string[]>(() =>
    {
        return [
            BannerFields.InternalId,
            BannerFields.BannerId,
            BannerFields.BannerCategoryName,
            BannerFields.ModifyUserId,
            BannerFields.ModifyTime,
            `${BannerFields.ModifyUser}.${AccountFields.AccountName}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
        ];
    }, []);
    const condition = useMemo(() =>
    {
        let cdt = ``;
        if (!!p.kw) cdt = LibMerge(" And ", false, cdt, `${BannerFields.BannerCategoryName} Like ${p.kw}`);
        return cdt;
    }, [p.kw]);
    return useMemo(() =>
    {
        return {
            Fields: fields,
            Condition: condition,
            OrderBy: [{ Col: BannerFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [fields, condition]);
};
// #endregion
