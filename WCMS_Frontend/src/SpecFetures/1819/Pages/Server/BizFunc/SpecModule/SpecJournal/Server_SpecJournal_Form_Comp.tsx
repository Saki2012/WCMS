import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibDropList, LibFileInput, LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField, useSetTableFileField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { DefaultLang, type Lang, LangLabelMap, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import {
    SpecJournalAuthorFields,
    SpecJournalDocumentFields,
    SpecJournalModelFields,
    SpecJournalOpenPointFilesFields,
    SpecJournalRefFilesFields,
    SpecJournalRefFormatFields,
    SpecJournalSetFields,
} from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    type ISpecJournalDialogConfirmPayload,
    Server_SpecJournal_Dialog_Comp,
    type SpecJournalDialogActionType,
} from "./Server_SpecJournal_Dialog_Comp";
import {
    type SpecJournalFormActionsOpt,
    type SpecJournalMode,
    useSpecJournalFormFetchData,
} from "./Server_SpecJournal_Form_Hook";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type SpecJournalDocuments = components["schemas"]["SpecJournalDocument_DTO"];
type SpecJournalOpenPointFiles = components["schemas"]["SpecJournalOpenPointFiles_DTO"];
type SpecJournalRefFiles = components["schemas"]["SpecJournalRefFiles_DTO"];
type SpecJournalAuthor = components["schemas"]["SpecJournalAuthor_DTO"];
type ORCIDData = components["schemas"]["ORCIDData"];
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type SpecJournalIndexDetailSet = components["schemas"]["SpecJournalIndexDetail_DTO"];
type AuthorType = 0 | 1;
type SpecJournalAdapterType = ReturnType<typeof SpecJournalAdapter>;

const emptyData: SpecJournalSet = {
    SpecJournal: {},
    SpecJournalAuthor: [],
    SpecJournalRefFormat: [],
    SpecJournalOpenPointFiles: [],
    SpecJournalRefFiles: [],
    SpecJournalKeywords: [],
    SpecJournalDocument: [],
    SpecJournalTypes: [],
};

export const Server_SpecJournal_Form_Comp = (prop: { theme: IBETheme; lang: Lang; mode: SpecJournalMode; }) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const onBackToList = useCallback(() =>
    {
        navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, pathname]);
    const actionsOpt = useMemo<SpecJournalFormActionsOpt>(() =>
    {
        return { onBackToList };
    }, [onBackToList]);
    const getData = useSpecJournalFormFetchData({
        lang: prop.lang,
        internalId: internalId ?? "",
        emptyData,
        actionsOpt,
    });
    const formTitle = useMemo(() =>
    {
        const displayName = prop.mode === "preprint" ? "預刊本" : "期刊";
        return internalId ? `修改${displayName}` : `新增${displayName}`;
    }, [internalId, prop.mode]);

    const formProp: FormCompProp = {
        Title: formTitle,
        Theme: prop.theme,
        IsLoading: getData.isLoading,
        ErrorList: getData.errors,
        Actions: getData.rawData.actions,
    };

    return (
        <FormComp prop={formProp}>
            <ModeActionBarComp
                theme={prop.theme}
                mode={prop.mode}
                isEdit={Boolean(internalId)}
                internalId={internalId ?? ""}
                adapter={getData.adapter.SpecJournal}
                indexRawData={getData.rawData.indexRawData}
                formData={getData.rawData.formData}
                onBackToList={onBackToList}
            />
            <MainFormComp
                theme={prop.theme}
                mode={prop.mode}
                adapter={getData.adapter.SpecJournal}
                formData={getData.rawData.formData}
                indexRawData={getData.rawData.indexRawData}
                tagOptionsRaw={getData.rawData.tagOptionsRaw}
                keywords={getData.rawData.keywords}
                specDocumentTypeOptionsRaw={getData.rawData.specDocumentTypeOptionsRaw}
            />
        </FormComp>
    );
};

