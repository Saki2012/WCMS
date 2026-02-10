import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import type { components } from "@/types/api";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";

import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { LibCheckBox, LibTextBox, LibUserCard } from "@/SysCore/Components/FormField/LibFormField";

import pic from "@/Features/Assets/Server/images/avatar/avatar_M_480x480.jpg";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";

import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";

import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { PersonAdapter } from "@/Features/Hooks/BizFunc/AccountManage/Person/Person_Api";
import { PersonModelFields, PersonSetFields } from "@/types/SchemaFields";

type PersonSet = components["schemas"]["PersonSet_DTO"];

const emptyData: PersonSet = {};

/** FormData：對標 Announcement（useModelDisplayName + useQueryData + local editable state） */
const usePersonFormData = (adapter: ReturnType<typeof PersonAdapter>, internalId: string, empty: PersonSet)
    : UseFetchFormDataResult<PersonSet> => {
    // 宣告變數
    const { publish } = useToast();

    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, PersonSet> | null>(() => {
        if (!isNew) return null;
        const ok: ApiResponse<PersonSet> = { IsSuccess: true, Data: empty, SysMessage: [] };
        return { args: internalKey, apiRes: ok };
    }, [isNew, empty, internalKey]);

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function：統一顯示 adapter error
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({
        internalId: internalKey,
        initial,
        deps: [internalKey],
        onError,
    });

    const [data, setData] = useState<PersonSet>(empty);

    useEffect(() => {
        // 執行 function：QueryData 回來後同步到可編輯 state
        if (query.data) setData(query.data);
        else if (isNew) setData(empty);
    }, [query.data, isNew, empty]);

    const refetch = useCallback(() => {
        // 執行 function
        void query.refetch();
    }, [query]);

    const isLoading = (Boolean(!isNew && query.isLoading) || Boolean(model.isLoading));
    const error = query.errorText ?? model.errorText ?? null;

    // return（displayName 不可為 null）
    return {
        data,
        setFormData: setData,
        isLoading,
        error,
        refetch,
        displayName: (model.data ?? { ModelId: "", ModelDisplayName: "", Tables: [] }),
    };
};

/** Actions：對標 Announcement（直接用 Adapter.useServerActions） */
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

    // return（不動 UI 結構）
    return {
        Save: async () => {
            if (isNew) await actions.createAsync(formData);
            else await actions.updateAsync(internalId, formData);
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

export const Server_Person_Form_Comp = (props: { theme: IBETheme }) => {
    // 宣告變數
    const { internalId } = useParams();
    const nav = useNavigate();
    const loc = useLocation();

    const id = internalId ?? "";
    const adapter = useMemo(() => PersonAdapter(), []);

    const onBackToList = useCallback(() => {
        // 執行 function：導回 List（沿用你原本 pathname 規則）
        const to = loc.pathname.replace(/\/Form(\/?[^\/]*)?$/, "/List");
        nav(to, { replace: true });
    }, [loc.pathname, nav]);

    const onPreview = useCallback(() => {
        // 執行 function：Person 目前沒 preview（保留空殼以符合 FormComp）
    }, []);

    // 執行 function：FormData（displayName + query + editable state）
    const formData = usePersonFormData(adapter, id, emptyData);

    // 執行 function：Actions（直接套 adapter.useServerActions）
    const actions = usePersonFormActionsFromAdapter(adapter, id, formData.data, onBackToList, onPreview);

    // 宣告變數：enum options
    const useGender = useFetchEnumOptions("Gender");

    // 宣告變數：Loading/Error（維持原本 FormComp 行為）
    const isLoading: boolean[] = [formData.isLoading, useGender.isLoading];
    const errors: (string | null | undefined)[] = [formData.error, useGender.error];

    const prop: FormCompProp = {
        Title: "管理者帳號資料修改",
        Theme: props.theme,
        LoadingList: isLoading,
        ErrorList: errors,
        Actions: actions,
    };

    // return（DOM 不動）
    return (
        <FormComp prop={prop}>
            <Person_Comp theme={props.theme} formData={formData} genderOpt={useGender.data} />
        </FormComp>
    );
};

const updatePersonImgId = (prev: PersonSet, id: string): PersonSet => {
    // 宣告變數
    const cur = prev ?? emptyData;
    const nextPerson = { ...(cur.Person ?? {}), PersonImgId: id };

    // return
    return { ...cur, Person: nextPerson };
};

const Person_Comp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<PersonSet>; genderOpt: Record<string, string> }) => {
    // 宣告變數
    const setField = useSetTableField<PersonSet>(props.formData);
    const userPic = props.formData.data?.Person?.PersonImgId
        ? `${FileManagementAPI.PREVIEW_URL}/${props.formData.data?.Person?.PersonImgId}`
        : pic;

    const setPersonImgId = useCallback((id: string) => {
        // 執行 function：上傳頭像後回寫 PersonImgId
        props.formData.setFormData(prev => updatePersonImgId(prev, id));
    }, [props.formData]);

    // return（DOM 不動）
    return (
        <div className="row">
            <div className="col-xl-3 col-lg-4 col-md-4 col-sm-4 col-12">
                <LibUserCard DisplayNameEN={props.formData.data?.Person?.PersonId ?? ""}
                    DisplayNameTW={props.formData.data?.Person?.PersonName ?? ""}
                    DisplayRole={""} PicSrc={userPic} Style={props.theme.UserImageUploadCard} onUploadedTempId={setPersonImgId} />
            </div>
            <div className="col-xl-9 col-lg-8 col-md-8 col-sm-8 col-12 ms-auto">
                <div className="panel">
                    <div className="panel-body">
                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(PersonSetFields.Person, PersonModelFields.PersonId, "string")} />
                                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(PersonSetFields.Person, PersonModelFields.PersonName, "string")} />
                                </div>
                            </div>
                        </div>
                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibCheckBox Style={props.theme.RadioBox} options={props.genderOpt}{...setField(PersonSetFields.Person, PersonModelFields.Gender, "number")} />
                                </div>
                            </div>
                        </div>
                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(PersonSetFields.Person, PersonModelFields.Email, "string")} />
                                </div>
                            </div>
                        </div>
                        <div className="row mx-0">
                            <div className="col form-group">
                                <div className="row mx-0">
                                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(PersonSetFields.Person, PersonModelFields.MobilePhone, "string")} />
                                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(PersonSetFields.Person, PersonModelFields.HomePhone, "string")} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
