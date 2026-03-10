import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { components } from "@/types/api";
import { PersonModelFields, RoleDataModelFields, } from "@/types/SchemaFields";
import { AccountAdapter } from "@/Features/Hooks/BizFunc/AccountManage/Account/Account_Api";
import { PersonAdapter } from "@/Features/Hooks/BizFunc/AccountManage/Person/Person_Api";
import { RolePermissionAdapter } from "@/Features/Hooks/BizFunc/AccountManage/RolePermission/RolePermission_Api";
type AccountSet = components["schemas"]["AccountSet_DTO"];
type PersonSet = components["schemas"]["PersonSet_DTO"];
type RoleSet = components["schemas"]["RolePermissionSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];
const accountEmptyData: AccountSet = {};

interface UseServerAccountFormResult {
    prop: FormCompProp;
    formData: UseFetchFormDataResult<AccountSet>;
    isAddNew: boolean;
    confirmPwd: string;
    onConfirmPwdChange: (value: string) => void;
    accountStatus: Record<string, string>;
    personIds: Record<string, string>;
    roleIds: Record<string, string>;
    userPicId: string;
}

/** 建立表單頁主 hook */
export const useServerAccountForm = (theme: IBETheme): UseServerAccountFormResult => {
    const { internalId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const formUrl = useMemo(() => {return location.pathname.replace(/\/Form(?:\/[^/]+)?$/, "/Form");}, [location.pathname]);
    const listUrl = useMemo(() => {return location.pathname.replace(/\/Form(?:\/[^/]+)?$/, "/List");}, [location.pathname]);
    const adapter = useMemo(() => AccountAdapter(), []);
    const personAdapter = useMemo(() => PersonAdapter(), []);
    const roleAdapter = useMemo(() => RolePermissionAdapter(), []);
    const formData = useAccountFormDataByAdapter(adapter, internalId ?? "", accountEmptyData);
    const accountStatusQuery = useFetchEnumOptions("AccountStatus");
    const personQuery = usePersonListByAdapter(personAdapter);
    const roleQuery = useRoleListByAdapter(roleAdapter);
    const isAddNew = !internalId;
    const [confirmPwd, setConfirmPwd] = useState<string>("");
    useEffect(() => {if (!isAddNew) setConfirmPwd("");}, [isAddNew]);
    const personIds = usePersonDict(personQuery.rawData);
    const roleIds = useRoleDict(roleQuery.rawData);
    const actionsBase = useAccountActionsFromAdapter(formUrl,adapter,formData.data,internalId ?? "",() => navigate(listUrl),);
    const handleSaveWithValidate = useAccountSaveValidator(isAddNew,formData.data,confirmPwd,actionsBase,);
    const actions = useMemo<UseActionsResult>(() => {return {...actionsBase,onSave: handleSaveWithValidate,};}, [actionsBase, handleSaveWithValidate]);
    const prop = useAccountFormProp(theme,formData.isLoading,accountStatusQuery.isLoading,personQuery.isLoading,roleQuery.isLoading,formData.error,accountStatusQuery.error,personQuery.error,roleQuery.error,actions,);
    return {prop,formData,isAddNew,confirmPwd,onConfirmPwdChange: setConfirmPwd,accountStatus: accountStatusQuery.data ?? {},personIds,roleIds,userPicId: String(formData.data?.Account?.Person?.PersonImgId ?? ""),};
};


/** 建立表單頁外層 prop */
const useAccountFormProp = (theme: IBETheme,formLoading: boolean,enumLoading: boolean | undefined,
    personLoading: boolean,roleLoading: boolean,formError: string | null,
    enumError: string | null | undefined,personError: string | null,roleError: string | null,actions: UseActionsResult,): FormCompProp => 
{
    return useMemo(() => {
        return {
            Title: "管理者帳號資料修改", Theme: theme,
            IsLoading:  [formLoading, Boolean(enumLoading), personLoading, roleLoading].some(Boolean),
            ErrorList: [formError, enumError, personError, roleError],
            Actions: actions,
        };
    }, [theme, formLoading, enumLoading, personLoading, roleLoading, formError, enumError, personError, roleError, actions,]);
};

/** 建立表單資料 hook */
const useAccountFormDataByAdapter = (adapter: ReturnType<typeof AccountAdapter>,internalId: string,empty: AccountSet,): UseFetchFormDataResult<AccountSet> => {
    const { publish } = useToast();
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);
    const onError = useCallback((e: ApiAdapterError) => {publish({ level: MessageStatus.Error, title: e.messageText });}, [publish]);
    const initial = useMemo<ApiLoaderData<string, AccountSet> | null>(() => {
        if (!isNew) return null;
        const ok: ApiResponse<AccountSet> = {IsSuccess: true,Data: empty,SysMessage: [],};
        return {args: internalKey,apiRes: ok,};
    }, [isNew, empty, internalKey]);
    const model = adapter.hooks.useModelDisplayName({deps: [],onError,});
    const query = adapter.hooks.useQueryData({internalId: internalKey,initial,deps: [internalKey],onError,});
    const [data, setData] = useState<AccountSet>(empty);
    useEffect(() => {
        if (query.data) {
            setData(query.data);
            return;
        }
        if (isNew) setData(empty);
    }, [query.data, isNew, empty]);
    const refetch = useCallback(() => { void query.refetch(); }, [query]);
    return {
        data,
        setFormData: setData,
        isLoading: Boolean(!isNew && query.isLoading) || Boolean(model.isLoading),
        error: query.errorText ?? model.errorText ?? null,
        refetch,
        displayName: model.data ?? ({
            ModelId: "",
            ModelDisplayName: "",
            Tables: [],
        } as ModelDisplaySchema),
    };
};

/** 建立 actions */
const useAccountActionsFromAdapter = (dirUrl: string,adapter: ReturnType<typeof AccountAdapter>,formData: AccountSet,internalId: string,onBack: () => void,): UseActionsResult => 
{
    const { publish } = useToast();
    const isAddNew = !internalId;
    const server = adapter.useServerActions({
        onSuccessByMode: {
            create: () => onBack(),
            update: () => onBack(),
            delete: () => onBack(),
        },
        onError: (e) => publish({ level: MessageStatus.Error, title: e.messageText }),
    });

    const onSave = useCallback(async (): Promise<boolean> => {
        if (isAddNew) {
            const res = await server.createAsync(formData);
            return Boolean(res.IsSuccess);
        }
        const res = await server.updateAsync(internalId, formData);
        return Boolean(res.IsSuccess);
    }, [isAddNew, server, formData, internalId]);

    const onDeleteCore = useCallback(async () => {
        if (!internalId) return;
        const ok = window.confirm("確定要刪除嗎？");
        if (!ok) return;
        await server.deleteAsync(internalId);
    }, [server, internalId]);
    return useMemo(() => {
        return {
            isExecuting: server.isSaving,
            onSave,
            onDelete: async (_id: string) => {
                await onDeleteCore();
            },
            onInvalid: () => { /* Account 暫不做 invalid */ },
            onCancelBack: onBack,
            onAddNew: () => { /* Form 不使用 */ },
            onEdit: (_id: string) => { /* Form 不使用 */ },
            onPreview: () => { /* Form 不使用 */ },
        };
    }, [server.isSaving, onSave, onDeleteCore, onBack, dirUrl]);
};

/** 建立儲存前驗證 */
const useAccountSaveValidator = (isAddNew: boolean,formData: AccountSet,confirmPwd: string,actionsBase: UseActionsResult,): (() => Promise<boolean>) => 
{
    const { publish } = useToast();
    const validateBeforeSave = useCallback((): boolean => {
        if (!isAddNew) return true;
        const pwd = String(formData?.Account?.Password ?? "");
        const confirm = confirmPwd;
        if (!pwd || !confirm) {
            publish({level: MessageStatus.Error,title: "保存失敗",text: "請輸入密碼並再次確認",});
            return false;
        }
        if (pwd !== confirm) {
            publish({level: MessageStatus.Error,title: "保存失敗",text: "兩次密碼不一致",});
            return false;
        }
        return true;
    }, [isAddNew, formData, confirmPwd, publish]);
    return useCallback(async () => {
        const ok = validateBeforeSave();
        if (!ok) return false;
        return await actionsBase.onSave();
    }, [validateBeforeSave, actionsBase]);
};

/** 建立 person 下拉資料 */
const usePersonListByAdapter = (adapter: ReturnType<typeof PersonAdapter>) => {
    // 宣告變數
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) => {publish({ level: MessageStatus.Error, title: e.messageText });}, [publish]);
    const condition = useMemo<QueryListParam>(() => {
        return {
            Fields: [PersonModelFields.PersonId,PersonModelFields.PersonName,PersonModelFields.InternalId,],
            Condition: "",
            OrderBy: [{ Col: PersonModelFields.CreateTime, Desc: false }],
            PageNumber: 0,
            PageSize: 0,
        };
    }, []);
    const query = adapter.hooks.useQueryList({condition,deps: [],onError,});
    return {rawData: (query.data ?? []) as PersonSet[],isLoading: Boolean(query.isLoading),error: query.errorText ?? null,};
};

