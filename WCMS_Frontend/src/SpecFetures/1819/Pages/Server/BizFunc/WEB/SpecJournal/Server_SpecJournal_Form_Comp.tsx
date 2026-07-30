import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibDropList, LibFileInput, LibTextBox, LibTinyMCE } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import {
    type FileFieldBindProps,
    useFormModelField,
    useSetTableField,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { DefaultLang, type Lang, LangLabelMap, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import { LibAttachment } from "@/SysCore/Utils/Library/LibData";
import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import type { components } from "@/types/api";
import {
    SpecJournalAuthorFields,
    SpecJournalFields,
    SpecJournalRefFormatFields,
} from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Server_SpecJournal_Dialog_Comp, type SpecJournalDialogActionType } from "./Server_SpecJournal_Dialog_Comp";
import {
    type SpecJournalAuthorRowKeys,
    type SpecJournalFormActionsOpt,
    type SpecJournalFormAdapter,
    type SpecJournalMode,
    useSpecJournalAuthorOrcid,
    useSpecJournalDocumentEditGrid,
    useSpecJournalFormTemplate,
    useSpecJournalOpenPointFileEditGrid,
    useSpecJournalRefFileEditGrid,
} from "./Server_SpecJournal_Form_Hook";

// #region Property
type SpecJournalFormModel = components["schemas"]["SpecJournal"];

type SpecJournalAuthor = components["schemas"]["SpecJournalAuthor"];

type SpecJournalIndexFormModel = components["schemas"]["SpecJournalIndex"];

type SpecJournalIndexDetail = components["schemas"]["SpecJournalIndexDetail"];

type AuthorType = 0 | 1;

type SpecJournalAdapterType = SpecJournalFormAdapter["SpecJournal"];

const emptyData: SpecJournalFormModel = {
    _SpecJournalAuthor: [],
    _SpecJournalRefFormat: [],
    _SpecJournalOpenPointFiles: [],
    _SpecJournalRefFiles: [],
    _SpecJournalKeywords: [],
    _SpecJournalDocument: [],
    _SpecJournalTypes: [],
};

const editGridStyle: IEditGridView_Style = {
    TableStyle: "table table-striped table-bordered table-hover",
    ToolbarStyle: "d-flex align-items-center justify-content-between mb-2",
    ButtonStyle: "btn btn-custom btn-rounded btn-sm",
    DangerButtonStyle: "btn btn-danger btn-rounded btn-sm",
    ErrorStyle: "text-danger small mt-1",
};

const TAB_PREFIX = "REF_";
// #endregion

// #region Public
/** 1819 期刊 Form，透過 Server_FormTemplate 統一外框與資料流程。 */
export const Server_SpecJournal_Form_Comp = (prop: { theme: IBETheme; lang: Lang; mode: SpecJournalMode; }) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const onBackToList = useCallback(() =>
    {
        const listPath = pathname.replace(/\/Form(\/[^\/]*)?$/, "/List");
        markPageStateMemoryEntry(listPath, "normalize");
        navigate(listPath, { replace: true });
    }, [navigate, pathname]);
    const actionsOpt = useMemo<SpecJournalFormActionsOpt>(() =>
    {
        return { onBackToList, journalMode: prop.mode };
    }, [onBackToList, prop.mode]);

    const template = useSpecJournalFormTemplate({ lang: prop.lang, theme: prop.theme, internalId: internalId ?? "", emptyData, actionsOpt });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => (
                <>
                    <ModeActionBarComp
                        theme={prop.theme}
                        mode={prop.mode}
                        isEdit={Boolean(internalId)}
                        internalId={internalId ?? ""}
                        adapter={vm.adapter.SpecJournal}
                        indexRawData={vm.refs.indexRawData}
                        formData={vm.binding}
                        onBackToList={onBackToList}
                    />
                    <MainFormComp
                        theme={prop.theme}
                        mode={prop.mode}
                        adapter={vm.adapter.SpecJournal}
                        formData={vm.binding}
                        indexRawData={vm.refs.indexRawData}
                        tagOptionsRaw={vm.refs.tagOptionsRaw}
                        keywords={vm.refs.keywords}
                        specDocumentTypeOptionsRaw={vm.refs.specDocumentTypeOptionsRaw}
                        specAuthorTypeOptionsRaw={vm.refs.specAuthorTypeOptionsRaw}
                    />
                </>
            )}
        />
    );
};
// #endregion

