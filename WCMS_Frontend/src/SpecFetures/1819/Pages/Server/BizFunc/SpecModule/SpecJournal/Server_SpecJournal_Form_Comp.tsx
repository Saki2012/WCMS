import { LibTextBox, LibFileInput, LibTinyMCE, LibDropList } from "@/SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";


import { DefaultLang, LangLabelMap, SUPPORTED_LANGS, type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import type { ModelDisplaySchema } from "@/types/IApiSchema";

import { useSetTableField, useSetTableFileField } from "@/SysCore/Components/FormField/useSetTableField";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";

import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";

import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournalIndex_Api";

import {
    PGID,
    SpecJournalAuthorFields,
    SpecJournalBibliographyFields,
    SpecJournalIndexDetailFields,
    SpecJournalIndexModelFields,
    SpecJournalKeywordsFields,
    SpecJournalModelFields,
    SpecJournalOpenPointFilesFields,
    SpecJournalRefFilesFields,
    SpecJournalRefFormatFields,
    SpecJournalSetFields,
} from "@/types/SchemaFields";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"]
type SpecJournalOpenPointFiles = components["schemas"]["SpecJournalOpenPointFiles_DTO"]
type SpecJournalRefFiles = components["schemas"]["SpecJournalRefFiles_DTO"]
type SpecJournalBibliography = components["schemas"]["SpecJournalBibliography_DTO"]
type ORCIDData = components["schemas"]["ORCIDData"]


type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"]
type SpecJournalIndexDetailSet = components["schemas"]["SpecJournalIndexDetail_DTO"]

const emptyData: SpecJournalSet = {}



export const Server_SpecJournal_Form_Comp = (prop: { theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const adapter = useMemo(() => SpecJournalAdapter(), []);
    const indexAdapter = useMemo(() => SpecJournalIndexAdapter(), []);

    const formData = useSpecJournalFormDataByAdapter(adapter, internalId ?? "", emptyData);

    // 原本就有的資料（不動業務邏輯）
    const tagAdapter = useMemo(() => TagAdapter(), []);

    const useTag = tagAdapter.hooks.useMapByProgId({ progId: PGID.SpecJournal, lang: prop.lang },);

    const useKeywords = useKeywordsDataByAdapter(adapter);
    const useIndexList = useIndexDataByAdapter(indexAdapter);

    const onBackToList = useCallback(() => {
        // 執行 function：回列表
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);

    const actions = useSpecJournalFormActionsFromAdapter(adapter, internalId ?? "", formData.data, onBackToList);

    const isLoading = [formData.isLoading, useIndexList.isLoading, useTag.isLoading, useKeywords.isLoading];
    const errors = [formData.error, useIndexList.error, useTag.errorText, useKeywords.error];
    const formProp: FormCompProp = { Title: "期刊目次", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions };

    return (
        <FormComp prop={formProp}>
            <MainFormComp theme={prop.theme} formData={formData} indexRawData={useIndexList.rawData ?? []} tagOptionsRaw={useTag.map} keywords={useKeywords.rawData ?? []} />
        </FormComp>
    )

};

/** FormData：QueryData + ModelDisplayName（改用 Adapter） */
const useSpecJournalFormDataByAdapter = (
    adapter: ReturnType<typeof SpecJournalAdapter>,
    internalId: string,
    empty: SpecJournalSet,
): UseFetchFormDataResult<SpecJournalSet> => {
    // 宣告變數
    const { publish } = useToast();

    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, SpecJournalSet> | null>(() => {
        if (!isNew) return null;
        const ok: ApiResponse<SpecJournalSet> = { IsSuccess: true, Data: empty, SysMessage: [] };
        return { args: internalKey, apiRes: ok };
    }, [isNew, empty, internalKey]);

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const model = adapter.hooks.useModelDisplayName({ deps: [], onError });
    const query = adapter.hooks.useQueryData({
        internalId: internalKey,
        initial,
        deps: [internalKey],
        onError,
    });

    const [data, setData] = useState<SpecJournalSet>(empty);

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
        displayName: (model.data ?? ({ ModelId: "", ModelDisplayName: "", Tables: [] } as ModelDisplaySchema)),
    };
};

/** Actions：改用 Adapter.useServerActions（不動業務邏輯） */
const useSpecJournalFormActionsFromAdapter = (
    adapter: ReturnType<typeof SpecJournalAdapter>,
    internalId: string,
    formData: SpecJournalSet,
    onBackToList: () => void,
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
        IsSaving: actions.isSaving,
    };
};

const MainFormComp = (props: {
    theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet>; indexRawData: SpecJournalIndexSet[];
    tagOptionsRaw: Record<string, string>; keywords: SpecJournalSet[];
}) => {
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { "Basic": "基本資料", "Author": "期刊作者", "Bibliography": "參考文獻", "RefFormat": "引文格式", "Files": "檔案上傳", "Keyword": "關鍵字", "System": "系統資訊" } }
    const components: Record<string, React.ReactNode[]> = {
        Basic: [<BasicComp theme={props.theme} formData={props.formData} indexRawData={props.indexRawData} />],
        Author: [<AuthorComp theme={props.theme} formData={props.formData} />],
        Bibliography: [<BibliographyComp theme={props.theme} formData={props.formData} />],
        RefFormat: [<RefFormatComp theme={props.theme} formData={props.formData} />],
        Files: [<FilesComp theme={props.theme} formData={props.formData} />],
        Keyword: [<KeywordComp theme={props.theme} formData={props.formData} tagOptionsRaw={props.tagOptionsRaw} keywords={props.keywords} />],
        System: [<SystemInfoTabComp theme={props.theme} formData={props.formData} setKey={SpecJournalSetFields.SpecJournal} />]
    }
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>
}
const BasicComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet>; indexRawData: SpecJournalIndexSet[] }) => {
    const setField = useSetTableField<SpecJournalSet>(props.formData);
    const setFileField = useSetTableFileField<SpecJournalSet>(props.formData);
    const indexOptions = useMemo(() => { return buildIndexHeaderOptions(props.indexRawData); }, [props.indexRawData]);
    const indexRowOptionsByIndexId = useMemo(() => { return buildIndexDetailOptionsByIndexId(props.indexRawData); }, [props.indexRawData]);
    const articleLangOptions = useMemo(() => { return buildArticleLangOptions(); }, []);
    const selectedIndexId = String(props.formData.data?.SpecJournal?.JournalIndexId ?? "");
    const indexRowOptions = useMemo(() => { const dict = indexRowOptionsByIndexId[selectedIndexId] ?? {}; return dict; }, [indexRowOptionsByIndexId, selectedIndexId]);
    const prevIndexIdRef = useRef<string | null>(null);
    useEffect(() => {
        const prev = prevIndexIdRef.current;
        prevIndexIdRef.current = selectedIndexId;
        // 第一次進來不清（避免載入既有資料就被清空）
        if (prev === null) return;
        // Header 真的有變，才清空子項
        if (prev !== selectedIndexId) {
            props.formData.setFormData(prevData => {
                if (!prevData) return prevData;
                const next = { ...(prevData as SpecJournalSet) };
                const j = { ...(next.SpecJournal ?? {}) };
                // ✅ 子項回到空選項
                j[SpecJournalModelFields.JournalIndexRowId] = null;
                next.SpecJournal = j;
                return next;
            });
        }
    }, [selectedIndexId, props.formData]);
    useEffect(() => {
        // ✅ 表單載入後：若 ArticleLang 為空，預設寫入 zh-tw（DefaultLang）
        if (!props.formData.data) return;
        const current = String(props.formData.data?.SpecJournal?.ArticleLang ?? "");
        if (current) return;
        props.formData.setFormData(prev => {
            if (!prev) return prev;
            const next = { ...(prev as SpecJournalSet) };
            const j = { ...(next.SpecJournal ?? {}) };
            j[SpecJournalModelFields.ArticleLang] = DefaultLang; // 'zh-tw'
            next.SpecJournal = j;
            return next;
        });
    }, [props.formData.data, props.formData]);
    return (
        <>
            <div className="col-12 form-group">
                <LibDropList Style={props.theme.DropList2} Options={indexOptions} AutoDefaultFirst={false} {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.JournalIndexId, "string")} />
                <LibDropList Style={props.theme.DropList2} Options={indexRowOptions} AutoDefaultFirst={false}{...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.JournalIndexRowId, "string")} />
            </div>
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Title, "string")} />
            </div>
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Title_en, "string")} />
            </div>
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.PageStart, "number")} />
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.PageEnd, "number")} />
            </div>

            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.DOIUrl, "string")} />
            </div>

            <div className="col-12 form-group">
                <div className="row">
                    <div className="col-12 col-lg-6">
                        <LibFileInput LabelColClassName="col-sm-4" InputColClassName="col-sm-8"
                            {...setFileField(
                                SpecJournalSetFields.SpecJournal,
                                SpecJournalModelFields.JournalFileId,
                                SpecJournalModelFields.JournalFileName,
                                { defaultNameFromOriginal: "basename" }
                            )}
                            Accept="application/pdf" />
                    </div>
                    <div className="col-12 col-lg-6">
                        <LibFileInput LabelColClassName="col-sm-4" InputColClassName="col-sm-8" {...setFileField(
                            SpecJournalSetFields.SpecJournal,
                            SpecJournalModelFields.InsightPointFileId,
                            SpecJournalModelFields.InsightPointFileName,
                            { defaultNameFromOriginal: "basename" }
                        )}
                            Accept="application/pdf" />
                    </div>
                </div>
            </div>

            <div className="col-12 form-group">
                <LibDropList Style={props.theme.DropList2} Options={articleLangOptions} {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.ArticleLang, "string")} />
            </div>

            <div className="col-12 form-group">
                <LibTinyMCE Style={props.theme.TinyMCE} {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Memo, "string")} />
            </div>

            <div className="col-12 form-group">
                <LibTinyMCE Style={props.theme.TinyMCE} {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Memo_en, "string")} />
            </div>

        </>
    )
}
const AuthorComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet> }) => {
    const { publish } = useToast();
    const setField = useSetTableField<SpecJournalSet>(props.formData);
    const authors = props.formData.data?.SpecJournalAuthor ?? [];

    // ✅ UIUX：新增後要跳到新增的 tab
    const pendingActiveTabKeyRef = useRef<string | null>(null);
    // ✅ UIUX：若刪到當前 tab，要回到第一筆
    const pendingGoFirstRef = useRef<boolean>(false);
    // ✅ 追蹤目前 active tab key
    const activeTabKeyRef = useRef<string | null>(null);
    // ✅ 暫存 tab key/label mapping，供「回第一筆」使用
    const tabInfoRef = useRef<Record<string, string>>({});

    useEffect(() => {

        const handleClick = (e: MouseEvent) => {
            const el = e.target as HTMLElement | null;
            const btn = el?.closest?.('button[data-bs-toggle="tab"][data-bs-target^="#Tab_TWEN_"]') as HTMLButtonElement | null;
            if (!btn) return;

            const target = btn.getAttribute("data-bs-target") ?? "";
            const m = target.match(/^#Tab_TWEN_(.+)$/);
            const key = m?.[1] ?? null;
            if (key) activeTabKeyRef.current = key;
        };

        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [authors.length]);

    useEffect(() => {
        // 表單資料載入後：確保至少有一筆可編輯
        if (!props.formData.data) return;
        const current = props.formData.data.SpecJournalAuthor ?? [];
        if (current.length > 0) return;

        const firstItem: any = {
            JournalId: props.formData.data.SpecJournal?.JournalId,
            RowId: 1,
        };

        props.formData.setFormData({
            ...props.formData.data,
            SpecJournalAuthor: [firstItem],
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.formData.data]);

    useEffect(() => {
        // ✅ 新增後：跳到新增的 tab
        const pendingKey = pendingActiveTabKeyRef.current;
        if (pendingKey) {
            requestAnimationFrame(() => {
                activateTabByKey(pendingKey);
                pendingActiveTabKeyRef.current = null;
            });
            return;
        }

        // ✅ 刪除當前 tab：回第一筆
        if (pendingGoFirstRef.current) {
            requestAnimationFrame(() => {
                activateFirstTab();
                pendingGoFirstRef.current = false;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authors.length]);

    const getNextRowId = (): number => {
        // 以目前最大 RowId + 1 產生新 RowId
        const maxRowId = authors.reduce((max: number, a: any) => {
            const r = typeof a?.RowId === "number" ? a.RowId : 0;
            return r > max ? r : max;
        }, 0);

        return maxRowId + 1;
    };

    const buildTabLabel = (a: any, idx: number): string => {
        // Tab 名稱：AuthorName -> AuthorName_en -> 未命名
        const name = (a?.AuthorName ?? "").trim();
        if (name) return name;

        const nameEn = (a?.AuthorName_en ?? "").trim();
        if (nameEn) return nameEn;

        return `未命名${authors.length > 1 ? `(${idx + 1})` : ""}`;
    };

    const activateTabByKey = (key: string): void => {
        // 觸發 click 讓 bootstrap 切換 tab
        const btn = document.querySelector<HTMLButtonElement>(`button[data-bs-toggle="tab"][data-bs-target="#Tab_TWEN_${key}"]`);
        btn?.click();
    };

    const activateFirstTab = (): void => {
        // 回到第一筆：抓第一個可用的 tab key 觸發 click
        const firstKey = Object.keys(tabInfoRef.current).at(0);
        if (!firstKey) return;
        if (activeTabKeyRef.current === firstKey) return;
        activateTabByKey(firstKey);
    };

    const handleAdd = (): void => {
        // 新增作者：RowId = max + 1
        if (!props.formData.data) return;

        const nextRowId = getNextRowId();
        const parentJournalId = props.formData.data.SpecJournal?.JournalId ?? authors[0]?.JournalId;

        const newItem: any = {
            JournalId: parentJournalId,
            RowId: nextRowId,
        };

        pendingActiveTabKeyRef.current = String(nextRowId);
        activeTabKeyRef.current = String(nextRowId);

        props.formData.setFormData({
            ...props.formData.data,
            SpecJournalAuthor: [...(props.formData.data.SpecJournalAuthor ?? []), newItem],
        });
    };

    const removeOne = (rowKey: number | string): void => {
        // 刪除指定作者（RowId / index fallback）
        const keyStr = String(rowKey);

        if (activeTabKeyRef.current === keyStr) {
            pendingGoFirstRef.current = true;
        }

        props.formData.setFormData(prev => {
            if (!prev) return prev;

            const list = prev.SpecJournalAuthor ?? [];
            const hitIdx = list.findIndex((a: any, i: number) => String(a?.RowId ?? i) === keyStr);
            if (hitIdx < 0) return prev;

            const target = list[hitIdx];
            let nextList: any[];

            if (target?.RowId != null) {
                nextList = list.filter((a: any) => !(a?.JournalId === target?.JournalId && a?.RowId === target?.RowId));
            } else {
                nextList = list.filter((_, i) => i !== hitIdx);
            }

            return { ...prev, SpecJournalAuthor: nextList };
        });
    };

    // ORCID onblur
    const normalizeOrcid = (v: string): string => {
        return (v ?? "").trim().replace(/\s+/g, "").replace(/[^0-9-]/g, "");
    };
    const isLikelyOrcid = (v: string): boolean => {
        return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(v);
    };
    // ✅ 只覆寫空欄位（避免蓋掉使用者已輸入的內容）
    const applyAuthorFromOrcid = (rowKeys: any, dto: any): void => {
        props.formData.setFormData(prev => {
            if (!prev) return prev;

            const list: any[] = (prev as any).SpecJournalAuthor ?? [];
            const hitIdx = list.findIndex(a =>
                String(a?.[SpecJournalAuthorFields.JournalId] ?? "") === String(rowKeys?.[SpecJournalAuthorFields.JournalId] ?? "") &&
                String(a?.[SpecJournalAuthorFields.RowId] ?? "") === String(rowKeys?.[SpecJournalAuthorFields.RowId] ?? "")
            );
            if (hitIdx < 0) return prev;

            const cur = { ...(list[hitIdx] ?? {}) };

            const setIfEmpty = (field: string, value: any) => {
                const oldVal = String(cur?.[field] ?? "").trim();
                const nextVal = String(value ?? "").trim();
                if (!oldVal && nextVal) cur[field] = nextVal;
            };

            // 依你 DTO 欄位回填
            setIfEmpty(SpecJournalAuthorFields.ORCID, dto?.ORCID);
            setIfEmpty(SpecJournalAuthorFields.AuthorName, dto?.AuthorName);
            setIfEmpty(SpecJournalAuthorFields.AuthorName_en, dto?.AuthorName_en);
            setIfEmpty(SpecJournalAuthorFields.JobTitle, dto?.JobTitle);
            setIfEmpty(SpecJournalAuthorFields.Unit, dto?.Unit);
            setIfEmpty(SpecJournalAuthorFields.Unit_en, dto?.Unit_en);
            setIfEmpty(SpecJournalAuthorFields.Email, dto?.Email);
            setIfEmpty(SpecJournalAuthorFields.Country, dto?.Country);

            const nextList = [...list];
            nextList[hitIdx] = cur;

            return { ...(prev as any), SpecJournalAuthor: nextList };
        });
    };

    // ✅ onBlur：打後端 /Service/SpecJournal/GetAuthorByOrcid
    const handleOrcidBlur = async (rowKeys: any, raw: string): Promise<void> => {

        const orcid = normalizeOrcid(raw);
        if (!orcid) return;

        // 不像 ORCID 就不打（避免一直打 API）
        if (!isLikelyOrcid(orcid)) return;

        try {
            const url = `/Service/SpecJournal/GetAuthorByOrcid?orcid=${encodeURIComponent(orcid)}`;

            const resp = await fetch(url, {
                method: "GET",
                credentials: "include",
                headers: {
                    // 你前端有全域帶 Accept-Language；這裡直接用瀏覽器語系先頂著即可
                    "Accept-Language": navigator.language || "zh-TW",
                },
            });

            const json: ApiResponse<ORCIDData> = await resp.json();

            (json.SysMessage ?? []).forEach(item => { publish({ level: item.Status, code: item.MessageCode, text: item.Message }); });

            // ✅ 只有 error 才算失敗
            if (!json?.IsSuccess) return;

            const dto = Array.isArray(json?.Data) ? json.Data[0] : null;
            if (!dto) return;

            applyAuthorFromOrcid(rowKeys, dto);
        } catch {
            // 這裡不丟錯（避免 blur 造成使用者卡住）
        }
    };

    // tab key/label mapping（同步到 ref）
    const tabItemMap = authors.reduce<Record<string, string>>((acc, a: any, idx: number) => {
        const key = String(a?.RowId ?? idx);
        acc[key] = buildTabLabel(a, idx);
        return acc;
    }, {});
    tabInfoRef.current = tabItemMap;

    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: tabItemMap,
        onAddTab: () => { handleAdd(); },
        onRemoveTab: (key) => removeOne(key),
    };

    const tabContent = authors.reduce<Record<string, React.ReactNode[]>>((acc, a: any, idx: number) => {
        const tabKey = String(a?.RowId ?? idx);
        const rowKeys: any = {
            [SpecJournalAuthorFields.JournalId]: a?.JournalId,
            [SpecJournalAuthorFields.RowId]: a?.RowId,
        };

        acc[tabKey] = [
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalSetFields.SpecJournalAuthor, SpecJournalAuthorFields.ORCID, "string", rowKeys)}
                    onBlur={(v) => void handleOrcidBlur(rowKeys, v)}
                />

            </div>,
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalAuthor, SpecJournalAuthorFields.AuthorName, "string", rowKeys)} />
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalAuthor, SpecJournalAuthorFields.AuthorName_en, "string", rowKeys)} />
            </div>,
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalAuthor, SpecJournalAuthorFields.JobTitle, "string", rowKeys)} />
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalAuthor, SpecJournalAuthorFields.Country, "string", rowKeys)} />
            </div>,
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalAuthor, SpecJournalAuthorFields.Unit, "string", rowKeys)} />
                <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalAuthor, SpecJournalAuthorFields.Unit_en, "string", rowKeys)} />
            </div>,
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalAuthor, SpecJournalAuthorFields.Email, "string", rowKeys)} />
            </div>,
        ];

        return acc;
    }, {});

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

const BibliographyComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet> }) => {
    const setField = useSetTableField<SpecJournalSet>(props.formData);
    const rows = (props.formData.data?.SpecJournalBibliography ?? []).map((r) => ({ ...r, RowId: r.RowId ?? undefined, }));
    const commitRows = (nextRows: SpecJournalBibliography[]) => {
        // ✅ 提交回整份表單（關鍵：真正更新 formData）
        props.formData.setFormData(prev => ({
            ...(prev ?? ({} as SpecJournalSet)),
            SpecJournalBibliography: nextRows,
        }));
    };

    const addRow = (): void => {
        // ✅ 新增一組參考文獻資料（明細列）
        const parentJournalId = props.formData.data?.SpecJournal?.JournalId ?? rows[0]?.JournalId;
        const nextRowId = getNextRowId(rows);
        const newItem: SpecJournalBibliography = { JournalId: parentJournalId, RowId: nextRowId, Title: "", Title_en: "", Url: "", };
        commitRows([...rows, newItem]);
    };

    const removeRow = (rowId: number): void => {
        // ✅ 刪除指定 RowId 的一組參考文獻資料
        const next = rows.filter((x: SpecJournalBibliography) => Number(x?.RowId ?? 0) !== rowId);
        commitRows(next);
    };

    return (
        <div role="group" className="mt-2">
            {rows.map((r: SpecJournalBibliography, i: number) => {
                const rowId = Number(r?.RowId ?? i + 1);
                const rowKeys: SpecJournalBibliography = { [SpecJournalBibliographyFields.JournalId]: r?.JournalId, [SpecJournalBibliographyFields.RowId]: r?.RowId, };
                return (
                    <div key={`bib-${rowId}`} className="border rounded p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                            <div className="w-100">
                                <div className="col-12 form-group">
                                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalBibliography, SpecJournalBibliographyFields.Title, "string", rowKeys)} />
                                </div>

                                <div className="col-12 form-group">
                                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalBibliography, SpecJournalBibliographyFields.Title_en, "string", rowKeys)} />
                                </div>

                                <div className="col-12 form-group">
                                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalBibliography, SpecJournalBibliographyFields.Url, "string", rowKeys)} />
                                </div>
                            </div>
                            <button type="button" className="btn btn-sm btn-light" aria-label={`刪除參考文獻第 ${i + 1} 組`} onClick={() => removeRow(rowId)}>
                                ×
                            </button>
                        </div>
                    </div>
                );
            })}
            <button type="button" onClick={addRow} aria-label="新增參考文獻" className="btn btn-outline-primary mb-3">
                新增參考文獻
            </button>
        </div>
    );
};
const TAB_PREFIX = "REF_";
const RefFormatComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet> }) => {
    const setField = useSetTableField<SpecJournalSet>(props.formData);
    const formats = props.formData.data?.SpecJournalRefFormat ?? [];

    // ✅ UIUX：新增後要跳到新增的 tab
    const pendingActiveTabKeyRef = useRef<string | null>(null);
    // ✅ UIUX：若刪到當前 tab，要回到第一筆
    const pendingGoFirstRef = useRef<boolean>(false);
    // ✅ 追蹤目前 active tab key
    const activeTabKeyRef = useRef<string | null>(null);
    // ✅ 暫存 tab key/label mapping，供「回第一筆」使用
    const tabInfoRef = useRef<Record<string, string>>({});

    useEffect(() => {

        const handleClick = (e: MouseEvent) => {
            const el = e.target as HTMLElement | null;
            const btn = el?.closest?.(`button[data-bs-toggle="tab"][data-bs-target^="#Tab_TWEN_${TAB_PREFIX}"]`) as HTMLButtonElement | null;
            if (!btn) return;
            const target = btn.getAttribute("data-bs-target") ?? "";
            const m = target.match(new RegExp(`^#Tab_TWEN_${TAB_PREFIX}(.+)$`));
            const key = m?.[1] ?? null;
            if (key) activeTabKeyRef.current = key;
        };

        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [formats.length]);

    useEffect(() => {
        // 表單資料載入後：確保至少有一筆可編輯
        if (!props.formData.data) return;
        const current = props.formData.data.SpecJournalRefFormat ?? [];
        if (current.length > 0) return;

        const firstItem: any = {
            JournalId: props.formData.data.SpecJournal?.JournalId,
            RowId: 1,
        };

        props.formData.setFormData({
            ...props.formData.data,
            SpecJournalRefFormat: [firstItem],
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.formData.data]);

    useEffect(() => {
        // ✅ 新增後：跳到新增的 tab
        const pendingKey = pendingActiveTabKeyRef.current;
        if (pendingKey) {
            requestAnimationFrame(() => {
                activateTabByKey(pendingKey);
                pendingActiveTabKeyRef.current = null;
            });
            return;
        }

        // ✅ 刪除當前 tab：回第一筆
        if (pendingGoFirstRef.current) {
            requestAnimationFrame(() => {
                activateFirstTab();
                pendingGoFirstRef.current = false;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formats.length]);

    const getNextRowId = (): number => {
        // 以目前最大 RowId + 1 產生新 RowId
        const maxRowId = formats.reduce((max: number, f: any) => {
            const r = typeof f?.RowId === "number" ? f.RowId : 0;
            return r > max ? r : max;
        }, 0);

        return maxRowId + 1;
    };

    const buildTabLabel = (f: any, idx: number): string => {
        // Tab 名稱：Title -> 未命名
        const title = (f?.Title ?? "").trim();
        if (title) return title;
        return `未命名${formats.length > 1 ? `(${idx + 1})` : ""}`;
    };

    const activateTabByKey = (key: string): void => {
        // 觸發 click 讓 bootstrap 切換 tab
        const btn = document.querySelector<HTMLButtonElement>(`button[data-bs-toggle="tab"][data-bs-target="#Tab_TWEN_${TAB_PREFIX}${key}"]`);
        btn?.click();
    };

    const activateFirstTab = (): void => {
        // 回到第一筆：抓第一個可用的 tab key 觸發 click
        const firstKey = Object.keys(tabInfoRef.current).at(0);
        if (!firstKey) return;
        const rawKey = firstKey.replace(TAB_PREFIX, "");
        if (activeTabKeyRef.current === rawKey) return;
        activateTabByKey(firstKey);
    };

    const handleAdd = (): void => {
        // 新增引文格式：RowId = max + 1
        if (!props.formData.data) return;

        const nextRowId = getNextRowId();
        const parentJournalId = props.formData.data.SpecJournal?.JournalId ?? formats[0]?.JournalId;

        const newItem: any = {
            JournalId: parentJournalId,
            RowId: nextRowId,
        };

        pendingActiveTabKeyRef.current = String(nextRowId);
        activeTabKeyRef.current = String(nextRowId);

        props.formData.setFormData({
            ...props.formData.data,
            SpecJournalRefFormat: [...(props.formData.data.SpecJournalRefFormat ?? []), newItem],
        });
    };

    const removeOne = (rowKey: number | string): void => {
        // 刪除指定引文格式（RowId / index fallback）
        const keyStr = String(rowKey);

        if (activeTabKeyRef.current === keyStr) {
            pendingGoFirstRef.current = true;
        }

        props.formData.setFormData(prev => {
            if (!prev) return prev;

            const list = prev.SpecJournalRefFormat ?? [];
            const hitIdx = list.findIndex((f: any, i: number) => String(f?.RowId ?? i) === keyStr);
            if (hitIdx < 0) return prev;

            const target = list[hitIdx];
            let nextList: any[];

            if (target?.RowId != null) {
                nextList = list.filter((f: any) => !(f?.JournalId === target?.JournalId && f?.RowId === target?.RowId));
            } else {
                nextList = list.filter((_, i) => i !== hitIdx);
            }

            return { ...prev, SpecJournalRefFormat: nextList };
        });
    };

    // tab key/label mapping（同步到 ref）
    const tabItemMap = formats.reduce<Record<string, string>>((acc, f: any, idx: number) => {
        const rawKey = String(f?.RowId ?? idx);
        const tabKey = `${TAB_PREFIX}${rawKey}`;
        acc[tabKey] = buildTabLabel(f, idx);
        return acc;
    }, {});
    tabInfoRef.current = tabItemMap;

    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: tabItemMap,
        onAddTab: () => { handleAdd(); },
        onRemoveTab: (key) => removeOne(key),
    };

    const tabContent = formats.reduce<Record<string, React.ReactNode[]>>((acc, f: any, idx: number) => {
        const rawKey = String(f?.RowId ?? idx);
        const tabKey = `${TAB_PREFIX}${rawKey}`;
        const rowKeys: any = {
            [SpecJournalRefFormatFields.JournalId]: f?.JournalId,
            [SpecJournalRefFormatFields.RowId]: f?.RowId,
        };

        acc[tabKey] = [
            <div className="col-12 form-group">
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecJournalSetFields.SpecJournalRefFormat, SpecJournalRefFormatFields.Title, "string", rowKeys)} />
                <LibTinyMCE Style={props.theme.TinyMCE} {...setField(SpecJournalSetFields.SpecJournalRefFormat, SpecJournalRefFormatFields.Content, "string", rowKeys)} />
            </div>,
        ];

        return acc;
    }, {});

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};
const FilesComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet> }) => {
    return (<>
        <div className="panel">
            <div className="panel-body">
                <p>開放觀點</p>
                <OpenPointComp {...props} />
            </div>
        </div>

        <div className="panel">
            <div className="panel-body">
                <p>相關檔案</p>
                <RefFilesComp {...props} />
            </div>
        </div>

    </>)
}
const OpenPointComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet>; }) => {
    const setFileField = useSetTableFileField(props.formData);
    const allFiles: SpecJournalOpenPointFiles[] = props.formData.data?.SpecJournalOpenPointFiles ?? [];
    // 提交回整份表單（關鍵：真正更新 formData）
    const commitFiles = (nextFiles: SpecJournalOpenPointFiles[]) => {
        props.formData.setFormData(prev => ({
            ...(prev ?? { SpecJournal: {}, SpecJournalAuthor: [], SpecJournalRefFiles: [], SpecJournalRefFormat: [], SpecJournalOpenPointFiles: [], SpecJournalTags: [], SpecJournalTypes: [] }),
            SpecJournalOpenPointFiles: nextFiles,
        }));
    };
    // 新增一筆附件列
    const addFile = () => {
        const list = allFiles;
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: SpecJournalOpenPointFiles = { RowId: nextRowId, OpenPointFileId: "", OpenPointFileName: "", };
        commitFiles([...allFiles, newItem]);
    };
    // 刪除第 i 筆附件列
    const removeFileAt = (i: number) => {
        const filtered = allFiles;
        const target = filtered[i];
        if (!target) return;
        const nextAll = allFiles.filter(f => !(f.RowId === target.RowId));
        commitFiles(nextAll);
    };
    return (
        <>
            <div role="group" className="mt-4">
                <button type="button" onClick={addFile} aria-label="新增附件" className="btn btn-outline-primary mb-2">新增附件</button>
                {allFiles.map((f, i) => {
                    const rowKeys = { [SpecJournalOpenPointFilesFields.JournalId]: f.JournalId, [SpecJournalOpenPointFilesFields.RowId]: f.RowId, }
                    return (
                        <div key={`${f.RowId}`} className="flex items-center gap-2 mb-2">
                            <LibFileInput

                                // 直接展開！只要給：表名、id欄位、name欄位(可選)、rowKeys(可選)、options(可選)
                                {...setFileField(
                                    SpecJournalSetFields.SpecJournalOpenPointFiles,
                                    SpecJournalOpenPointFilesFields.OpenPointFileId,      // ← internalId 欄位
                                    SpecJournalOpenPointFilesFields.OpenPointFileName,       // ← 檔名欄位（可省略）
                                    rowKeys,                               // ← 指定哪一列
                                    { defaultNameFromOriginal: "basename" }               // ← 第一次上傳自動帶入不含副檔名
                                )}
                                // 其他 UI 行為仍由你自己控制
                                Accept="application/pdf"
                                onDelete={() => removeFileAt(i)}
                            />
                        </div>
                    )
                })}
            </div>
        </>
    );
};
const RefFilesComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet>; }) => {
    const setFileField = useSetTableFileField(props.formData);
    const allFiles: SpecJournalRefFiles[] = props.formData.data?.SpecJournalRefFiles ?? [];
    // 提交回整份表單（關鍵：真正更新 formData）
    const commitFiles = (nextFiles: SpecJournalRefFiles[]) => {
        props.formData.setFormData(prev => ({
            ...(prev ?? { SpecJournal: {}, SpecJournalAuthor: [], SpecJournalRefFiles: [], SpecJournalRefFormat: [], SpecJournalOpenPointFiles: [], SpecJournalTags: [], SpecJournalTypes: [] }),
            SpecJournalRefFiles: nextFiles,
        }));
    };
    // 新增一筆附件列
    const addFile = () => {
        const list = allFiles;
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: SpecJournalRefFiles = { RowId: nextRowId, RefFileId: "", RefFileName: "", };
        commitFiles([...allFiles, newItem]);
    };
    // 刪除第 i 筆附件列
    const removeFileAt = (i: number) => {
        const filtered = allFiles;
        const target = filtered[i];
        if (!target) return;
        const nextAll = allFiles.filter(f => !(f.RowId === target.RowId));
        commitFiles(nextAll);
    };
    return (
        <>
            <div role="group" className="mt-4">
                <button type="button" onClick={addFile} aria-label="新增附件" className="btn btn-outline-primary mb-2">新增附件</button>
                {allFiles.map((f, i) => {
                    const rowKeys = { [SpecJournalRefFilesFields.JournalId]: f.JournalId, [SpecJournalRefFilesFields.RowId]: f.RowId, }
                    return (
                        <div key={`${f.RowId}`} className="flex items-center gap-2 mb-2">
                            <LibFileInput
                                // 直接展開！只要給：表名、id欄位、name欄位(可選)、rowKeys(可選)、options(可選)
                                {...setFileField(
                                    SpecJournalSetFields.SpecJournalRefFiles,
                                    SpecJournalRefFilesFields.RefFileId,      // ← internalId 欄位
                                    SpecJournalRefFilesFields.RefFileName,       // ← 檔名欄位（可省略）
                                    rowKeys,                               // ← 指定哪一列
                                    { defaultNameFromOriginal: "basename" }               // ← 第一次上傳自動帶入不含副檔名
                                )}
                                // 其他 UI 行為仍由你自己控制
                                Accept="application/pdf"
                                onDelete={() => removeFileAt(i)}
                            />
                        </div>
                    )
                })}
            </div>
        </>
    );
};
const KeywordComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet>; tagOptionsRaw: Record<string, string>; keywords: SpecJournalSet[]; }) => {
    const data = props.formData.data ?? {};
    const types = data.SpecJournalTypes ?? [];
    const tags = data.SpecJournalKeywords ?? [];
    const typeOptions = useMemo(() => { const dict = props.tagOptionsRaw ?? {}; return Object.entries(dict).map(([tagId, label]) => ({ tagId, label, })); }, [props.tagOptionsRaw]);
    const isTypeChecked = useCallback((tagId: string): boolean => {
        // 勾選代表 SpecJournalTypes 明細中存在該 TagId
        return (types as any[]).some(x => String(x?.TagId ?? "") === tagId);
    }, [types]);
    const toggleType = useCallback((tagId: string, checked: boolean): void => {
        // 勾/取消勾：同步更新 SpecJournalTypes 明細列
        props.formData.setFormData(prev => {
            const p = prev ?? {};
            const cur = (p as any).SpecJournalTypes ?? [];

            if (checked) {
                if (cur.some((x: any) => String(x?.TagId ?? "") === tagId)) return p;

                const nextRowId = getNextRowId(cur);
                const next = [...cur, { RowId: nextRowId, TagId: tagId }];
                return { ...(p as any), SpecJournalTypes: next };
            }

            const next = cur.filter((x: any) => String(x?.TagId ?? "") !== tagId);
            return { ...(p as any), SpecJournalTypes: next };
        });
    }, [props.formData]);
    /** =========================
     *  SpecJournalKeywords（中/英標籤）
     * ========================= */
    const [zhInput, setZhInput] = useState<string>("");
    const [enInput, setEnInput] = useState<string>("");
    const zhDebounced = useDebouncedValue(zhInput, 200);
    const enDebounced = useDebouncedValue(enInput, 200);
    const [zhSuggestions, setZhSuggestions] = useState<Array<{ TagId: string; TagName: string }>>([]);
    const [enSuggestions, setEnSuggestions] = useState<Array<{ TagId: string; TagName: string }>>([]);

    const keywordPool = useMemo(() => {
        // ✅ 從整站 rawData 攤平出 keywords，依語系分組 + 去重
        const zh = new Set<string>();
        const en = new Set<string>();
        (props.keywords ?? []).forEach(s => {
            (s as any)?.SpecJournalKeywords?.forEach((k: any) => {
                const lang = String(k?.LangCode ?? "").toLowerCase();
                const kw = String(k?.Keyword ?? "").trim();
                if (!kw) return;
                if (lang === "zh-tw") zh.add(kw);
                if (lang === "en") en.add(kw);
            });
        });
        return { zh: Array.from(zh), en: Array.from(en), };
    }, [props.keywords]);


    useEffect(() => {
        const q = zhDebounced.trim();
        if (q.length < 2) { setZhSuggestions([]); return; }
        const hit = keywordPool.zh.filter(x => x.toLowerCase().includes(q.toLowerCase())).slice(0, 20).map((x, i) => ({ TagId: `${i}`, TagName: x }));
        setZhSuggestions(hit);
    }, [zhDebounced, keywordPool.zh]);

    useEffect(() => {
        const q = enDebounced.trim();
        if (q.length < 2) { setEnSuggestions([]); return; }
        const hit = keywordPool.en.filter(x => x.toLowerCase().includes(q.toLowerCase())).slice(0, 20).map((x, i) => ({ TagId: `${i}`, TagName: x }));
        setEnSuggestions(hit);
    }, [enDebounced, keywordPool.en]);

    const addKeyword = useCallback((lang: Lang, name: string): void => {
        const value = name.trim();
        if (!value) return;
        props.formData.setFormData(prev => {
            const p = prev ?? {};
            const cur = (p as any).SpecJournalKeywords ?? [];
            const exists = cur.some((x: any) => String(x?.LangCode ?? "") === lang && String(x?.Keyword ?? "").trim().toLowerCase() === value.toLowerCase());
            if (exists) return p;
            const nextRowId = getNextRowId(cur);
            const next = [...cur, { RowId: nextRowId, LangCode: lang, Keyword: value }];
            return { ...(p as any), SpecJournalKeywords: next };
        });
        if (lang === "zh-tw") setZhInput("");
        if (lang === "en") setEnInput("");
    }, [props.formData]);

    const removeKeyword = useCallback((rowId: number): void => {
        props.formData.setFormData(prev => {
            const p = prev ?? {};
            const cur = (p as any).SpecJournalKeywords ?? [];
            const next = cur.filter((x: any) => Number(x?.RowId ?? 0) !== rowId);
            return { ...(p as any), SpecJournalKeywords: next };
        });
    }, [props.formData]);
    const renderKeywordChips = (lang: Lang) => {
        const list = (tags as any[]).filter(x => String(x?.LangCode ?? "") === lang);
        return (
            <div className="d-flex flex-wrap gap-2 mt-2" aria-label={lang === "zh-tw" ? "中文標籤清單" : "英文標籤清單"}>
                {list.map((x: any) => (
                    <span key={`${lang}-${x.RowId}`} className="badge bg-secondary d-inline-flex align-items-center gap-2">
                        <span>{String(x?.Keyword ?? "")}</span>
                        <button type="button" className="btn btn-sm btn-light" aria-label={`移除標籤 ${String(x?.Keyword ?? "")}`} onClick={() => removeKeyword(Number(x?.RowId ?? 0))}>
                            ×
                        </button>
                    </span>
                ))}
            </div>
        );
    };

    const renderSuggestList = (items: Array<{ TagId: string; TagName: string }>, onPick: (name: string) => void) => {
        if (items.length <= 0) return null;
        return (
            <div className="border rounded mt-1 p-2" role="listbox" aria-label="建議標籤清單">
                {items.map(x => (
                    <button key={x.TagId} type="button" className="btn btn-link d-block text-start w-100" onClick={() => onPick(x.TagName)} aria-label={`加入建議標籤 ${x.TagName}`}>
                        {x.TagName}
                    </button>
                ))}
            </div>
        );
    };
    return (
        <>
            {/* =========================
             *  1) SpecJournalTypes
             * ========================= */}
            <div className="col-12 form-group">
                <label className="form-label fw-bold">期刊類型（可多選）</label>

                <div className="d-flex flex-wrap gap-3" role="group" aria-label="期刊類型多選">
                    {typeOptions.map(opt => (
                        <div key={opt.tagId} className="form-check">
                            <input className="form-check-input" type="checkbox" id={`journal-type-${opt.tagId}`} checked={isTypeChecked(opt.tagId)} onChange={(e) => toggleType(opt.tagId, e.target.checked)} />
                            <label className="form-check-label" htmlFor={`journal-type-${opt.tagId}`}>
                                {opt.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <hr className="my-4" />
            {/* =========================
             *  2) SpecJournalKeywords（zh/en）
             * ========================= */}
            <div className="col-12 form-group">
                <label className="form-label fw-bold" htmlFor="kw-zh-input">關鍵字（中文）</label>
                <div className="d-flex gap-2">
                    <input id="kw-zh-input" className="form-control" value={zhInput} onChange={(e) => setZhInput(e.target.value)} onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            addKeyword("zh-tw", zhInput);
                        }
                    }}
                        placeholder="輸入後停止 1 秒會自動搜尋，Enter 可直接加入"
                        aria-label="輸入中文關鍵字"
                    />
                    <button type="button" className="btn btn-primary" onClick={() => addKeyword("zh-tw", zhInput)} aria-label="加入中文關鍵字">
                        Add
                    </button>
                </div>
                {renderSuggestList(zhSuggestions, (name) => addKeyword("zh-tw", name))}
                {renderKeywordChips("zh-tw")}
            </div>

            <div className="col-12 form-group mt-4">
                <label className="form-label fw-bold" htmlFor="kw-en-input">Keywords (English)</label>
                <div className="d-flex gap-2">
                    <input id="kw-en-input" className="form-control" value={enInput} onChange={(e) => setEnInput(e.target.value)} onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            addKeyword("en", enInput);
                        }
                    }}
                        placeholder="Stop typing for 1s to search, press Enter to add"
                        aria-label="Input English keyword"
                    />
                    <button type="button" className="btn btn-primary" onClick={() => addKeyword("en", enInput)} aria-label="Add English keyword">
                        Add
                    </button>
                </div>
                {renderSuggestList(enSuggestions, (name) => addKeyword("en", name))}
                {renderKeywordChips("en")}
            </div>
        </>
    );
};
/** ✅ 共用：取下一個 RowId（明細用） */
const getNextRowId = (rows: Array<{ RowId?: number }> = []): number => {
    // 取最大 RowId + 1
    const maxId = rows.reduce((max, r) => (typeof r.RowId === "number" && r.RowId > max ? r.RowId : max), 0);
    return maxId + 1;
};
/** ✅ 共用：debounce（停止輸入 delayMs 後才更新值） */
const useDebouncedValue = (value: string, delayMs: number): string => {
    const [debounced, setDebounced] = useState<string>(value);

    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(t);
    }, [value, delayMs]);

    return debounced;
};
/** ✅ Header 下拉：IndexId -> IndexName */
const buildIndexHeaderOptions = (rawData: SpecJournalIndexSet[] = []): Record<string, string> => {
    // 轉成下拉可用的 dict
    return rawData.reduce<Record<string, string>>((acc, x) => {
        const id = String(x?.SpecJournalIndex?.IndexId ?? "");
        const name = String(x?.SpecJournalIndex?.IndexName ?? "");
        if (!id) return acc;
        acc[id] = name || id;
        return acc;
    }, {});
};
/** ✅ Detail 下拉：IndexId -> (RowId -> "X卷Y期") */
const buildIndexDetailOptionsByIndexId = (rawData: SpecJournalIndexSet[] = []): Record<string, Record<string, string>> => {
    // 依 header(IndexId) 分組 detail(RowId)
    return rawData.reduce<Record<string, Record<string, string>>>((acc, x) => {
        const indexId = String(x?.SpecJournalIndex?.IndexId ?? "");
        if (!indexId) return acc;
        const details = (x?.SpecJournalIndexDetail ?? []) as SpecJournalIndexDetailSet[];
        const dict = details.reduce<Record<string, string>>((dAcc, d) => {
            const rowId = String(d?.RowId ?? "");
            if (!rowId) return dAcc;
            const v = d?.Volume ?? "";
            const i = d?.Issue ?? "";
            const label = `${v}卷${i}期`; // ✅ 你要的顯示名稱
            dAcc[rowId] = label;
            return dAcc;
        }, {});
        acc[indexId] = dict;
        return acc;
    }, {});
};
/** ✅ ArticleLang 下拉：LangCode -> 顯示名稱（來源：lang.ts） */
const buildArticleLangOptions = (): Record<string, string> => {
    return SUPPORTED_LANGS.reduce<Record<string, string>>((acc, lang) => {
        acc[String(lang)] = LangLabelMap[lang] ?? String(lang);
        return acc;
    }, {});
};

///

const useIndexDataByAdapter = (adapter: ReturnType<typeof SpecJournalIndexAdapter>) => {
    // 宣告變數
    const q = adapter.hooks.useQueryList({
        condition: {
            Fields: [
                SpecJournalIndexModelFields.IndexId,
                SpecJournalIndexModelFields.IndexName,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            ],
            Condition: "",
            OrderBy: [{ Col: SpecJournalIndexModelFields.CreateTime, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        },
        deps: [],
    });

    // return
    return {
        rawData: q.data ?? [],
        isLoading: q.isLoading,
        error: q.errorText,
    };
};

const useKeywordsDataByAdapter = (adapter: ReturnType<typeof SpecJournalAdapter>) => {
    // 宣告變數
    const q = adapter.hooks.useQueryList({
        condition: {
            Fields: [
                `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.LangCode}`,
                `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword}`,
            ],
            Condition: "",
            OrderBy: [{ Col: SpecJournalIndexModelFields.CreateTime, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        },
        deps: [],
    });

    // return
    return {
        rawData: q.data ?? [],
        isLoading: q.isLoading,
        error: q.errorText,
    };
};
