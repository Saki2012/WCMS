import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { LibTextBox, LibFileInput, LibCalendar, LibCheckBox } from "@/SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";

import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { type Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { useSetTableField, useSetTableFileField } from "@/SysCore/Components/FormField/useSetTableField";
import { SpecJournalIndexDetailFields, SpecJournalIndexModelFields, SpecJournalIndexSetFields } from "@/types/SchemaFields";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";

import type { ApiAdapterError, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";

import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";

import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournalIndex_Api";
import { PGID } from "@/types/SchemaFields";

type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"]
type SpecJournalIndexDetail = components["schemas"]["SpecJournalIndexDetail_DTO"]

const emptyData: SpecJournalIndexSet = {}

export const Server_SpecJournalIndex_Form_Comp = (prop: { theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const adapter = useMemo(() => SpecJournalIndexAdapter(), []);
    const categoryAdapter = useMemo(() => CategoryAdapter(), []);
    const formData = useSpecJournalIndexFormDataByAdapter(adapter, internalId ?? "", emptyData);

    const useCategory = categoryAdapter.hooks.useMapByProgId({ progId: PGID.SpecJournalIndex, lang: prop.lang });
    const publishStatusOpts = useFetchEnumOptions("PublishStatus");

    const onBackToList = useCallback(() => {
        // 執行 function：回列表
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);

    const actions = useSpecJournalIndexFormActionsFromAdapter(
        adapter,
        internalId ?? "",
        formData.data,
        onBackToList,
    );

    const isLoading = [formData.isLoading, useCategory.isLoading, publishStatusOpts.isLoading];
    const errors = [formData.error, useCategory.errorText, publishStatusOpts.error];
    const formProp: FormCompProp = { Title: "期刊目次", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions };

    return (
        <FormComp prop={formProp}>
            <MainFormComp theme={prop.theme} formData={formData} />
            <DetailComp theme={prop.theme} formData={formData} publishStatusOpts={publishStatusOpts.data} />
        </FormComp>
    )
}

/** FormData：QueryData + ModelDisplayName（對標 Server_Announcement_Form_Comp） */
const useSpecJournalIndexFormDataByAdapter = (
    adapter: ReturnType<typeof SpecJournalIndexAdapter>,
    internalId: string,
    empty: SpecJournalIndexSet,
): UseFetchFormDataResult<SpecJournalIndexSet> => {
    // 宣告變數
    const { publish } = useToast();
    const internalKey = internalId || "__new__";
    const isNew = useMemo(() => !internalId, [internalId]);

    const initial = useMemo<ApiLoaderData<string, SpecJournalIndexSet> | null>(() => {
        if (!isNew) return null;
        const ok: ApiResponse<SpecJournalIndexSet> = { IsSuccess: true, Data: empty, SysMessage: [] };
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

    const [data, setData] = useState<SpecJournalIndexSet>(empty);

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

/** Actions：改用 Adapter.useServerActions（對標 Server_Announcement_Form_Comp） */
const useSpecJournalIndexFormActionsFromAdapter = (
    adapter: ReturnType<typeof SpecJournalIndexAdapter>,
    internalId: string,
    formData: SpecJournalIndexSet,
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

const MainFormComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalIndexSet>; }) => {
    const tabInfo: LibTabsProp = { Style: prop.theme.Tabs, item: { "Basic": "基本資料", "System": "系統資訊" } }
    const components: Record<string, React.ReactNode[]> = {
        Basic: [<BasicComp theme={prop.theme} formData={prop.formData} />],
        System: [<SystemInfoTabComp theme={prop.theme} formData={prop.formData} setKey={SpecJournalIndexSetFields.SpecJournalIndex} />]
    }
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>
}

const BasicComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalIndexSet> }) => {
    const setField = useSetTableField<SpecJournalIndexSet>(props.formData);

    return (
        <div className="col-12 form-group">
            <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.IndexName, "string")} />
        </div>
    )
}

const DetailComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalIndexSet>; publishStatusOpts: Record<string, string> }) => {
    const setField = useSetTableField<SpecJournalIndexSet>(props.formData);
    const setFileField = useSetTableFileField<SpecJournalIndexSet>(props.formData);
    const details = (props.formData.data)?.SpecJournalIndexDetail ?? [];
    // ✅ UIUX：新增後要跳到新增的 tab
    const pendingActiveTabKeyRef = useRef<string | null>(null);
    // ✅ UIUX：若刪到當前 tab，要回到第一筆
    const pendingGoFirstRef = useRef<boolean>(false);
    // ✅ 追蹤目前 active tab key（用事件監聽，不靠 DOM active class）
    const activeTabKeyRef = useRef<string | null>(null);

    useEffect(() => {
        // 初始化：預設第一筆就是 active
        if (!activeTabKeyRef.current) {
            const firstKey = details.length > 0 ? String(details[0].RowId ?? 0) : null;
            activeTabKeyRef.current = firstKey;
        }
        const handleClick = (e: MouseEvent) => {
            const el = e.target as HTMLElement | null;
            const btn = el?.closest?.('button[data-bs-toggle="tab"][data-bs-target^="#Tab_TWEN_"]') as HTMLButtonElement | null;
            if (!btn) return;
            const target = btn.getAttribute("data-bs-target") ?? "";
            const m = target.match(/^#Tab_TWEN_(.+)$/);
            const key = m?.[1] ?? null;
            if (key) activeTabKeyRef.current = key;
        };
        // capture=true：更早攔到事件（不受 stopPropagation 影響）
        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [details.length]);

    const getNextRowId = (): number => {
        // 以目前最大 RowId + 1 產生新 RowId
        const maxRowId = details.reduce((max, d: SpecJournalIndexDetail) => {
            return d.RowId && d.RowId > max ? d.RowId : max;
        }, 0);

        return maxRowId + 1;
    };

    const getBaseVolume = (): number => {
        // 新增項目：卷預設帶入第一筆（若第一筆沒有則給 1）
        const firstVolume = details[0]?.Volume;
        return typeof firstVolume === "number" && !Number.isNaN(firstVolume) ? firstVolume : 1;
    };

    const getNextIssue = (): string => {
        // 新增項目：期 = 同一個 Volume 內的最大 Issue + 1
        const baseVolume = getBaseVolume();

        const maxIssueInVolume = details.reduce((max, d: SpecJournalIndexDetail) => {
            const v = typeof d.Volume === "number" && !Number.isNaN(d.Volume) ? d.Volume : 0;
            if (v !== baseVolume) return max;

            const issue = d.Issue;
            if (typeof issue !== "number" || Number.isNaN(issue)) return max;

            return issue > max ? issue : max;
        }, 0);

        return String(maxIssueInVolume + 1);
    };

    const buildTabLabel = (d: SpecJournalIndexDetail, idx: number): string => {
        // 標籤：XX卷XX期（Volume/Issue 動態）
        const v = typeof d.Volume === "number" && !Number.isNaN(d.Volume) ? d.Volume : 0;
        const i = d.Issue;
        // 若都還沒填，仍保留索引避免整排都是 0卷0期 造成困惑
        if (v === 0) return `第${idx + 1}筆`;
        return `${v}卷${i}期`;
    };

    const ensureFirstDetail = (): void => {
        // 新增模式：若一開始沒有任何明細，先補一筆（讓頁籤預設有第一筆）
        if (!props.formData.data) return;
        const current = props.formData.data.SpecJournalIndexDetail ?? [];
        if (current.length > 0) return;

        const firstItem: SpecJournalIndexDetail = {
            IndexId: props.formData.data.SpecJournalIndex?.IndexId,
            RowId: 1,
            Volume: 1,
            Issue: "1",
        };

        props.formData.setFormData({
            ...props.formData.data,
            SpecJournalIndexDetail: [firstItem],
        });
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
        activateTabByKey(firstKey);
    };

    // 用 ref 暫存 tab keys，讓 activateFirstTab 可在 effect 中取得
    const tabInfoRef = useRef<Record<string, string>>({});

    useEffect(() => {
        // 表單資料載入後，確保至少有一筆明細可編輯
        ensureFirstDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.formData.data]);

    useEffect(() => {
        // ✅ 新增後：跳到新增的 tab
        const pendingKey = pendingActiveTabKeyRef.current;
        if (pendingKey) {
            // 等 DOM 更新後再切換（避免 query 找不到 button）
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
    }, [details.length]);

    const handleAdd = (): void => {
        // 添加頁籤：新增一筆明細（卷=第一筆卷、期=最大期+1）
        if (!props.formData.data) return;

        const nextRowId = getNextRowId();

        const newItem: SpecJournalIndexDetail = {
            IndexId: props.formData.data.SpecJournalIndex?.IndexId,
            RowId: nextRowId,
            Volume: getBaseVolume(),
            Issue: getNextIssue(),
        };

        // ✅ 記住要切到哪個 tab（用 RowId 當 key）
        pendingActiveTabKeyRef.current = String(nextRowId);
        activeTabKeyRef.current = String(nextRowId);
        const updated: SpecJournalIndexSet = {
            ...props.formData.data,
            SpecJournalIndexDetail: [...(props.formData.data.SpecJournalIndexDetail ?? []), newItem],
        };

        props.formData.setFormData(updated);
    };

    const removeOne = (rowKey: number | string): void => {
        // 移除指定明細（RowId / Index fallback）
        const keyStr = String(rowKey);

        // ✅ 若刪的是「目前 active 的 tab」，標記刪完要回第一筆
        if (activeTabKeyRef.current === keyStr) {
            pendingGoFirstRef.current = true;
        }

        props.formData.setFormData(prev => {
            if (!prev) return prev;
            const allDetails = prev.SpecJournalIndexDetail ?? [];
            const target = allDetails.find((d, i) => String(d.RowId ?? i) === keyStr);
            if (!target) return prev;

            // 有正式 RowId：用複合鍵過濾；沒有：用索引當後備（避免新筆比不到）
            let nextDetails: typeof allDetails;
            if (target.RowId != null) {
                nextDetails = allDetails.filter(d => !(d.IndexId === target.IndexId && d.RowId === target.RowId));
            } else {
                const hitIdx = allDetails.findIndex((d, i) => String(d.RowId ?? i) === keyStr);
                nextDetails = allDetails.filter((_, i) => i !== hitIdx);
            }

            return { ...prev, SpecJournalIndexDetail: nextDetails };
        });
    };

    // tab key/label mapping（也同步到 ref）
    const tabItemMap = details.reduce<Record<string, string>>((acc, d, idx) => {
        const key = String(d.RowId ?? idx);
        acc[key] = buildTabLabel(d, idx);
        return acc;
    }, {});
    tabInfoRef.current = tabItemMap;

    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: tabItemMap,
        onAddTab: () => { handleAdd(); },
        onRemoveTab: (key) => removeOne(key),
    };

    const tabContent: Record<string, React.ReactNode[]> = details.reduce<Record<string, React.ReactNode[]>>(
        (acc, d, idx) => {
            const detailRowId = d.RowId ?? idx;
            const rowKeys = { [SpecJournalIndexDetailFields.IndexId]: d.IndexId, [SpecJournalIndexDetailFields.RowId]: d.RowId }

            acc[String(detailRowId)] = [
                <div className="col-12 form-group">
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalIndexSetFields.SpecJournalIndexDetail, SpecJournalIndexDetailFields.Volume, "number", rowKeys)} />
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalIndexSetFields.SpecJournalIndexDetail, SpecJournalIndexDetailFields.Issue, "string", rowKeys)} />
                </div>,
                <div className="col-12 form-group">
                    <LibCheckBox Style={props.theme.RadioBox} options={props.publishStatusOpts} {...setField(SpecJournalIndexSetFields.SpecJournalIndexDetail, SpecJournalIndexDetailFields.PublishStatus, "number", rowKeys)} />
                    <LibCheckBox Style={props.theme.CheckBox} options={{ [SpecJournalIndexDetailFields.IsSpecial]: "" }} {...setField(SpecJournalIndexSetFields.SpecJournalIndexDetail, SpecJournalIndexDetailFields.IsSpecial, "boolean", rowKeys)} />
                </div>,
                <div className="col-12 form-group">
                    <LibCalendar {...setField(SpecJournalIndexSetFields.SpecJournalIndexDetail, SpecJournalIndexDetailFields.PublishDate, "datetime", rowKeys)} />
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SpecJournalIndexSetFields.SpecJournalIndexDetail, SpecJournalIndexDetailFields.SeasonNo, "string", rowKeys)} />
                </div>,
                <div className="col-12 form-group">
                    <LibFileInput
                        // 直接展開！只要給：表名、id欄位、name欄位(可選)、rowKeys(可選)、options(可選)
                        {...setFileField(
                            SpecJournalIndexSetFields.SpecJournalIndexDetail,
                            SpecJournalIndexDetailFields.SummaryFileId,
                            SpecJournalIndexDetailFields.SummaryFileName,
                            rowKeys,
                            { defaultNameFromOriginal: "basename" }
                        )}
                        // 其他 UI 行為仍由你自己控制
                        Accept="application/pdf"
                    // onDelete={() => removeFileAt(i)}
                    />
                </div>
            ];

            return acc;
        }, {}
    );

    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)
}
