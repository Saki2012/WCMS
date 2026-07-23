import { PersonAdapter } from "@/Features/Hooks/BizFunc/COMM/Person_Api";
import { AccountAdapter } from "@/Features/Hooks/BizFunc/IAM/Account_Api";
import { RolePermissionAdapter } from "@/Features/Hooks/BizFunc/IAM/RolePermission_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ApiFormInitial, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PersonFields, RoleDataFields } from "@/types/SchemaFields";
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// #region Property
type AccountFormModel = components["schemas"]["Account"];

type PersonFormModel = components["schemas"]["Person"];

type RolePermissionFormModel = components["schemas"]["RoleData"];

type QueryListParam = components["schemas"]["QueryListParam"];

export interface UseAccountFormTemplateOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: AccountFormModel;

    /** Form Template 標準動作設定 */
    actionsOpt: AccountFormActionsOpt;
}

export interface AccountFormRefs
{
    /** 帳號狀態 enum 選項 */
    accountStatus: Record<string, string>;

    /** 可選人員下拉選項 */
    personIds: Record<string, string>;

    /** 角色下拉選項 */
    roleIds: Record<string, string>;
}

export interface AccountFormRawData extends ServerFormDefaultRawData<AccountFormModel, AccountFormRefs>
{
    /** 是否為新增模式 */
    isAddNew: boolean;

    /** 密碼確認欄位值 */
    confirmPwd: string;

    /** 更新確認密碼欄位 */
    onConfirmPwdChange: (value: string) => void;

    /** UserCard 使用的人員圖片 ID */
    userPicId: string;

    /** 前端本地檢核訊息 */
    validationErrors: string[];
}

export type AccountFormActionsOpt = {
    /** 儲存成功後返回帳號列表 */
    onBackToList: () => void;
};

export type AccountFormAdapter = {
    /** 帳號主資料 Adapter */
    Account: ReturnType<typeof AccountAdapter>;

    /** 人員下拉資料 Adapter */
    Person: ReturnType<typeof PersonAdapter>;

    /** 角色下拉資料 Adapter */
    Role: ReturnType<typeof RolePermissionAdapter>;
};
// #endregion

// #region Public
/** Account 新增模式使用的空白 FormModel。 */
export const accountEmptyData: AccountFormModel = {};