/** 建立 role 下拉資料 */
const useRoleListByAdapter = (adapter: ReturnType<typeof RolePermissionAdapter>) => {
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) => {publish({ level: MessageStatus.Error, title: e.messageText });}, [publish]);
    const condition = useMemo<QueryListParam>(() => {
        return {
            Fields: [RoleDataModelFields.RoleId,RoleDataModelFields.RoleName,RoleDataModelFields.InternalId,],
            Condition: "",
            OrderBy: [{ Col: RoleDataModelFields.CreateTime, Desc: false }],
            PageNumber: 0,
            PageSize: 0,
        };
    }, []);
    const query = adapter.hooks.useQueryList({condition,deps: [],onError,});
    return {rawData: (query.data ?? []) as RoleSet[],isLoading: Boolean(query.isLoading),error: query.errorText ?? null,};
};
/** 將 person 資料轉為下拉字典 */
const usePersonDict = (rawData: PersonSet[]): Record<string, string> => {
    return useMemo(() => {
        const dict: Record<string, string> = {};
        for (const item of rawData ?? []) {
            const personId = String(item?.Person?.PersonId ?? "").trim();
            if (!personId) continue;
            dict[personId] = String(item?.Person?.PersonId ?? "").trim();
        }
        return dict;
    }, [rawData]);
};
/** 將 role 資料轉為下拉字典 */
const useRoleDict = (rawData: RoleSet[]): Record<string, string> => {
    return useMemo(() => {
        const dict: Record<string, string> = {};
        for (const item of rawData ?? []) {
            const roleId = String(item?.RoleData?.RoleId ?? "").trim();
            if (!roleId) continue;
            dict[roleId] = String(item?.RoleData?.RoleName ?? "").trim();
        }
        return dict;
    }, [rawData]);
};