// #region Section
/** 期刊主要頁籤區塊，負責組合各資料區段。 */
const MainFormComp = (
    props: {
        theme: IBETheme;
        mode: SpecJournalMode;
        adapter: SpecJournalAdapterType;
        formData: ServerFormBinding<SpecJournalFormModel>;
        indexRawData: SpecJournalIndexFormModel[];
        tagOptionsRaw: Record<string, string>;
        specDocumentTypeOptionsRaw: Map<string, string>;
        specAuthorTypeOptionsRaw: Map<string, string>;
        keywords: SpecJournalFormModel[];
    },
) =>
{
    const setField = useFormModelField<SpecJournalFormModel>(props.formData);
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: {
            Basic: "基本資料",
            Author: "作者資料",
            Bibliography: "參考文獻",
            RefFormat: "引文格式",
            Files: "檔案上傳",
            Keyword: "關鍵字",
            Documents: "說明文件",
            System: "系統資訊",
        },
    };
    const components: Record<string, React.ReactNode[]> = {
        Basic: [
            <BasicComp
                key="basic"
                theme={props.theme}
                mode={props.mode}
                formData={props.formData}
                indexRawData={props.indexRawData}
                tagOptionsRaw={props.tagOptionsRaw}
            />,
        ],
        Author: [
            <AuthorComp
                key="author"
                theme={props.theme}
                adapter={props.adapter}
                formData={props.formData}
                specAuthorTypeOptionsRaw={props.specAuthorTypeOptionsRaw}
            />,
        ],
        Bibliography: [
            <LibTinyMCE
                key="bibliography"
                Style={props.theme.TinyMCE}
                {...setField(SpecJournalFields.Bibliography, "string")}
                ColumnDisplayName={""}
            />,
        ],
        RefFormat: [<RefFormatComp key="refFormat" theme={props.theme} formData={props.formData} />],
        Files: [<FilesComp key="files" theme={props.theme} formData={props.formData} />],
        Keyword: [<KeywordComp key="keyword" theme={props.theme} formData={props.formData} keywords={props.keywords} />],
        Documents: [
            <DocumentsComp key="documents" theme={props.theme} formData={props.formData} specDocumentTypeOptionsRaw={props.specDocumentTypeOptionsRaw} />,
        ],
        System: [<SystemInfoTabComp key="system" theme={props.theme} formData={props.formData} />],
    };
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};