const MainFormComp = (
    props: {
        theme: IBETheme;
        mode: SpecJournalMode;
        adapter: SpecJournalAdapterType;
        formData: UseFetchFormDataResult<SpecJournalSet>;
        indexRawData: SpecJournalIndexSet[];
        tagOptionsRaw: Record<string, string>;
        specDocumentTypeOptionsRaw: Record<string, string>;
        keywords: SpecJournalSet[];
    },
) =>
{
    const setField = useSetTableField<SpecJournalSet>(props.formData);
    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: {
            Basic: "基本資料",
            Author: "期刊作者",
            CommunicateAuthor: "通訊作者",
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
                authorType={0}
            />,
        ],
        CommunicateAuthor: [
            <AuthorComp
                key="communicateAuthor"
                theme={props.theme}
                adapter={props.adapter}
                formData={props.formData}
                authorType={1}
            />,
        ],
        Bibliography: [
            <LibTinyMCE
                key="bibliography"
                Style={props.theme.TinyMCE}
                {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Bibliography, "string")}
                ColumnDisplayName={""}
            />,
        ],
        RefFormat: [<RefFormatComp key="refFormat" theme={props.theme} formData={props.formData} />],
        Files: [<FilesComp key="files" theme={props.theme} formData={props.formData} />],
        Keyword: [
            <KeywordComp key="keyword" theme={props.theme} formData={props.formData} keywords={props.keywords} />,
        ],
        Documents: [
            <DocumentsComp
                key="documents"
                theme={props.theme}
                formData={props.formData}
                specDocumentTypeOptionsRaw={props.specDocumentTypeOptionsRaw}
            />,
        ],
        System: [
            <SystemInfoTabComp
                key="system"
                theme={props.theme}
                formData={props.formData}
                setKey={SpecJournalSetFields.SpecJournal}
            />,
        ],
    };
    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};

const BasicComp = (
    props: {
        theme: IBETheme;
        mode: SpecJournalMode;
        formData: UseFetchFormDataResult<SpecJournalSet>;
        indexRawData: SpecJournalIndexSet[];
        tagOptionsRaw: Record<string, string>;
    },
) =>
{
    const setField = useSetTableField<SpecJournalSet>(props.formData);
    const setFileField = useSetTableFileField<SpecJournalSet>(props.formData);
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
    const selectedIndexId = String(props.formData.data?.SpecJournal?.JournalIndexId ?? "");
    const indexRowOptions = useMemo(() =>
    {
        const dict = indexRowOptionsByIndexId[selectedIndexId] ?? {};
        return dict;
    }, [indexRowOptionsByIndexId, selectedIndexId]);
    const prevIndexIdRef = useRef<string | null>(null);
    const types = props.formData.data.SpecJournalTypes ?? [];
    const typeOptions = useMemo(() =>
    {
        const dict = props.tagOptionsRaw ?? {};
        return Object.entries(dict).map(([tagId, label]) => ({ tagId, label }));
    }, [props.tagOptionsRaw]);
    /** 清空主表單上的單一檔案欄位 */
    const clearMainFileField = useCallback((fileIdField: string, fileNameField: string): void =>
    {
        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;
            const nextSpecJournal = {
                ...(prev.SpecJournal ?? {}),
                [fileIdField]: null,
                [fileNameField]: "",
            };
            return {
                ...prev,
                SpecJournal: nextSpecJournal,
            };
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
            const cur = (p as any).SpecJournalTypes ?? [];
            if (checked)
            {
                if (cur.some((x: any) => String(x?.TagId ?? "") === tagId)) return p;

                const nextRowId = getNextRowId(cur);
                const next = [...cur, { RowId: nextRowId, TagId: tagId }];
                return { ...(p as any), SpecJournalTypes: next };
            }
            const next = cur.filter((x: any) => String(x?.TagId ?? "") !== tagId);
            return { ...(p as any), SpecJournalTypes: next };
        });
    }, [props.formData]);

    useEffect(() =>
    {
        if (props.mode !== "preprint") return;

        const journal = props.formData.data?.SpecJournal ?? {};
        const hasIndexId = journal?.JournalIndexId != null;
        const hasIndexRowId = journal?.JournalIndexRowId != null;
        if (!hasIndexId && !hasIndexRowId) return;

        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;
            const nextJournal = {
                ...(prev.SpecJournal ?? {}),
                [SpecJournalModelFields.JournalIndexId]: null,
                [SpecJournalModelFields.JournalIndexRowId]: null,
            };
            return { ...prev, SpecJournal: nextJournal };
        });
    }, [
        props.mode,
        props.formData,
        props.formData.data?.SpecJournal?.JournalIndexId,
        props.formData.data?.SpecJournal?.JournalIndexRowId,
    ]);

    useEffect(() =>
    {
        if (props.mode !== "journal") return;

        const prev = prevIndexIdRef.current;
        prevIndexIdRef.current = selectedIndexId;
        if (prev === null) return;

        if (prev !== selectedIndexId)
        {
            props.formData.setFormData(prevData =>
            {
                if (!prevData) return prevData;
                const next = { ...(prevData as SpecJournalSet) };
                const j = { ...(next.SpecJournal ?? {}) };
                j[SpecJournalModelFields.JournalIndexRowId] = null;
                next.SpecJournal = j;
                return next;
            });
        }
    }, [props.mode, selectedIndexId, props.formData]);

    useEffect(() =>
    {
        // 表單載入後：若 ArticleLang 為空，預設寫入 zh-tw
        if (!props.formData.data) return;
        const current = String(props.formData.data?.SpecJournal?.ArticleLang ?? "");
        if (current) return;

        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;
            const next = { ...(prev as SpecJournalSet) };
            const j = { ...(next.SpecJournal ?? {}) };
            j[SpecJournalModelFields.ArticleLang] = DefaultLang;
            next.SpecJournal = j;
            return next;
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
                        {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.JournalIndexId, "string")}
                    />
                    <LibDropList
                        Style={props.theme.DropList2}
                        Options={indexRowOptions}
                        AutoDefaultFirst={false}
                        {...setField(
                            SpecJournalSetFields.SpecJournal,
                            SpecJournalModelFields.JournalIndexRowId,
                            "string",
                        )}
                    />
                </div>
            )}
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Title, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Title_en, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.PageStart, "number")}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.PageEnd, "number")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.DOIUrl, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <div className="row">
                    <div className="col-12 col-lg-6">
                        <LibFileInput
                            LabelColClassName="col-sm-4"
                            InputColClassName="col-sm-8"
                            {...setFileField(
                                SpecJournalSetFields.SpecJournal,
                                SpecJournalModelFields.JournalFileId,
                                SpecJournalModelFields.JournalFileName,
                                { defaultNameFromOriginal: "basename" },
                            )}
                            Accept="application/pdf"
                            onDelete={() =>
                                clearMainFileField(
                                    SpecJournalModelFields.JournalFileId,
                                    SpecJournalModelFields.JournalFileName,
                                )}
                        />
                    </div>
                    <div className="col-12 col-lg-6">
                        <LibFileInput
                            LabelColClassName="col-sm-4"
                            InputColClassName="col-sm-8"
                            {...setFileField(
                                SpecJournalSetFields.SpecJournal,
                                SpecJournalModelFields.InsightPointFileId,
                                SpecJournalModelFields.InsightPointFileName,
                                { defaultNameFromOriginal: "basename" },
                            )}
                            Accept="application/pdf"
                            onDelete={() =>
                                clearMainFileField(
                                    SpecJournalModelFields.InsightPointFileId,
                                    SpecJournalModelFields.InsightPointFileName,
                                )}
                        />
                    </div>
                </div>
            </div>

            <div className="col-12 form-group">
                <LibDropList
                    Style={props.theme.DropList2}
                    Options={articleLangOptions}
                    {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.ArticleLang, "string")}
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
                            <label className="form-check-label" htmlFor={`journal-type-${opt.tagId}`}>
                                {opt.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="col-12 form-group">
                <LibTinyMCE
                    Style={props.theme.TinyMCE}
                    {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Memo, "string")}
                />
            </div>

            <div className="col-12 form-group">
                <LibTinyMCE
                    Style={props.theme.TinyMCE}
                    {...setField(SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Memo_en, "string")}
                />
            </div>
        </>
    );
};

