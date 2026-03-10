import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { components } from "@/types/api";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import type { ApiAdapterError, ApiLoaderData, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { PersonAdapter } from "@/Features/Hooks/BizFunc/AccountManage/Person/Person_Api";
type PersonSet = components["schemas"]["PersonSet_DTO"];
const personEmptyData: PersonSet = {};
interface UseServerPersonFormResult {
    prop: FormCompProp;
    formData: UseFetchFormDataResult<PersonSet>;
    genderOpt: Record<string, string>;
}
/** Person Form 主 Hook */
export const useServerPersonForm = (theme: IBETheme): UseServerPersonFormResult => {
    const { internalId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const adapter = useMemo(() => PersonAdapter(), []);
    const id = internalId ?? "";
    const formData = usePersonFormDataByAdapter(adapter, id, personEmptyData);
    const useGender = useFetchEnumOptions("Gender");
    const onBackToList = useCallback(() => {
        const to = location.pathname.replace(/\/Form(\/?[^\/]*)?$/, "/List");
        navigate(to, { replace: true });
    }, [location.pathname, navigate]);
    const onPreview = useCallback(() => {}, []);
    const actions = usePersonFormActionsFromAdapter(adapter,id,formData.data,onBackToList,onPreview,);
    const prop = useMemo<FormCompProp>(() => {
        return {
            Title: "管理者帳號資料修改",
            Theme: theme,
            IsLoading: [formData.isLoading, useGender.isLoading].some(Boolean),
            ErrorList: [formData.error, useGender.error],
            Actions: actions,
        };
    }, [theme, formData.isLoading, formData.error, useGender.isLoading, useGender.error, actions]);
    return {
        prop,
        formData,
        genderOpt: useGender.data ?? {},
    };
};

/** 取得 Person FormData */
const usePersonFormDataByAdapter = (adapter: ReturnType<typeof PersonAdapter>,internalId: string,empty: PersonSet,): UseFetchFormDataResult<PersonSet> => {
    // 宣告變數
    const { publish } = useToast();
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);
    const initial = useMemo<ApiLoaderData<string, PersonSet> | null>(() => {
        if (!isNew) return null;
        const ok: ApiResponse<PersonSet> = {IsSuccess: true,Data: empty,SysMessage: [],};
        return {args: internalKey,apiRes: ok,};
    }, [isNew, empty, internalKey]);
    const onError = useCallback((e: ApiAdapterError) => {publish({ level: MessageStatus.Error, title: e.messageText });}, [publish]);
    const model = adapter.hooks.useModelDisplayName({deps: [],onError,});
    const query = adapter.hooks.useQueryData({internalId: internalKey,initial,deps: [internalKey],onError,});
    const [data, setData] = useState<PersonSet>(empty);

    useEffect(() => {
        if (query.data) {
            setData(query.data);
            return;
        }
        if (isNew) setData(empty);
    }, [query.data, isNew, empty]);
    const refetch = useCallback(() => {void query.refetch();}, [query]);
    return {
        data,
        setFormData: setData,
        isLoading: Boolean(!isNew && query.isLoading) || Boolean(model.isLoading),
        error: query.errorText ?? model.errorText ?? null,
        refetch,
        displayName: model.data ?? { ModelId: "", ModelDisplayName: "", Tables: [] },
    };
};

/** 建立 Person Form actions */
const usePersonFormActionsFromAdapter = (
    adapter: ReturnType<typeof PersonAdapter>,
    internalId: string,
    formData: PersonSet,
    onBackToList: () => void,
    onPreview: () => void,
): ServerFormActions => {
    // 宣告變數
    const isNew = useMemo(() => !internalId, [internalId]);

    const actions = adapter.useServerActions({
        onSuccessByMode: {
            create: () => onBackToList(),
            update: () => onBackToList(),
            delete: () => onBackToList(),
        },
    });

    // return
    return {
        Save: async () => {
            if (isNew) {
                await actions.createAsync(formData);
                return;
            }

            await actions.updateAsync(internalId, formData);
        },
        Delete: async () => {
            if (!internalId) return;
            await actions.deleteAsync(internalId);
        },
        Back: onBackToList,
        Preview: onPreview,
        IsSaving: actions.isSaving,
    };
};