const BasicComp = (
    props: {
        theme: IBETheme;
        mode: SpecJournalMode;
        formData: ServerFormBinding<SpecJournalFormModel>;
        indexRawData: SpecJournalIndexFormModel[];
        tagOptionsRaw: Record<string, string>;
    },
) =>
{
    const setField = useFormModelField<SpecJournalFormModel>(props.formData);
    const journalFileField = useSpecJournalFileFieldBinding(
        props.formData,
        SpecJournalFields.JournalFileId,
        SpecJournalFields.JournalFileName,
        props.formData.data?.JournalFile?.FileName,
    );
    const insightPointFileField = useSpecJournalFileFieldBinding(
        props.formData,
        SpecJournalFields.InsightPointFileId,
        SpecJournalFields.InsightPointFileName,
        props.formData.data?.InsightPointFile?.FileName,
    );
    const indexOptions = useMemo(() =>
    {
        return buildIndexHeaderOptions(props.indexRawData);
    }, [props.indexRawData]);
    const indexRowOptionsByIndexId = useMemo(() =>
    {
        return buildIndexDetailOptionsByIndexId(props.indexRawData);
    }, [props.indexRawData]);
    const articleLangOptions = useMemo(() =>
    {
        return buildArticleLangOptions();
    }, []);
    const selectedIndexId = String(props.formData.data?.JournalIndexId ?? "");
    const indexRowOptions = useMemo(() =>
    {
        return indexRowOptionsByIndexId[selectedIndexId] ?? new Map<string, string>();
    }, [indexRowOptionsByIndexId, selectedIndexId]);
    const prevIndexIdRef = useRef<string | null>(null);
    /** 記錄：是否已完成編輯資料首次同步 */
    const hasInitJournalIndexRef = useRef<boolean>(false);
    const types = props.formData.data._SpecJournalTypes ?? [];
    const typeOptions = useMemo(() =>
    {
        const dict = props.tagOptionsRaw ?? {};
        return Object.entries(dict).map(([tagId, label]) => ({ tagId, label }));
    }, [props.tagOptionsRaw]);
    /** 清空主表單上的單一檔案欄位 */
    const clearMainFileField = useCallback((fileIdField: keyof SpecJournalFormModel, fileNameField: keyof SpecJournalFormModel): void =>
    {
        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;
            return { ...prev, [fileIdField]: null, [fileNameField]: "" };
        });
    }, [props.formData]);

    const isTypeChecked = useCallback((tagId: string): boolean =>
    {
        // 勾選代表 SpecJournalTypes 明細中存在該 TagId
        return (types as any[]).some(x => String(x?.TagId ?? "") === tagId);
    }, [types]);

    const toggleType = useCallback((tagId: string, checked: boolean): void =>
    {
        // 勾/取消勾：同步更新 SpecJournalTypes 明細列
        props.formData.setFormData(prev =>
        {
            const p = prev ?? {};
            const cur = (p as any)._SpecJournalTypes ?? [];
            if (checked)
            {
                if (cur.some((x: any) => String(x?.TagId ?? "") === tagId)) return p;

                const nextRowId = getNextRowId(cur);
                const next = [...cur, { RowId: nextRowId, TagId: tagId }];
                return { ...(p as any), _SpecJournalTypes: next };
            }
            const next = cur.filter((x: any) => String(x?.TagId ?? "") !== tagId);
            return { ...(p as any), _SpecJournalTypes: next };
        });
    }, [props.formData]);

    useEffect(() =>
    {
        if (props.mode !== "preprint") return;

        const journal = props.formData.data ?? {};
        const hasIndexId = journal?.JournalIndexId != null;
        const hasIndexRowId = journal?.JournalIndexRowId != null;
        if (!hasIndexId && !hasIndexRowId) return;

        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;
            return {
                ...prev,
                [SpecJournalFields.JournalIndexId]: null,
                [SpecJournalFields.JournalIndexRowId]: null,
            };
        });
    }, [props.mode, props.formData, props.formData.data?.JournalIndexId, props.formData.data?.JournalIndexRowId]);

    useEffect(() =>
    {
        // 僅期刊模式需要連動卷期代號
        if (props.mode !== "journal") return;

        // 宣告變數：目前期刊目次代號
        const currentIndexId = String(props.formData.data?.JournalIndexId ?? "");

        // 首次載入既有資料時，只記錄，不清空卷期代號
        if (!hasInitJournalIndexRef.current)
        {
            if (!currentIndexId) return;

            hasInitJournalIndexRef.current = true;
            prevIndexIdRef.current = currentIndexId;
            return;
        }

        // 宣告變數：前一次期刊目次代號
        const prevIndexId = prevIndexIdRef.current;
        prevIndexIdRef.current = currentIndexId;

        // 沒變更就不處理
        if (prevIndexId === currentIndexId) return;

        // 執行：期刊目次改變後，清空卷期代號
        props.formData.setFormData(prevData =>
        {
            if (!prevData) return prevData;

            return { ...prevData, [SpecJournalFields.JournalIndexRowId]: null };
        });
    }, [props.mode, props.formData, props.formData.data?.JournalIndexId]);

    useEffect(() =>
    {
        // 表單載入後：若 ArticleLang 為空，預設寫入 zh-tw
        if (!props.formData.data) return;
        const current = String(props.formData.data?.ArticleLang ?? "");
        if (current) return;

        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;
            return { ...prev, [SpecJournalFields.ArticleLang]: DefaultLang };
        });
    }, [props.formData.data, props.formData]);

    return (
        <>
            {props.mode === "journal" && (
                <div className="col-12 form-group">
                    <LibDropList
                        Style={props.theme.DropList2}
                        Options={indexOptions}
                        AutoDefaultFirst={false}
                        {...setField(SpecJournalFields.JournalIndexId, "string")}
                    />
                    <LibDropList
                        Style={props.theme.DropList2}
                        Options={indexRowOptions}
                        AutoDefaultFirst={false}
                        {...setField(SpecJournalFields.JournalIndexRowId, "number")}
                    />
                </div>
            )}
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields.Title, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields.Title_en, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields.PageStart, "number")}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields.PageEnd, "number")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields.DOIUrl, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <div className="row">
                    <div className="col-12 col-lg-6">
                        <LibFileInput
                            LabelColClassName="col-sm-4"
                            InputColClassName="col-sm-8"
                            {...journalFileField}
                            Accept="application/pdf"
                            onDelete={() => clearMainFileField(SpecJournalFields.JournalFileId, SpecJournalFields.JournalFileName)}
                        />
                    </div>
                    <div className="col-12 col-lg-6">
                        <LibFileInput
                            LabelColClassName="col-sm-4"
                            InputColClassName="col-sm-8"
                            {...insightPointFileField}
                            Accept="application/pdf"
                            onDelete={() => clearMainFileField(SpecJournalFields.InsightPointFileId, SpecJournalFields.InsightPointFileName)}
                        />
                    </div>
                </div>
            </div>

            <div className="col-12 form-group">
                <LibDropList
                    Style={props.theme.DropList2}
                    Options={articleLangOptions}
                    {...setField(SpecJournalFields.ArticleLang, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <label className="form-label fw-bold">期刊類型（可多選）</label>
                <div className="d-flex flex-wrap gap-3" role="group" aria-label="期刊類型多選">
                    {typeOptions.map(opt => (
                        <div key={opt.tagId} className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`journal-type-${opt.tagId}`}
                                checked={isTypeChecked(opt.tagId)}
                                onChange={(e) => toggleType(opt.tagId, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`journal-type-${opt.tagId}`}>{opt.label}</label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="col-12 form-group">
                <LibTinyMCE Style={props.theme.TinyMCE} {...setField(SpecJournalFields.Memo, "string")} />
            </div>

            <div className="col-12 form-group">
                <LibTinyMCE Style={props.theme.TinyMCE} {...setField(SpecJournalFields.Memo_en, "string")} />
            </div>
        </>
    );
};

const AuthorComp = (
    props: {
        theme: IBETheme;
        adapter: SpecJournalAdapterType;
        formData: ServerFormBinding<SpecJournalFormModel>;
        specAuthorTypeOptionsRaw: Map<string, string>;
    },
) =>
{
    const { handleOrcidBlur } = useSpecJournalAuthorOrcid({ adapter: props.adapter, binding: props.formData });
    const setField = useSetTableField<SpecJournalFormModel>(props.formData);
    const allAuthors = props.formData.data?._SpecJournalAuthor ?? [];
    const authors = useMemo(() => allAuthors, [allAuthors]);
    const defaultAuthorType = useMemo(() =>
    {
        const firstKey = Array.from(props.specAuthorTypeOptionsRaw.keys()).at(0);
        return Number(firstKey ?? 0) as AuthorType;
    }, [props.specAuthorTypeOptionsRaw]);

    const pendingActiveTabKeyRef = useRef<string | null>(null);
    const pendingGoFirstRef = useRef<boolean>(false);
    const activeTabKeyRef = useRef<string | null>(null);
    const tabInfoRef = useRef<Record<string, string>>({});
    const specAuthorTypeOptions = useMemo<Record<string, string>>(() =>
    {
        return Object.fromEntries(props.specAuthorTypeOptionsRaw.entries());
    }, [props.specAuthorTypeOptionsRaw]);
    useEffect(() =>
    {
        const handleClick = (e: MouseEvent) =>
        {
            const el = e.target as HTMLElement | null;
            const btn = el?.closest?.("button[data-bs-toggle=\"tab\"][data-bs-target^=\"#Tab_TWEN_\"]") as HTMLButtonElement | null;
            if (!btn) return;
            const target = btn.getAttribute("data-bs-target") ?? "";
            const m = target.match(/^#Tab_TWEN_(.+)$/);
            const key = m?.[1] ?? null;
            if (key) activeTabKeyRef.current = key;
        };
        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [authors.length]);

    useEffect(() =>
    {
        const pendingKey = pendingActiveTabKeyRef.current;
        if (pendingKey)
        {
            requestAnimationFrame(() =>
            {
                activateTabByKey(pendingKey);
                pendingActiveTabKeyRef.current = null;
            });
            return;
        }

        if (pendingGoFirstRef.current)
        {
            requestAnimationFrame(() =>
            {
                activateFirstTab();
                pendingGoFirstRef.current = false;
            });
        }
    }, [authors.length]);

    const getNextRowId = (): number =>
    {
        const maxRowId = allAuthors.reduce((max: number, a: any) =>
        {
            const r = typeof a?.RowId === "number" ? a.RowId : 0;
            return r > max ? r : max;
        }, 0);
        return maxRowId + 1;
    };

    const buildTabLabel = (a: any, idx: number): string =>
    {
        const name = String(a?.AuthorName ?? "").trim();
        if (name) return name;
        const nameEn = String(a?.AuthorName_en ?? "").trim();
        if (nameEn) return nameEn;
        return `未命名${authors.length > 1 ? `(${idx + 1})` : ""}`;
    };

    const activateTabByKey = (key: string): void =>
    {
        const btn = document.querySelector<HTMLButtonElement>(`button[data-bs-toggle="tab"][data-bs-target="#Tab_TWEN_${key}"]`);
        btn?.click();
    };

    const activateFirstTab = (): void =>
    {
        const firstKey = Object.keys(tabInfoRef.current).at(0);
        if (!firstKey) return;
        if (activeTabKeyRef.current === firstKey) return;
        activateTabByKey(firstKey);
    };

    const handleAdd = (): void =>
    {
        if (!props.formData.data) return;

        const nextRowId = getNextRowId();
        const parentJournalId = props.formData.data.JournalId ?? allAuthors[0]?.JournalId;
        const newItem: SpecJournalAuthor = { JournalId: parentJournalId, RowId: nextRowId, AuthorType: defaultAuthorType };

        pendingActiveTabKeyRef.current = String(nextRowId);
        activeTabKeyRef.current = String(nextRowId);

        props.formData.setFormData({ ...props.formData.data, _SpecJournalAuthor: [...allAuthors, newItem] });
    };

    const removeOne = (rowKey: number | string): void =>
    {
        const keyStr = String(rowKey);
        if (activeTabKeyRef.current === keyStr) pendingGoFirstRef.current = true;

        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;

            const list = prev._SpecJournalAuthor ?? [];
            const target = list.find((a: any, i: number) => String(a?.RowId ?? i) === keyStr);
            if (!target) return prev;

            const nextList = list.filter((a: any) =>
            {
                const sameJournalId = String(a?.JournalId ?? "") === String(target?.JournalId ?? "");
                const sameRowId = String(a?.RowId ?? "") === String(target?.RowId ?? "");
                return !(sameJournalId && sameRowId);
            });

            return { ...prev, _SpecJournalAuthor: nextList };
        });
    };

    const tabItemMap = authors.reduce<Record<string, string>>((acc, a: any, idx: number) =>
    {
        const key = String(a?.RowId ?? idx);
        acc[key] = buildTabLabel(a, idx);
        return acc;
    }, {});
    tabInfoRef.current = tabItemMap;

    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: tabItemMap, onAddTab: () => handleAdd(), onRemoveTab: (key) => removeOne(key) };

    const tabContent = authors.reduce<Record<string, React.ReactNode[]>>((acc, a: any, idx: number) =>
    {
        const tabKey = String(a?.RowId ?? idx);
        const rowKeys: SpecJournalAuthorRowKeys = { [SpecJournalAuthorFields.JournalId]: a?.JournalId, [SpecJournalAuthorFields.RowId]: a?.RowId };

        acc[tabKey] = [
            <div className="col-12 form-group" key="authorType">
                <LibCheckBox
                    Style={props.theme.RadioBox}
                    options={specAuthorTypeOptions}
                    {...setField(SpecJournalFields._SpecJournalAuthor, SpecJournalAuthorFields.AuthorType, "number", rowKeys, {
                        defaultValue: defaultAuthorType,
                        defaultWhen: "nullish",
                    })}
                />
            </div>,
            <div className="col-12 form-group" key="orcid">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields._SpecJournalAuthor, SpecJournalAuthorFields.ORCID, "string", rowKeys)}
                    onBlur={(v) => void handleOrcidBlur(rowKeys, v)}
                />
            </div>,
            <div className="col-12 form-group" key="name">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields._SpecJournalAuthor, SpecJournalAuthorFields.AuthorName, "string", rowKeys)}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields._SpecJournalAuthor, SpecJournalAuthorFields.AuthorName_en, "string", rowKeys)}
                />
            </div>,
            <div className="col-12 form-group" key="jobCountry">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields._SpecJournalAuthor, SpecJournalAuthorFields.JobTitle, "string", rowKeys)}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields._SpecJournalAuthor, SpecJournalAuthorFields.Country, "string", rowKeys)}
                />
            </div>,
            <div className="col-12 form-group" key="unit">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields._SpecJournalAuthor, SpecJournalAuthorFields.Unit, "string", rowKeys)}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields._SpecJournalAuthor, SpecJournalAuthorFields.Unit_en, "string", rowKeys)}
                />
            </div>,
            <div className="col-12 form-group" key="email">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields._SpecJournalAuthor, SpecJournalAuthorFields.Email, "string", rowKeys)}
                />
            </div>,
        ];

        return acc;
    }, {});

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

