import { PersonAdapter } from "@/Features/Hooks/BizFunc/COMM/Person_Api";
import type {
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useMemo } from "react";

// #region Property
type PersonSet = components["schemas"]["PersonSet_DTO"];


export interface UsePersonFormTemplateOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: PersonSet;

    /** Form Template 標準動作設定 */
    actionsOpt: PersonFormActionsOpt;
}


export interface PersonFormRefs
{
    /** 性別 enum 選項 */
    genderOpt: Record<string, string>;
}


export type PersonFormActionsOpt = {
    /** 儲存成功後返回人員列表 */
    onBackToList: () => void;
};


export type PersonFormAdapter = ReturnType<typeof PersonAdapter>;


export type PersonFormRawData = ServerFormDefaultRawData<PersonSet, PersonFormRefs>;
// #endregion

// #region Public
export const personEmptyData: PersonSet = { Person: {} };


/** 建立 Person Form Template，統一交給 Server_FormTemplate 處理資料查詢、CUD 與 toast。 */
export const usePersonFormTemplate = (
    opt: UsePersonFormTemplateOptions,
): ServerFormTemplate<PersonSet, PersonFormAdapter, PersonFormRefs, PersonFormRawData, PersonFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "Person",
            theme: opt.theme,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildPersonFormAdapter,
                buildTitle: buildPersonFormTitle,
                buildInitialData: buildPersonInitialData,
                useReferenceData: usePersonReferenceData,
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.theme]);
};
// #endregion

// #region Private
/** 建立 Person Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildPersonFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getPersonModelTitle(ctx.displayName, "人員資料");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};


/** 建立新增模式 initial data，避免保留舊 top-level initial 入口。 */
const buildPersonInitialData = (ctx: { mode: "new" | "edit"; emptyData: PersonSet; }): ApiFormInitial<PersonSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};


/** 建立 Person Form 主資料 Adapter。 */
const buildPersonFormAdapter = (): PersonFormAdapter =>
{
    return PersonAdapter();
};


/** 取得 Person Header 需要的 enum 資料。 */
const usePersonReferenceData = () =>
{
    const gender = useFetchEnumOptions("Gender");

    return useMemo(() =>
    {
        return {
            refs: { genderOpt: gender.data ?? {} },
            isLoading: Boolean(gender.isLoading),
            errors: [gender.error],
            refetchRefData: async () => await gender.refetch(),
        };
    }, [gender.data, gender.error, gender.isLoading, gender.refetch]);
};


/** 取得 Person Model 顯示名稱，避免標題寫死。 */
const getPersonModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};
// #endregion