/** 建立 Account Form Template，統一交給 Server_FormTemplate 處理 CUD 與 toast。 */
export const useAccountFormTemplate = (
    opt: UseAccountFormTemplateOptions,
): ServerFormTemplate<AccountFormModel, AccountFormAdapter, AccountFormRefs, AccountFormRawData, AccountFormActionsOpt> =>
{
    const [, setConfirmPwd] = useState<string>("");
    const [, setValidationErrors] = useState<string[]>([]);
    const confirmPwdRef = useRef<string>("");
    const validationErrorsRef = useRef<string[]>([]);

    useEffect(() =>
    {
        if (opt.internalId) updateConfirmPassword("", setConfirmPwd, confirmPwdRef, setValidationErrors, validationErrorsRef);
    }, [opt.internalId]);

    const onConfirmPwdChange = useCallback((value: string) =>
    {
        updateConfirmPassword(value, setConfirmPwd, confirmPwdRef, setValidationErrors, validationErrorsRef);
    }, []);

    const validateBeforeSave = useCallback((data: AccountFormModel, isAddNew: boolean): boolean =>
    {
        return validateAccountBeforeSave(data, isAddNew, confirmPwdRef.current, setValidationErrors, validationErrorsRef);
    }, []);

    return useMemo(() =>
    {
        return {
            featureKey: "Account",
            theme: opt.theme,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildAccountFormAdapter,
                selectDataAdapter: adapter => adapter.Account,
                buildTitle: buildAccountFormTitle,
                buildInitialData: buildAccountInitialData,
                useReferenceData: useAccountReferenceData,
                buildActions: (ctx, actions) => buildAccountFormActions(ctx, actions, validateBeforeSave),
                buildRawData: ctx => buildAccountRawData(ctx.binding, ctx.refs, ctx.actions, confirmPwdRef.current, onConfirmPwdChange, validationErrorsRef.current, ctx.mode === "new"),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.theme, onConfirmPwdChange, validateBeforeSave]);
};
// #endregion

// #region Private
/** 建立 Account Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildAccountFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getAccountModelTitle(ctx.displayName, "管理者帳號資料");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildAccountInitialData = (ctx: { mode: "new" | "edit"; emptyData: AccountFormModel; }): ApiFormInitial<AccountFormModel> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 Account Form 會使用到的 Adapter 群組。 */
const buildAccountFormAdapter = (): AccountFormAdapter =>
{
    return { Account: AccountAdapter(), Person: PersonAdapter(), Role: RolePermissionAdapter() };
};

/** 取得 Account Header 需要的 enum 與下拉資料。 */
const useAccountReferenceData = (ctx: { adapter: AccountFormAdapter; internalId: string; }) =>
{
    const accountStatus = useFetchEnumOptions("AccountStatus");
    const personQuery = usePersonListByAdapter(ctx.adapter.Person);
    const accountPersonQuery = useAccountPersonListByAdapter(ctx.adapter.Account);
    const roleQuery = useRoleListByAdapter(ctx.adapter.Role);
    const personIds = useAvailablePersonDict(personQuery.rawData, accountPersonQuery.rawData, ctx.internalId);
    const roleIds = useRoleDict(roleQuery.rawData);

    return useMemo(() =>
    {
        return {
            refs: { accountStatus: accountStatus.data ?? {}, personIds, roleIds },
            isLoading: Boolean(accountStatus.isLoading || personQuery.isLoading || accountPersonQuery.isLoading || roleQuery.isLoading),
            errors: [accountStatus.error, personQuery.error, accountPersonQuery.error, roleQuery.error],
            refetchRefData: async () =>
            {
                await Promise.all([personQuery.refetch(), accountPersonQuery.refetch(), roleQuery.refetch()]);
            },
        };
    }, [
        accountStatus.data,
        accountStatus.error,
        accountStatus.isLoading,
        personIds,
        personQuery.error,
        personQuery.isLoading,
        personQuery.refetch,
        accountPersonQuery.error,
        accountPersonQuery.isLoading,
        accountPersonQuery.refetch,
        roleIds,
        roleQuery.error,
        roleQuery.isLoading,
        roleQuery.refetch,
    ]);
};

/** 取得 Account Model 顯示名稱，避免標題寫死功能名稱。 */
const getAccountModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** 更新確認密碼，並清掉本地檢核訊息。 */
const updateConfirmPassword = (
    value: string,
    setConfirmPwd: (value: string) => void,
    confirmPwdRef: MutableRefObject<string>,
    setValidationErrors: (errors: string[]) => void,
    validationErrorsRef: MutableRefObject<string[]>,
): void =>
{
    confirmPwdRef.current = value;
    validationErrorsRef.current = [];
    setConfirmPwd(value);
    setValidationErrors([]);
};

/** 建立儲存前檢核後的 Actions，讓 Template 仍負責真正 CUD。 */
const buildAccountFormActions = (
    ctx: { binding: ServerFormBinding<AccountFormModel>; mode: "new" | "edit"; },
    actions: ServerFormActions,
    validateBeforeSave: (data: AccountFormModel, isAddNew: boolean) => boolean,
): ServerFormActions =>
{
    return {
        ...actions,
        Save: async () =>
        {
            const canSave = validateBeforeSave(ctx.binding.data, ctx.mode === "new");
            if (!canSave) return;
            await actions.Save();
        },
    };
};

/** 建立 Account FormComp 會額外使用的 rawData。 */
const buildAccountRawData = (
    binding: ServerFormBinding<AccountFormModel>,
    refs: AccountFormRefs,
    actions: ServerFormActions,
    confirmPwd: string,
    onConfirmPwdChange: (value: string) => void,
    validationErrors: string[],
    isAddNew: boolean,
): AccountFormRawData =>
{
    return {
        formData: binding,
        refs,
        actions,
        isAddNew,
        confirmPwd,
        onConfirmPwdChange,
        validationErrors,
        userPicId: String(binding.data?.Person?.PersonImgId ?? ""),
    };
};

/** 檢查新增帳號時密碼與確認密碼是否正確。 */
const validateAccountBeforeSave = (
    data: AccountFormModel,
    isAddNew: boolean,
    confirmPwd: string,
    setValidationErrors: (errors: string[]) => void,
    validationErrorsRef: MutableRefObject<string[]>,
): boolean =>
{
    const errors = buildAccountValidationErrors(data, isAddNew, confirmPwd);
    validationErrorsRef.current = errors;
    setValidationErrors(errors);
    return errors.length === 0;
};

/** 建立 Account 儲存前本地檢核訊息。 */
const buildAccountValidationErrors = (data: AccountFormModel, isAddNew: boolean, confirmPwd: string): string[] =>
{
    if (!isAddNew) return [];
    const pwd = LibText.safeTrim(data?.Password);
    const confirm = LibText.safeTrim(confirmPwd);
    if (!pwd || !confirm) return ["請輸入密碼並再次確認"];
    if (pwd !== confirm) return ["兩次密碼不一致"];
    return [];
};

/** 建立 person 清單查詢。 */
const usePersonListByAdapter = (adapter: ReturnType<typeof PersonAdapter>) =>
{
    const condition = useMemo<QueryListParam>(() =>
    {
        return {
            Fields: [PersonFields.PersonId, PersonFields.PersonName, PersonFields.InternalId],
            Condition: "",
            OrderBy: [{ Col: PersonFields.CreateTime, Desc: false }],
            PageNumber: 0,
            PageSize: 0,
        };
    }, []);
    const query = adapter.hooks.useQueryList({ condition, deps: [] });
    return { rawData: (query.data ?? []) as PersonFormModel[], isLoading: Boolean(query.isLoading), error: query.errorText ?? null, refetch: query.refetch };
};

/** 建立 role 清單查詢。 */
const useRoleListByAdapter = (adapter: ReturnType<typeof RolePermissionAdapter>) =>
{
    const condition = useMemo<QueryListParam>(() =>
    {
        return {
            Fields: [RoleDataFields.RoleId, RoleDataFields.RoleName, RoleDataFields.InternalId],
            Condition: "",
            OrderBy: [{ Col: RoleDataFields.CreateTime, Desc: false }],
            PageNumber: 0,
            PageSize: 0,
        };
    }, []);
    const query = adapter.hooks.useQueryList({ condition, deps: [] });
    return { rawData: (query.data ?? []) as RolePermissionFormModel[], isLoading: Boolean(query.isLoading), error: query.errorText ?? null, refetch: query.refetch };
};

/** 建立帳號與人員關聯查詢，避免同一人員被重複綁定。 */
const useAccountPersonListByAdapter = (adapter: ReturnType<typeof AccountAdapter>) =>
{
    const condition = useMemo<QueryListParam>(() =>
    {
        return { Fields: [AccountFields.InternalId, AccountFields.PersonId], Condition: "", OrderBy: [], PageNumber: 0, PageSize: 0 };
    }, []);
    const query = adapter.hooks.useQueryList({ condition, deps: [] });
    return { rawData: (query.data ?? []) as AccountFormModel[], isLoading: Boolean(query.isLoading), error: query.errorText ?? null, refetch: query.refetch };
};

/** 建立可選人員下拉字典。 */
const useAvailablePersonDict = (personRawData: PersonFormModel[], accountRawData: AccountFormModel[], currentAccountInternalId: string): Record<string, string> =>
{
    return useMemo(() =>
    {
        const usedPersonIds = buildUsedPersonIds(accountRawData, currentAccountInternalId);
        return buildAvailablePersonDict(personRawData, usedPersonIds);
    }, [personRawData, accountRawData, currentAccountInternalId]);
};

/** 建立其他帳號已使用的人員代號。 */
const buildUsedPersonIds = (rawData: AccountFormModel[], currentAccountInternalId: string): Set<string> =>
{
    const usedIds = new Set<string>();

    for (const item of rawData ?? [])
    {
        const accountInternalId = String(item?.InternalId ?? "").trim();
        const personId = String(item?.PersonId ?? "").trim();

        if (!personId) continue;
        if (accountInternalId === currentAccountInternalId) continue;

        usedIds.add(personId);
    }

    return usedIds;
};

/** 建立尚可選的人員下拉資料。 */
const buildAvailablePersonDict = (rawData: PersonFormModel[], usedPersonIds: Set<string>): Record<string, string> =>
{
    const dict: Record<string, string> = {};

    for (const item of rawData ?? [])
    {
        const personId = String(item?.PersonId ?? "").trim();
        if (!personId || usedPersonIds.has(personId)) continue;
        dict[personId] = personId;
    }

    return dict;
};

/** 將 role 資料轉為下拉字典。 */
const useRoleDict = (rawData: RolePermissionFormModel[]): Record<string, string> =>
{
    return useMemo(() =>
    {
        const dict: Record<string, string> = {};
        for (const item of rawData ?? [])
        {
            const roleId = String(item?.RoleId ?? "").trim();
            if (!roleId) continue;
            dict[roleId] = String(item?.RoleName ?? "").trim();
        }
        return dict;
    }, [rawData]);
};
// #endregion