const RefFormatComp = (props: { theme: IBETheme; formData: ServerFormBinding<SpecJournalFormModel>; }) =>
{
    const setField = useSetTableField<SpecJournalFormModel>(props.formData);
    const formats = props.formData.data?._SpecJournalRefFormat ?? [];

    // ✅ UIUX：新增後要跳到新增的 tab
    const pendingActiveTabKeyRef = useRef<string | null>(null);
    // ✅ UIUX：若刪到當前 tab，要回到第一筆
    const pendingGoFirstRef = useRef<boolean>(false);
    // ✅ 追蹤目前 active tab key
    const activeTabKeyRef = useRef<string | null>(null);
    // ✅ 暫存 tab key/label mapping，供「回第一筆」使用
    const tabInfoRef = useRef<Record<string, string>>({});

    useEffect(() =>
    {
        const handleClick = (e: MouseEvent) =>
        {
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

    useEffect(() =>
    {
        // ✅ 新增後：跳到新增的 tab
        const pendingKey = pendingActiveTabKeyRef.current;
        if (pendingKey)
        {
            requestAnimationFrame(() =>
            {
                activateTabByKey(pendingKey);
                pendingActiveTabKeyRef.current = null;
            });
            return;
        }
        // ✅ 刪除當前 tab：回第一筆
        if (pendingGoFirstRef.current)
        {
            requestAnimationFrame(() =>
            {
                activateFirstTab();
                pendingGoFirstRef.current = false;
            });
        }
    }, [formats.length]);

    const getNextRowId = (): number =>
    {
        // 以目前最大 RowId + 1 產生新 RowId
        const maxRowId = formats.reduce((max: number, f: any) =>
        {
            const r = typeof f?.RowId === "number" ? f.RowId : 0;
            return r > max ? r : max;
        }, 0);

        return maxRowId + 1;
    };

    const buildTabLabel = (f: any, idx: number): string =>
    {
        // Tab 名稱：Title -> 未命名
        const title = (f?.Title ?? "").trim();
        if (title) return title;
        return `未命名${formats.length > 1 ? `(${idx + 1})` : ""}`;
    };

    const activateTabByKey = (key: string): void =>
    {
        // 觸發 click 讓 bootstrap 切換 tab
        const btn = document.querySelector<HTMLButtonElement>(`button[data-bs-toggle="tab"][data-bs-target="#Tab_TWEN_${TAB_PREFIX}${key}"]`);
        btn?.click();
    };

    const activateFirstTab = (): void =>
    {
        // 回到第一筆：抓第一個可用的 tab key 觸發 click
        const firstKey = Object.keys(tabInfoRef.current).at(0);
        if (!firstKey) return;
        const rawKey = firstKey.replace(TAB_PREFIX, "");
        if (activeTabKeyRef.current === rawKey) return;
        activateTabByKey(firstKey);
    };

    const handleAdd = (): void =>
    {
        // 新增引文格式：RowId = max + 1
        if (!props.formData.data) return;

        const nextRowId = getNextRowId();
        const parentJournalId = props.formData.data.JournalId ?? formats[0]?.JournalId;

        const newItem: any = { JournalId: parentJournalId, RowId: nextRowId };

        pendingActiveTabKeyRef.current = String(nextRowId);
        activeTabKeyRef.current = String(nextRowId);

        props.formData.setFormData({ ...props.formData.data, _SpecJournalRefFormat: [...(props.formData.data._SpecJournalRefFormat ?? []), newItem] });
    };

    const removeOne = (rowKey: number | string): void =>
    {
        // 刪除指定引文格式（RowId / index fallback）
        const keyStr = String(rowKey);

        if (activeTabKeyRef.current === keyStr)
        {
            pendingGoFirstRef.current = true;
        }

        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;

            const list = prev._SpecJournalRefFormat ?? [];
            const hitIdx = list.findIndex((f: any, i: number) => String(f?.RowId ?? i) === keyStr);
            if (hitIdx < 0) return prev;

            const target = list[hitIdx];
            let nextList: any[];

            if (target?.RowId != null)
            {
                nextList = list.filter((f: any) => !(f?.JournalId === target?.JournalId && f?.RowId === target?.RowId));
            } else
            {
                nextList = list.filter((_, i) => i !== hitIdx);
            }

            return { ...prev, _SpecJournalRefFormat: nextList };
        });
    };

    // tab key/label mapping（同步到 ref）
    const tabItemMap = formats.reduce<Record<string, string>>((acc, f: any, idx: number) =>
    {
        const rawKey = String(f?.RowId ?? idx);
        const tabKey = `${TAB_PREFIX}${rawKey}`;
        acc[tabKey] = buildTabLabel(f, idx);
        return acc;
    }, {});
    tabInfoRef.current = tabItemMap;

    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: tabItemMap,
        onAddTab: () =>
        {
            handleAdd();
        },
        onRemoveTab: (key) => removeOne(key),
    };

    const tabContent = formats.reduce<Record<string, React.ReactNode[]>>((acc, f: any, idx: number) =>
    {
        const rawKey = String(f?.RowId ?? idx);
        const tabKey = `${TAB_PREFIX}${rawKey}`;
        const rowKeys: any = { [SpecJournalRefFormatFields.JournalId]: f?.JournalId, [SpecJournalRefFormatFields.RowId]: f?.RowId };

        acc[tabKey] = [
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalFields._SpecJournalRefFormat, SpecJournalRefFormatFields.Title, "string", rowKeys)}
                />
                <LibTinyMCE
                    Style={props.theme.TinyMCE}
                    {...setField(SpecJournalFields._SpecJournalRefFormat, SpecJournalRefFormatFields.Content, "string", rowKeys)}
                />
            </div>,
        ];

        return acc;
    }, {});

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