const AuthorComp = (
    props: {
        theme: IBETheme;
        adapter: SpecJournalAdapterType;
        formData: UseFetchFormDataResult<SpecJournalSet>;
        authorType: AuthorType;
    },
) =>
{
    const { publish } = useToast();
    const orcidAction = props.adapter.hooks.useGetAuthorByOrcid();

    const setField = useSetTableField<SpecJournalSet>(props.formData);
    const allAuthors = props.formData.data?.SpecJournalAuthor ?? [];
    /** 依 authorType 過濾目前頁籤要顯示的作者 */
    const authors = useMemo(() =>
    {
        return allAuthors.filter(x => Number(x?.AuthorType ?? 0) === props.authorType);
    }, [allAuthors, props.authorType]);
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
            const btn = el?.closest?.("button[data-bs-toggle=\"tab\"][data-bs-target^=\"#Tab_TWEN_\"]") as
                | HTMLButtonElement
                | null;
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
        const name = (a?.AuthorName ?? "").trim();
        if (name) return name;
        const nameEn = (a?.AuthorName_en ?? "").trim();
        if (nameEn) return nameEn;
        return `未命名${authors.length > 1 ? `(${idx + 1})` : ""}`;
    };

    const activateTabByKey = (key: string): void =>
    {
        const btn = document.querySelector<HTMLButtonElement>(
            `button[data-bs-toggle="tab"][data-bs-target="#Tab_TWEN_${key}"]`,
        );
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
        // 新增目前頁籤對應的作者類型
        if (!props.formData.data) return;

        const nextRowId = getNextRowId();
        const parentJournalId = props.formData.data.SpecJournal?.JournalId ?? allAuthors[0]?.JournalId;
        const newItem: any = {
            JournalId: parentJournalId,
            RowId: nextRowId,
            AuthorType: props.authorType,
        };

        pendingActiveTabKeyRef.current = String(nextRowId);
        activeTabKeyRef.current = String(nextRowId);

        props.formData.setFormData({
            ...props.formData.data,
            SpecJournalAuthor: [...allAuthors, newItem],
        });
    };

    const removeOne = (rowKey: number | string): void =>
    {
        const keyStr = String(rowKey);
        if (activeTabKeyRef.current === keyStr) pendingGoFirstRef.current = true;

        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;

            const list = prev.SpecJournalAuthor ?? [];
            const hitIdx = list.findIndex((a: any, i: number) =>
                String(a?.RowId ?? i) === keyStr
                && Number(a?.AuthorType ?? 0) === props.authorType
            );
            if (hitIdx < 0) return prev;

            const target = list[hitIdx];
            const nextList = list.filter((a: any) =>
            {
                const sameJournalId = a?.JournalId === target?.JournalId;
                const sameRowId = a?.RowId === target?.RowId;
                const sameType = Number(a?.AuthorType ?? 0) === Number(target?.AuthorType ?? 0);
                return !(sameJournalId && sameRowId && sameType);
            });

            return { ...prev, SpecJournalAuthor: nextList };
        });
    };
    const normalizeOrcid = (v: string): string =>
    {
        return (v ?? "").trim().replace(/\s+/g, "").replace(/[^0-9-]/g, "");
    };
    const isLikelyOrcid = (v: string): boolean =>
    {
        return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(v);
    };
    // ✅ 只覆寫空欄位（避免蓋掉使用者已輸入的內容）
    const applyAuthorFromOrcid = useCallback((
        rowKeys: Record<string, string | number | null | undefined>,
        dto: ORCIDData,
    ): void =>
    {
        props.formData.setFormData(prev =>
        {
            if (!prev) return prev;

            const list = prev.SpecJournalAuthor ?? [];
            const hitIdx = list.findIndex(a =>
                String(a?.[SpecJournalAuthorFields.JournalId] ?? "")
                    === String(rowKeys?.[SpecJournalAuthorFields.JournalId] ?? "")
                && String(a?.[SpecJournalAuthorFields.RowId] ?? "")
                    === String(rowKeys?.[SpecJournalAuthorFields.RowId] ?? "")
            );
            if (hitIdx < 0) return prev;

            const cur: SpecJournalAuthor = { ...(list[hitIdx] ?? {}) };
            const fillIfEmpty = (
                oldValue: string | null | undefined,
                newValue: string | null | undefined,
            ): string | null | undefined =>
            {
                const oldText = String(oldValue ?? "").trim();
                const newText = String(newValue ?? "").trim();
                if (!oldText && newText) return newText;
                return oldValue;
            };
            cur.ORCID = fillIfEmpty(cur.ORCID, dto?.ORCID);
            cur.AuthorName = fillIfEmpty(cur.AuthorName, dto?.AuthorName);
            cur.AuthorName_en = fillIfEmpty(cur.AuthorName_en, dto?.AuthorName_en);
            cur.JobTitle = fillIfEmpty(cur.JobTitle, dto?.JobTitle);
            cur.Unit = fillIfEmpty(cur.Unit, dto?.Unit);
            cur.Unit_en = fillIfEmpty(cur.Unit_en, dto?.Unit_en);
            cur.Email = fillIfEmpty(cur.Email, dto?.Email);
            cur.Country = fillIfEmpty(cur.Country, dto?.Country);

            const nextList = [...list];
            nextList[hitIdx] = cur;
            return { ...prev, SpecJournalAuthor: nextList };
        });
    }, [props.formData]);

    // ✅ onBlur：打後端 /Service/SpecJournal/GetAuthorByOrcid
    const handleOrcidBlur = useCallback(async (
        rowKeys: Record<string, string | number | null | undefined>,
        raw: string,
    ): Promise<void> =>
    {
        const orcid = normalizeOrcid(raw);
        if (!orcid) return;
        if (!isLikelyOrcid(orcid)) return;

        const res = await orcidAction.execute(orcid);

        (res.SysMessage ?? []).forEach(item =>
        {
            publish({ level: item.Status, code: item.MessageCode, title: item.Message });
        });

        if (!res.IsSuccess) return;

        const dto = Array.isArray(res.Data) ? (res.Data[0] ?? null) : null;
        if (!dto) return;

        applyAuthorFromOrcid(rowKeys, dto);
    }, [orcidAction, publish, applyAuthorFromOrcid]);
    // tab key/label mapping（同步到 ref）
    const tabItemMap = authors.reduce<Record<string, string>>((acc, a: any, idx: number) =>
    {
        const key = String(a?.RowId ?? idx);
        acc[key] = buildTabLabel(a, idx);
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

    const tabContent = authors.reduce<Record<string, React.ReactNode[]>>((acc, a: any, idx: number) =>
    {
        const tabKey = String(a?.RowId ?? idx);
        const rowKeys: any = {
            [SpecJournalAuthorFields.JournalId]: a?.JournalId,
            [SpecJournalAuthorFields.RowId]: a?.RowId,
        };

        acc[tabKey] = [
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecJournalSetFields.SpecJournalAuthor,
                        SpecJournalAuthorFields.ORCID,
                        "string",
                        rowKeys,
                    )}
                    onBlur={(v) => void handleOrcidBlur(rowKeys, v)}
                />
            </div>,
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecJournalSetFields.SpecJournalAuthor,
                        SpecJournalAuthorFields.AuthorName,
                        "string",
                        rowKeys,
                    )}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecJournalSetFields.SpecJournalAuthor,
                        SpecJournalAuthorFields.AuthorName_en,
                        "string",
                        rowKeys,
                    )}
                />
            </div>,
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecJournalSetFields.SpecJournalAuthor,
                        SpecJournalAuthorFields.JobTitle,
                        "string",
                        rowKeys,
                    )}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecJournalSetFields.SpecJournalAuthor,
                        SpecJournalAuthorFields.Country,
                        "string",
                        rowKeys,
                    )}
                />
            </div>,
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecJournalSetFields.SpecJournalAuthor,
                        SpecJournalAuthorFields.Unit,
                        "string",
                        rowKeys,
                    )}
                />
                <LibTextBox
                    Style={props.theme.TextBox3}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecJournalSetFields.SpecJournalAuthor,
                        SpecJournalAuthorFields.Unit_en,
                        "string",
                        rowKeys,
                    )}
                />
            </div>,
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecJournalSetFields.SpecJournalAuthor,
                        SpecJournalAuthorFields.Email,
                        "string",
                        rowKeys,
                    )}
                />
            </div>,
        ];

        return acc;
    }, {});

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

const TAB_PREFIX = "REF_";

const RefFormatComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet>; }) =>
{
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

    useEffect(() =>
    {
        const handleClick = (e: MouseEvent) =>
        {
            const el = e.target as HTMLElement | null;
            const btn = el?.closest?.(`button[data-bs-toggle="tab"][data-bs-target^="#Tab_TWEN_${TAB_PREFIX}"]`) as
                | HTMLButtonElement
                | null;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const btn = document.querySelector<HTMLButtonElement>(
            `button[data-bs-toggle="tab"][data-bs-target="#Tab_TWEN_${TAB_PREFIX}${key}"]`,
        );
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

            const list = prev.SpecJournalRefFormat ?? [];
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

            return { ...prev, SpecJournalRefFormat: nextList };
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
        const rowKeys: any = {
            [SpecJournalRefFormatFields.JournalId]: f?.JournalId,
            [SpecJournalRefFormatFields.RowId]: f?.RowId,
        };

        acc[tabKey] = [
            <div className="col-12 form-group">
                <LibTextBox
                    Style={props.theme.TextBox}
                    DefaultInputDisplay="請輸入"
                    {...setField(
                        SpecJournalSetFields.SpecJournalRefFormat,
                        SpecJournalRefFormatFields.Title,
                        "string",
                        rowKeys,
                    )}
                />
                <LibTinyMCE
                    Style={props.theme.TinyMCE}
                    {...setField(
                        SpecJournalSetFields.SpecJournalRefFormat,
                        SpecJournalRefFormatFields.Content,
                        "string",
                        rowKeys,
                    )}
                />
            </div>,
        ];

        return acc;
    }, {});

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

const FilesComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet>; }) =>
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

const OpenPointComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet>; }) =>
{
    const setFileField = useSetTableFileField(props.formData);
    const allFiles: SpecJournalOpenPointFiles[] = props.formData.data?.SpecJournalOpenPointFiles ?? [];

    // 提交回整份表單（關鍵：真正更新 formData）
    const commitFiles = (nextFiles: SpecJournalOpenPointFiles[]) =>
    {
        props.formData.setFormData(prev => ({
            ...(prev ?? {
                SpecJournal: {},
                SpecJournalAuthor: [],
                SpecJournalRefFiles: [],
                SpecJournalRefFormat: [],
                SpecJournalOpenPointFiles: [],
                SpecJournalTags: [],
                SpecJournalTypes: [],
            }),
            SpecJournalOpenPointFiles: nextFiles,
        }));
    };

    // 新增一筆附件列
    const addFile = () =>
    {
        const list = allFiles;
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: SpecJournalOpenPointFiles = {
            RowId: nextRowId,
            OpenPointFileId: null,
            OpenPointFileName: "",
        };
        commitFiles([...allFiles, newItem]);
    };

    // 刪除第 i 筆附件列
    const removeFileAt = (i: number) =>
    {
        const filtered = allFiles;
        const target = filtered[i];
        if (!target) return;
        const nextAll = allFiles.filter(f => !(f.RowId === target.RowId));
        commitFiles(nextAll);
    };

    return (
        <>
            <div role="group" className="mt-4">
                <button type="button" onClick={addFile} aria-label="新增附件" className="btn btn-outline-primary mb-2">
                    新增附件
                </button>
                {allFiles.map((f, i) =>
                {
                    const rowKeys = {
                        [SpecJournalOpenPointFilesFields.JournalId]: f.JournalId,
                        [SpecJournalOpenPointFilesFields.RowId]: f.RowId,
                    };

                    return (
                        <div key={`${f.RowId}`} className="flex items-center gap-2 mb-2">
                            <LibFileInput
                                {...setFileField(
                                    SpecJournalSetFields.SpecJournalOpenPointFiles,
                                    SpecJournalOpenPointFilesFields.OpenPointFileId,
                                    SpecJournalOpenPointFilesFields.OpenPointFileName,
                                    rowKeys,
                                    { defaultNameFromOriginal: "basename" },
                                )}
                                Accept="application/pdf"
                                onDelete={() => removeFileAt(i)}
                            />
                        </div>
                    );
                })}
            </div>
        </>
    );
};

const RefFilesComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<SpecJournalSet>; }) =>
{
    const setFileField = useSetTableFileField(props.formData);
    const allFiles: SpecJournalRefFiles[] = props.formData.data?.SpecJournalRefFiles ?? [];

    // 提交回整份表單（關鍵：真正更新 formData）
    const commitFiles = (nextFiles: SpecJournalRefFiles[]) =>
    {
        props.formData.setFormData(prev => ({
            ...(prev ?? {
                SpecJournal: {},
                SpecJournalAuthor: [],
                SpecJournalRefFiles: [],
                SpecJournalRefFormat: [],
                SpecJournalOpenPointFiles: [],
                SpecJournalTags: [],
                SpecJournalTypes: [],
            }),
            SpecJournalRefFiles: nextFiles,
        }));
    };

    // 新增一筆附件列
    const addFile = () =>
    {
        const list = allFiles;
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: SpecJournalRefFiles = {
            RowId: nextRowId,
            RefFileId: null,
            RefFileName: "",
        };
        commitFiles([...allFiles, newItem]);
    };

    // 刪除第 i 筆附件列
    const removeFileAt = (i: number) =>
    {
        const filtered = allFiles;
        const target = filtered[i];
        if (!target) return;
        const nextAll = allFiles.filter(f => !(f.RowId === target.RowId));
        commitFiles(nextAll);
    };

    return (
        <>
            <div role="group" className="mt-4">
                <button type="button" onClick={addFile} aria-label="新增附件" className="btn btn-outline-primary mb-2">
                    新增附件
                </button>
                {allFiles.map((f, i) =>
                {
                    const rowKeys = {
                        [SpecJournalRefFilesFields.JournalId]: f.JournalId,
                        [SpecJournalRefFilesFields.RowId]: f.RowId,
                    };

                    return (
                        <div key={`${f.RowId}`} className="flex items-center gap-2 mb-2">
                            <LibFileInput
                                {...setFileField(
                                    SpecJournalSetFields.SpecJournalRefFiles,
                                    SpecJournalRefFilesFields.RefFileId,
                                    SpecJournalRefFilesFields.RefFileName,
                                    rowKeys,
                                    { defaultNameFromOriginal: "basename" },
                                )}
                                Accept="application/pdf"
                                onDelete={() => removeFileAt(i)}
                            />
                        </div>
                    );
                })}
            </div>
        </>
    );
};