const FilesComp = (props: { theme: IBETheme; formData: ServerFormBinding<SpecJournalFormModel>; }) =>
{
    return (
        <>
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
        </>
    );
};

const OpenPointComp = (props: { theme: IBETheme; formData: ServerFormBinding<SpecJournalFormModel>; }) =>
{
    const openPointGrid = useSpecJournalOpenPointFileEditGrid({ binding: props.formData, style: editGridStyle });

    return <EditGrid {...openPointGrid.editGridProps} />;
};

const RefFilesComp = (props: { theme: IBETheme; formData: ServerFormBinding<SpecJournalFormModel>; }) =>
{
    const refFileGrid = useSpecJournalRefFileEditGrid({ binding: props.formData, style: editGridStyle });

    return <EditGrid {...refFileGrid.editGridProps} />;
};

const KeywordComp = (props: { theme: IBETheme; formData: ServerFormBinding<SpecJournalFormModel>; keywords: SpecJournalFormModel[]; }) =>
{
    const data = props.formData.data ?? {};
    const tags = data._SpecJournalKeywords ?? [];
    const [zhInput, setZhInput] = useState<string>("");
    const [enInput, setEnInput] = useState<string>("");
    const zhDebounced = useDebouncedValue(zhInput, 200);
    const enDebounced = useDebouncedValue(enInput, 200);
    const [zhSuggestions, setZhSuggestions] = useState<Array<{ TagId: string; TagName: string; }>>([]);
    const [enSuggestions, setEnSuggestions] = useState<Array<{ TagId: string; TagName: string; }>>([]);

    const keywordPool = useMemo(() =>
    {
        // ✅ 從整站 rawData 攤平出 keywords，依語系分組 + 去重
        const zh = new Set<string>();
        const en = new Set<string>();

        (props.keywords ?? []).forEach(s =>
        {
            (s as any)?._SpecJournalKeywords?.forEach((k: any) =>
            {
                const lang = String(k?.LangCode ?? "").toLowerCase();
                const kw = String(k?.Keyword ?? "").trim();
                if (!kw) return;
                if (lang === "zh-tw") zh.add(kw);
                if (lang === "en") en.add(kw);
            });
        });

        return { zh: Array.from(zh), en: Array.from(en) };
    }, [props.keywords]);

    useEffect(() =>
    {
        const q = zhDebounced.trim();
        if (q.length < 2)
        {
            setZhSuggestions([]);
            return;
        }
        const hit = keywordPool.zh.filter(x => x.toLowerCase().includes(q.toLowerCase())).slice(0, 20).map((x, i) => ({ TagId: `${i}`, TagName: x }));
        setZhSuggestions(hit);
    }, [zhDebounced, keywordPool.zh]);

    useEffect(() =>
    {
        const q = enDebounced.trim();
        if (q.length < 2)
        {
            setEnSuggestions([]);
            return;
        }
        const hit = keywordPool.en.filter(x => x.toLowerCase().includes(q.toLowerCase())).slice(0, 20).map((x, i) => ({ TagId: `${i}`, TagName: x }));
        setEnSuggestions(hit);
    }, [enDebounced, keywordPool.en]);

    const addKeyword = useCallback((lang: Lang, name: string): void =>
    {
        const value = name.trim();
        if (!value) return;

        props.formData.setFormData(prev =>
        {
            const p = prev ?? {};
            const cur = (p as any)._SpecJournalKeywords ?? [];
            const exists = cur.some((x: any) => String(x?.LangCode ?? "") === lang && String(x?.Keyword ?? "").trim().toLowerCase() === value.toLowerCase());
            if (exists) return p;

            const nextRowId = getNextRowId(cur);
            const next = [...cur, { RowId: nextRowId, LangCode: lang, Keyword: value }];
            return { ...(p as any), _SpecJournalKeywords: next };
        });

        if (lang === "zh-tw") setZhInput("");
        if (lang === "en") setEnInput("");
    }, [props.formData]);

    const removeKeyword = useCallback((rowId: number): void =>
    {
        props.formData.setFormData(prev =>
        {
            const p = prev ?? {};
            const cur = (p as any)._SpecJournalKeywords ?? [];
            const next = cur.filter((x: any) => Number(x?.RowId ?? 0) !== rowId);
            return { ...(p as any), _SpecJournalKeywords: next };
        });
    }, [props.formData]);

    const renderKeywordChips = (lang: Lang) =>
    {
        const list = (tags as any[]).filter(x => String(x?.LangCode ?? "") === lang);
        return (
            <div className="d-flex flex-wrap gap-2 mt-2" aria-label={lang === "zh-tw" ? "中文標籤清單" : "英文標籤清單"}>
                {list.map((x: any) => (
                    <span key={`${lang}-${x.RowId}`} className="badge bg-secondary d-inline-flex align-items-center gap-2">
                        <span>{String(x?.Keyword ?? "")}</span>
                        <button
                            type="button"
                            className="btn btn-sm btn-light"
                            aria-label={`移除標籤 ${String(x?.Keyword ?? "")}`}
                            onClick={() => removeKeyword(Number(x?.RowId ?? 0))}
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
        );
    };

    const renderSuggestList = (items: Array<{ TagId: string; TagName: string; }>, onPick: (name: string) => void) =>
    {
        if (items.length <= 0) return null;
        return (
            <div className="border rounded mt-1 p-2" role="listbox" aria-label="建議標籤清單">
                {items.map(x => (
                    <button
                        key={x.TagId}
                        type="button"
                        className="btn btn-link d-block text-start w-100"
                        onClick={() => onPick(x.TagName)}
                        aria-label={`加入建議標籤 ${x.TagName}`}
                    >
                        {x.TagName}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="col-12 form-group">
                <label className="form-label fw-bold" htmlFor="kw-zh-input">關鍵字（中文）</label>
                <div className="d-flex gap-2">
                    <input
                        id="kw-zh-input"
                        className="form-control"
                        value={zhInput}
                        onChange={(e) => setZhInput(e.target.value)}
                        onKeyDown={(e) =>
                        {
                            if (e.key === "Enter")
                            {
                                e.preventDefault();
                                addKeyword("zh-tw", zhInput);
                            }
                        }}
                        placeholder="輸入後停止 1 秒會自動搜尋，Enter 可直接加入"
                        aria-label="輸入中文關鍵字"
                    />
                    <button type="button" className="btn btn-primary" onClick={() => addKeyword("zh-tw", zhInput)} aria-label="加入中文關鍵字">Add</button>
                </div>
                {renderSuggestList(zhSuggestions, (name) => addKeyword("zh-tw", name))}
                {renderKeywordChips("zh-tw")}
            </div>

            <div className="col-12 form-group mt-4">
                <label className="form-label fw-bold" htmlFor="kw-en-input">Keywords (English)</label>
                <div className="d-flex gap-2">
                    <input
                        id="kw-en-input"
                        className="form-control"
                        value={enInput}
                        onChange={(e) => setEnInput(e.target.value)}
                        onKeyDown={(e) =>
                        {
                            if (e.key === "Enter")
                            {
                                e.preventDefault();
                                addKeyword("en", enInput);
                            }
                        }}
                        placeholder="Stop typing for 1s to search, press Enter to add"
                        aria-label="Input English keyword"
                    />
                    <button type="button" className="btn btn-primary" onClick={() => addKeyword("en", enInput)} aria-label="Add English keyword">Add</button>
                </div>
                {renderSuggestList(enSuggestions, (name) => addKeyword("en", name))}
                {renderKeywordChips("en")}
            </div>
        </>
    );
};

const DocumentsComp = (props: { theme: IBETheme; formData: ServerFormBinding<SpecJournalFormModel>; specDocumentTypeOptionsRaw: Map<string, string>; }) =>
{
    const documentGrid = useSpecJournalDocumentEditGrid({
        binding: props.formData,
        style: editGridStyle,
        documentTypeOptions: props.specDocumentTypeOptionsRaw,
    });

    return <EditGrid {...documentGrid.editGridProps} />;
};

/** 發佈期刊 / 退回預刊功能 Bar（內含 Dialog 狀態） */
const ModeActionBarComp = (
    props: {
        theme: IBETheme;
        mode: SpecJournalMode;
        isEdit: boolean;
        internalId: string;
        adapter: SpecJournalAdapterType;
        indexRawData: SpecJournalIndexFormModel[];
        formData: ServerFormBinding<SpecJournalFormModel>;
        onBackToList: () => void;
    },
) =>
{
    const [open, setOpen] = useState<boolean>(false);
    const [actionType, setActionType] = useState<SpecJournalDialogActionType>("publish");

    const indexOptions = useMemo(() =>
    {
        return buildIndexHeaderOptions(props.indexRawData);
    }, [props.indexRawData]);

    const indexRowOptionsByIndexId = useMemo(() =>
    {
        return buildIndexDetailOptionsByIndexId(props.indexRawData);
    }, [props.indexRawData]);

    const currentIndexId = useMemo<string | null>(() =>
    {
        const value = props.formData.data?.JournalIndexId;
        return value == null ? null : String(value);
    }, [props.formData.data?.JournalIndexId]);

    const currentIndexRowId = useMemo<number | null>(() =>
    {
        const value = props.formData.data?.JournalIndexRowId;
        return value == null ? null : value;
    }, [props.formData.data?.JournalIndexRowId]);

    const title = useMemo(() =>
    {
        return props.mode === "preprint" ? "發布期刊" : "退回預刊";
    }, [props.mode]);

    const handleOpenPublish = useCallback((): void =>
    {
        setActionType("publish");
        setOpen(true);
    }, []);

    const handleOpenRevert = useCallback((): void =>
    {
        setActionType("revert");
        setOpen(true);
    }, []);

    const handleClose = useCallback((): void =>
    {
        setOpen(false);
    }, []);

    const handleConfirm = useCallback((): void =>
    {
        props.onBackToList();
    }, [props.onBackToList]);

    if (!props.isEdit) return null;

    return (
        <>
            <div className="col-12 mb-3">
                <div className="d-flex flex-wrap gap-2 justify-content-end">
                    {props.mode === "preprint" && <button type="button" className="btn btn-success" onClick={handleOpenPublish} aria-label={title}>{title}</button>}

                    {props.mode === "journal" && <button type="button" className="btn btn-danger" onClick={handleOpenRevert} aria-label={title}>{title}</button>}
                </div>
            </div>

            <Server_SpecJournal_Dialog_Comp
                theme={props.theme}
                open={open}
                actionType={actionType}
                adapter={props.adapter}
                internalId={props.internalId}
                indexOptions={indexOptions}
                indexRowOptionsByIndexId={indexRowOptionsByIndexId}
                initialIndexId={currentIndexId}
                initialIndexRowId={currentIndexRowId}
                onClose={handleClose}
                onConfirm={handleConfirm}
            />
        </>
    );
};
// #endregion

// #region Protected
/** 建立 FormModel 根層檔案欄位綁定，維持 LibFileInput 的上傳與檔名回寫流程。 */
const useSpecJournalFileFieldBinding = (
    binding: ServerFormBinding<SpecJournalFormModel>,
    fileIdField: keyof SpecJournalFormModel,
    fileNameField: keyof SpecJournalFormModel,
    physicalFileName?: string | null,
): FileFieldBindProps =>
{
    const setField = useFormModelField<SpecJournalFormModel>(binding);
    const fileId = setField(fileIdField, "string");
    const fileName = setField(fileNameField, "string");
    const onFileUploaded = useCallback((internalId: string, originalName?: string): void =>
    {
        fileId.OnChange(internalId);
        const currentName = String(binding.data?.[fileNameField] ?? "").trim();
        if (currentName || !originalName) return;
        fileName.OnChange(LibAttachment.getDisplayFileNameWithoutExtension(originalName));
    }, [binding.data, fileId, fileName, fileNameField]);
    const onNameChange = useCallback((name: string): void =>
    {
        fileName.OnChange(name);
    }, [fileName]);
    return {
        ColumnDisplayName: fileId.ColumnDisplayName,
        InputValue: String(fileName.InputValue ?? ""),
        FileInternalId: String(fileId.InputValue ?? ""),
        FileName: String(physicalFileName ?? ""),
        onFileUploaded,
        onNameChange,
    };
};

/** ✅ Header 下拉：IndexId -> IndexName */
const buildIndexHeaderOptions = (rawData: SpecJournalIndexFormModel[] = []): Map<string, string> =>
{
    return rawData.reduce<Map<string, string>>((acc, x) =>
    {
        const id = String(x?.IndexId ?? "");
        const name = String(x?.IndexName ?? "");
        if (!id) return acc;
        acc.set(id, name || id);
        return acc;
    }, new Map<string, string>());
};

/** ✅ Detail 下拉：IndexId -> (RowId -> "X卷Y期") */
const buildIndexDetailOptionsByIndexId = (rawData: SpecJournalIndexFormModel[] = []): Record<string, Map<string, string>> =>
{
    return rawData.reduce<Record<string, Map<string, string>>>((acc, x) =>
    {
        const indexId = String(x?.IndexId ?? "");
        if (!indexId) return acc;

        const details = ((x?._SpecJournalIndexDetail ?? []) as SpecJournalIndexDetail[]).slice().sort((a, b) =>
        {
            const volumeA = Number(a?.Volume ?? 0);
            const volumeB = Number(b?.Volume ?? 0);
            const issueA = Number(a?.Issue ?? 0);
            const issueB = Number(b?.Issue ?? 0);

            if (volumeA !== volumeB) return volumeA - volumeB;
            return issueA - issueB;
        });

        const dict = details.reduce<Map<string, string>>((dAcc, d) =>
        {
            const rowId = String(d?.RowId ?? "");
            if (!rowId) return dAcc;

            const v = d?.Volume ?? "";
            const i = d?.Issue ?? "";
            const label = `${v}卷${i}期`;

            dAcc.set(rowId, label);
            return dAcc;
        }, new Map<string, string>());

        acc[indexId] = dict;
        return acc;
    }, {});
};

/** ✅ ArticleLang 下拉：LangCode -> 顯示名稱（來源：lang.ts） */
const buildArticleLangOptions = (): Map<string, string> =>
{
    return SUPPORTED_LANGS.reduce<Map<string, string>>((acc, lang) =>
    {
        acc.set(String(lang), LangLabelMap[lang] ?? String(lang));
        return acc;
    }, new Map<string, string>());
};
// #endregion

// #region Private
/** ✅ 共用：取下一個 RowId（明細用） */

/** 取得明細下一個 RowId。 */
const getNextRowId = (rows: Array<{ RowId?: number; }> = []): number =>
{
    // 取最大 RowId + 1
    const maxId = rows.reduce((max, r) => (typeof r.RowId === "number" && r.RowId > max ? r.RowId : max), 0);
    return maxId + 1;
};

/** ✅ 共用：debounce（停止輸入 delayMs 後才更新值） */
const useDebouncedValue = (value: string, delayMs: number): string =>
{
    const [debounced, setDebounced] = useState<string>(value);

    useEffect(() =>
    {
        const t = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(t);
    }, [value, delayMs]);

    return debounced;
};
// #endregion