const KeywordComp = (props: {
    theme: IBETheme;
    formData: UseFetchFormDataResult<SpecJournalSet>;
    keywords: SpecJournalSet[];
}) =>
{
    const data = props.formData.data ?? {};
    const tags = data.SpecJournalKeywords ?? [];
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
            (s as any)?.SpecJournalKeywords?.forEach((k: any) =>
            {
                const lang = String(k?.LangCode ?? "").toLowerCase();
                const kw = String(k?.Keyword ?? "").trim();
                if (!kw) return;
                if (lang === "zh-tw") zh.add(kw);
                if (lang === "en") en.add(kw);
            });
        });

        return {
            zh: Array.from(zh),
            en: Array.from(en),
        };
    }, [props.keywords]);

    useEffect(() =>
    {
        const q = zhDebounced.trim();
        if (q.length < 2)
        {
            setZhSuggestions([]);
            return;
        }
        const hit = keywordPool.zh
            .filter(x => x.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 20)
            .map((x, i) => ({ TagId: `${i}`, TagName: x }));
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
        const hit = keywordPool.en
            .filter(x => x.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 20)
            .map((x, i) => ({ TagId: `${i}`, TagName: x }));
        setEnSuggestions(hit);
    }, [enDebounced, keywordPool.en]);

    const addKeyword = useCallback((lang: Lang, name: string): void =>
    {
        const value = name.trim();
        if (!value) return;

        props.formData.setFormData(prev =>
        {
            const p = prev ?? {};
            const cur = (p as any).SpecJournalKeywords ?? [];
            const exists = cur.some((x: any) =>
                String(x?.LangCode ?? "") === lang
                && String(x?.Keyword ?? "").trim().toLowerCase() === value.toLowerCase()
            );
            if (exists) return p;

            const nextRowId = getNextRowId(cur);
            const next = [...cur, { RowId: nextRowId, LangCode: lang, Keyword: value }];
            return { ...(p as any), SpecJournalKeywords: next };
        });

        if (lang === "zh-tw") setZhInput("");
        if (lang === "en") setEnInput("");
    }, [props.formData]);

    const removeKeyword = useCallback((rowId: number): void =>
    {
        props.formData.setFormData(prev =>
        {
            const p = prev ?? {};
            const cur = (p as any).SpecJournalKeywords ?? [];
            const next = cur.filter((x: any) => Number(x?.RowId ?? 0) !== rowId);
            return { ...(p as any), SpecJournalKeywords: next };
        });
    }, [props.formData]);

    const renderKeywordChips = (lang: Lang) =>
    {
        const list = (tags as any[]).filter(x => String(x?.LangCode ?? "") === lang);
        return (
            <div
                className="d-flex flex-wrap gap-2 mt-2"
                aria-label={lang === "zh-tw" ? "中文標籤清單" : "英文標籤清單"}
            >
                {list.map((x: any) => (
                    <span
                        key={`${lang}-${x.RowId}`}
                        className="badge bg-secondary d-inline-flex align-items-center gap-2"
                    >
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
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => addKeyword("zh-tw", zhInput)}
                        aria-label="加入中文關鍵字"
                    >
                        Add
                    </button>
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
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => addKeyword("en", enInput)}
                        aria-label="Add English keyword"
                    >
                        Add
                    </button>
                </div>
                {renderSuggestList(enSuggestions, (name) => addKeyword("en", name))}
                {renderKeywordChips("en")}
            </div>
        </>
    );
};

const DocumentsComp = (
    props: {
        theme: IBETheme;
        formData: UseFetchFormDataResult<SpecJournalSet>;
        specDocumentTypeOptionsRaw: Record<string, string>;
    },
) =>
{
    const setField = useSetTableField(props.formData);
    const setFileField = useSetTableFileField(props.formData);
    const allFiles: SpecJournalDocuments[] = props.formData.data?.SpecJournalDocument ?? [];
    // 提交回整份表單（關鍵：真正更新 formData）
    const commitFiles = (nextFiles: SpecJournalDocuments[]) =>
    {
        props.formData.setFormData(prev => ({
            ...(prev ?? {
                SpecJournal: {},
                SpecJournalAuthor: [],
                SpecJournalRefFiles: [],
                SpecJournalRefFormat: [],
                SpecJournalDocument: [],
                SpecJournalOpenPointFiles: [],
                SpecJournalTags: [],
                SpecJournalTypes: [],
            }),
            SpecJournalDocument: nextFiles,
        }));
    };
    // 新增一筆附件列
    const addFile = () =>
    {
        const list = allFiles;
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: SpecJournalDocuments = {
            RowId: nextRowId,
            DocumentId: null,
            DocumentName: "",
        };
        commitFiles([...allFiles, newItem]);
    };
    // 刪除第 i 筆附件列
    const removeFileAt = (i: number) =>
    {
        const filtered = allFiles;
        const target = filtered[i];
        if (!target) return;
        const nextAll = allFiles.filter(f => !(f.RowId === target.RowId));
        commitFiles(nextAll);
    };

    return (
        <>
            <div role="group" className="mt-4">
                <button type="button" onClick={addFile} aria-label="新增附件" className="btn btn-outline-primary mb-2">
                    新增附件
                </button>
                {allFiles.map((f, i) =>
                {
                    const rowKeys = {
                        [SpecJournalDocumentFields.JournalId]: f.JournalId,
                        [SpecJournalDocumentFields.RowId]: f.RowId,
                    };
                    return (
                        <div key={`${f.RowId}`} className="flex items-center gap-2 mb-2">
                            <LibDropList
                                Style={props.theme.DropList2}
                                Options={props.specDocumentTypeOptionsRaw}
                                AutoDefaultFirst={false}
                                {...setField(
                                    SpecJournalSetFields.SpecJournalDocument,
                                    SpecJournalDocumentFields.DocumentType,
                                    "number",
                                    rowKeys,
                                )}
                            />
                            <LibFileInput
                                {...setFileField(
                                    SpecJournalSetFields.SpecJournalDocument,
                                    SpecJournalDocumentFields.DocumentId,
                                    SpecJournalDocumentFields.DocumentName,
                                    rowKeys,
                                    { defaultNameFromOriginal: "basename" },
                                )}
                                onDelete={() => removeFileAt(i)}
                            />
                        </div>
                    );
                })}
            </div>
        </>
    );
};

/** ✅ 共用：取下一個 RowId（明細用） */
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

/** ✅ Header 下拉：IndexId -> IndexName */
const buildIndexHeaderOptions = (rawData: SpecJournalIndexSet[] = []): Record<string, string> =>
{
    // 轉成下拉可用的 dict
    return rawData.reduce<Record<string, string>>((acc, x) =>
    {
        const id = String(x?.SpecJournalIndex?.IndexId ?? "");
        const name = String(x?.SpecJournalIndex?.IndexName ?? "");
        if (!id) return acc;
        acc[id] = name || id;
        return acc;
    }, {});
};

/** ✅ Detail 下拉：IndexId -> (RowId -> "X卷Y期") */
const buildIndexDetailOptionsByIndexId = (
    rawData: SpecJournalIndexSet[] = [],
): Record<string, Record<string, string>> =>
{
    // 依 header(IndexId) 分組 detail(RowId)
    return rawData.reduce<Record<string, Record<string, string>>>((acc, x) =>
    {
        const indexId = String(x?.SpecJournalIndex?.IndexId ?? "");
        if (!indexId) return acc;
        const details = (x?.SpecJournalIndexDetail ?? []) as SpecJournalIndexDetailSet[];
        const dict = details.reduce<Record<string, string>>((dAcc, d) =>
        {
            const rowId = String(d?.RowId ?? "");
            if (!rowId) return dAcc;
            const v = d?.Volume ?? "";
            const i = d?.Issue ?? "";
            const label = `${v}卷${i}期`;
            dAcc[rowId] = label;
            return dAcc;
        }, {});
        acc[indexId] = dict;
        return acc;
    }, {});
};

/** ✅ ArticleLang 下拉：LangCode -> 顯示名稱（來源：lang.ts） */
const buildArticleLangOptions = (): Record<string, string> =>
{
    return SUPPORTED_LANGS.reduce<Record<string, string>>((acc, lang) =>
    {
        acc[String(lang)] = LangLabelMap[lang] ?? String(lang);
        return acc;
    }, {});
};

/** 發佈期刊 / 退回預刊功能 Bar（內含 Dialog 狀態） */
const ModeActionBarComp = (
    props: {
        theme: IBETheme;
        mode: SpecJournalMode;
        isEdit: boolean;
        internalId: string;
        adapter: SpecJournalAdapterType;
        indexRawData: SpecJournalIndexSet[];
        formData: UseFetchFormDataResult<SpecJournalSet>;
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
        const value = props.formData.data?.SpecJournal?.JournalIndexId;
        return value == null ? null : String(value);
    }, [props.formData.data?.SpecJournal?.JournalIndexId]);

    const currentIndexRowId = useMemo<number | null>(() =>
    {
        const value = props.formData.data?.SpecJournal?.JournalIndexRowId;
        return value == null ? null : value;
    }, [props.formData.data?.SpecJournal?.JournalIndexRowId]);

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
                    {props.mode === "preprint" && (
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={handleOpenPublish}
                            aria-label={title}
                        >
                            {title}
                        </button>
                    )}

                    {props.mode === "journal" && (
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleOpenRevert}
                            aria-label={title}
                        >
                            {title}
                        </button>
                    )}
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
