import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { EditGridCellRenderArgs, EditGridCellValue, EditGridEditingStateArgs, EditGridSubDetailRenderArgs, IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { useEditGridSubDetailState } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibPicture, useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibFile, LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LoadingErrorHandler } from "@/SysCore/Components/LoadingErrorHandler";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { SpecHomePage1821ModelFields, SpecHomePage1821SetFields } from "@/types/SchemaFields";
import { type ReactNode, useCallback, useMemo } from "react";
import {
    createEmptyHomePage1821Set,
    getHomePageFilePreviewUrl,
    type HomePage1821FormRefs,
    toHomePageFileCellValue,
    useHomePage1821BannerEditGrid,
    useHomePage1821LangFormTemplate,
    useHomePage1821ShortcutEditGrid,
    useHomePage1821ShortcutModuleItemEditGrid,
    useHomePage1821SummaryFetchData,
} from "./Server_HomePageSetting_Form_Hook";

// #region Property
type HomePageSet = components["schemas"]["SpecHomePage1821Set_DTO"];

const editGridStyle: IEditGridView_Style = {
    TableStyle: "table table-striped table-bordered table-hover",
    ToolbarStyle: "d-flex align-items-center justify-content-between mb-2",
    ButtonStyle: "btn btn-custom btn-rounded btn-sm",
    DangerButtonStyle: "btn btn-danger btn-rounded btn-sm",
    ErrorStyle: "text-danger small mt-1",
};

interface HeaderPictureFieldProps
{
    theme: IBETheme;
    lang: Lang;
    formData: ServerFormBinding<HomePageSet>;
    fieldName: typeof SpecHomePage1821ModelFields.Card1PicId | typeof SpecHomePage1821ModelFields.Card2PicId;
    label: string;
}

interface HomePageOptionsJson
{
    categoryIds: string;
    tagIds: string;
}

type HomePageOptionsKey = keyof HomePageOptionsJson;
// #endregion

// #region Public
export const Server_HomePage1821_Form_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    const summary = useHomePage1821SummaryFetchData({ supportLangs: SUPPORTED_LANGS });

    return (
        <LoadingErrorHandler isLoading={summary.isLoading} errorList={summary.errors}>
            <MainFormComp theme={prop.theme} supportLangs={summary.rawData.supportLangs} summary={summary} />
        </LoadingErrorHandler>
    );
};
// #endregion

// #region Section
const MainFormComp = (prop: { theme: IBETheme; supportLangs: Lang[]; summary: ReturnType<typeof useHomePage1821SummaryFetchData>; }) =>
{
    const langTabs: LibTabsProp = useMemo(
        () => ({ Style: prop.theme.Tabs, item: Object.fromEntries(prop.supportLangs.map(lang => [lang, getLangDisplayName(lang)])) }),
        [prop.theme.Tabs, prop.supportLangs],
    );

    const components = useMemo<Record<string, ReactNode[]>>(() =>
    {
        return Object.fromEntries(
            prop.supportLangs.map(lang => [lang, [<LangFormTabComp key={lang} theme={prop.theme} lang={lang as Lang} summary={prop.summary} />]]),
        );
    }, [prop.summary, prop.supportLangs, prop.theme]);

    return <TabContentComp tabInfos={langTabs} components={components} />;
};

const LangFormTabComp = (prop: { theme: IBETheme; lang: Lang; summary: ReturnType<typeof useHomePage1821SummaryFetchData>; }) =>
{
    const internalId = prop.summary.rawData.langInternalIdMap[prop.lang] ?? "";
    const template = useHomePage1821LangFormTemplate({
        theme: prop.theme,
        adapter: prop.summary.adapter.HomePage,
        lang: prop.lang,
        internalId,
        onAfterSave: prop.summary.refetchData,
    });

    return (
        <Server_FormTemplate_Comp
            key={`${prop.lang}_${internalId || "new"}`}
            template={template}
            renderContent={({ vm }) => <LangSetTabComp theme={prop.theme} lang={prop.lang} binding={vm.rawData.formData} refs={vm.refs} />}
        />
    );
};

const LangSetTabComp = (prop: { theme: IBETheme; lang: Lang; binding: ServerFormBinding<HomePageSet>; refs: HomePage1821FormRefs; }) =>
{
    const buildSectionKey = (section: string) => `${prop.lang}_${section}`;

    const sectionTabs: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: {
            [buildSectionKey("Banner")]: "橫幅圖片",
            [buildSectionKey("ShortcutItems")]: "標籤項目",
            [buildSectionKey("Cards")]: "卡片設定",
            [buildSectionKey("Links")]: "相關連結",
        },
    };

    const sectionComponents: Record<string, ReactNode[]> = {
        [buildSectionKey("Banner")]: [<BannerSectionComp key="banner" theme={prop.theme} formData={prop.binding} lang={prop.lang} />],
        [buildSectionKey("ShortcutItems")]: [<ShortcutItemsSectionComp key="shortcut-items" theme={prop.theme} formData={prop.binding} lang={prop.lang} refs={prop.refs} />],
        [buildSectionKey("Cards")]: [<CardsSectionComp key="cards" theme={prop.theme} formData={prop.binding} lang={prop.lang} />],
        [buildSectionKey("Links")]: [<LinksSectionComp key="links" theme={prop.theme} formData={prop.binding} lang={prop.lang} refs={prop.refs} />],
    };

    return (
        <div className="col-12">
            <TabContentComp tabInfos={sectionTabs} components={sectionComponents} />
        </div>
    );
};

const BannerSectionComp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: string; }) =>
{
    const { renderPicturePreview } = useHomePageEditGridRenderers();
    const bannerGrid = useHomePage1821BannerEditGrid({ binding: prop.formData, lang: prop.lang, style: editGridStyle, renderPicturePreview });

    return (
        <div className="col-12">
            <EditGrid {...bannerGrid.editGridProps} />
        </div>
    );
};

const ShortcutItemsSectionComp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: string; refs: HomePage1821FormRefs; }) =>
{
    return (
        <div className="col-12">
            <ShortcutSectionComp theme={prop.theme} formData={prop.formData} lang={prop.lang} refs={prop.refs} />
        </div>
    );
};

const ShortcutSectionComp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: string; refs: HomePage1821FormRefs; }) =>
{
    const subDetail = useEditGridSubDetailState();
    const { renderPicturePreview } = useHomePageEditGridRenderers();
    const renderModuleDetailAction = useCallback(
        (args: EditGridCellRenderArgs) => <ModuleDetailActionButton args={args} expandedRowKey={subDetail.expandedRowKey} onToggle={subDetail.toggleSubDetail} />,
        [subDetail.expandedRowKey, subDetail.toggleSubDetail],
    );
    const shortcutGrid = useHomePage1821ShortcutEditGrid({
        binding: prop.formData,
        lang: prop.lang,
        style: editGridStyle,
        renderPicturePreview,
        renderModuleDetailAction,
    });
    const renderSubDetail = useCallback(
        (args: EditGridSubDetailRenderArgs) => (
            <ModuleItemSubDetailComp
                theme={prop.theme}
                formData={prop.formData}
                lang={prop.lang}
                refs={prop.refs}
                parentRowId={getShortcutParentRowId(args)}
                onEditingStateChange={subDetail.onSubDetailEditingStateChange}
            />
        ),
        [prop.formData, prop.lang, prop.refs, prop.theme, subDetail.onSubDetailEditingStateChange],
    );

    return (
        <div className="col-12">
            <EditGrid
                {...shortcutGrid.editGridProps}
                expandedRowKey={subDetail.expandedRowKey}
                subDetailRender={renderSubDetail}
                subDetailRowClassName="edit-grid-sub-detail-row bg-light"
            />
        </div>
    );
};

const ModuleItemSubDetailComp = (
    prop: {
        theme: IBETheme;
        formData: ServerFormBinding<HomePageSet>;
        lang: string;
        refs: HomePage1821FormRefs;
        parentRowId: number;
        onEditingStateChange: (args: EditGridEditingStateArgs) => void;
    },
) =>
{
    const moduleItemGrid = useHomePage1821ShortcutModuleItemEditGrid({
        binding: prop.formData,
        lang: prop.lang,
        style: editGridStyle,
        refs: prop.refs,
        parentRowId: prop.parentRowId,
    });

    return (
        <div className="p-3">
            <EditGrid {...moduleItemGrid.editGridProps} onEditingStateChange={prop.onEditingStateChange} />
        </div>
    );
};

const CardsSectionComp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: Lang; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);

    return (
        <>
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入區塊標題"
                {...setField(SpecHomePage1821SetFields.SpecHomePage1821, SpecHomePage1821ModelFields.Section3Title, "string")}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入區塊副標題"
                {...setField(SpecHomePage1821SetFields.SpecHomePage1821, SpecHomePage1821ModelFields.Section3SubTitle, "string")}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入卡片 1 標題"
                {...setField(SpecHomePage1821SetFields.SpecHomePage1821, SpecHomePage1821ModelFields.Card1Title, "string")}
            />
            <HeaderPictureField
                theme={prop.theme}
                lang={prop.lang}
                formData={prop.formData}
                fieldName={SpecHomePage1821ModelFields.Card1PicId}
                label="卡片 1 圖片"
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入卡片 2 標題"
                {...setField(SpecHomePage1821SetFields.SpecHomePage1821, SpecHomePage1821ModelFields.Card2Title, "string")}
            />
            <HeaderPictureField
                theme={prop.theme}
                lang={prop.lang}
                formData={prop.formData}
                fieldName={SpecHomePage1821ModelFields.Card2PicId}
                label="卡片 2 圖片"
            />
        </>
    );
};

const LinksSectionComp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: Lang; refs: HomePage1821FormRefs; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);
    const options = parseOptionsText(prop.formData.data?.SpecHomePage1821?.LinkOptions);

    return (
        <>
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入相關連結標題"
                {...setField(SpecHomePage1821SetFields.SpecHomePage1821, SpecHomePage1821ModelFields.Section4Title, "string")}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入相關連結副標題"
                {...setField(SpecHomePage1821SetFields.SpecHomePage1821, SpecHomePage1821ModelFields.Section4SubTitle, "string")}
            />
            <LibCheckBox
                Style={prop.theme.CheckBox}
                ColumnDisplayName="相關連結類別"
                options={prop.refs.webResource.categoryMap}
                InputValue={splitCsvValues(options.categoryIds)}
                onChange={(value) => updateHeaderOptions(prop.formData, prop.lang, "categoryIds", value)}
            />
            <LibCheckBox
                Style={prop.theme.CheckBox}
                ColumnDisplayName="相關連結標籤"
                options={prop.refs.webResource.tagMap}
                InputValue={splitCsvValues(options.tagIds)}
                onChange={(value) => updateHeaderOptions(prop.formData, prop.lang, "tagIds", value)}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入查看更多連結"
                {...setField(SpecHomePage1821SetFields.SpecHomePage1821, SpecHomePage1821ModelFields.LinkViewMore, "string")}
            />
        </>
    );
};

const HeaderPictureField = (props: HeaderPictureFieldProps) =>
{
    const uploadPic = useUploadPicture();
    const currentPicId = getHeaderFieldValue(props.formData.data, props.fieldName);
    const previewSrc = uploadPic.result.previewUrl || getHomePageFilePreviewUrl(currentPicId) || "https://dummyimage.com/640x360/555/fff.png";

    return (
        <LibFile
            Style={props.theme.File}
            ColumnDisplayName={props.label}
            Multiple={false}
            InputValue=""
            accept="image/*"
            parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
            onChange={(files) => uploadPic.handleFileChange(files, internalId => updateHeaderPictureId(props.formData, props.lang, props.fieldName, internalId))}
        >
            <LibPicture key="preview" ColumnDisplayName={props.label} PicSrc={previewSrc} PicDescription={props.label} />
        </LibFile>
    );
};
// #endregion

// #region EntityComp
const ModuleDetailActionButton = (props: { args: EditGridCellRenderArgs; expandedRowKey: string | null; onToggle: (row: EditGridCellRenderArgs["row"]) => void; }) =>
{
    const isExpanded = props.expandedRowKey === props.args.row.keyId;

    return (
        <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            aria-expanded={isExpanded}
            onClick={() => props.onToggle(props.args.row)}
        >
            {isExpanded ? "收合" : "查看"}
        </button>
    );
};

const HomePageImagePreview = (props: { value: EditGridCellValue; }) =>
{
    const file = toHomePageFileCellValue(props.value);
    const previewUrl = file.url ?? getHomePageFilePreviewUrl(file.internalId);
    const alt = file.originalFileName || file.fileName || "首頁圖片預覽";

    if (!previewUrl) return <span className="small">尚未選擇圖片</span>;
    return <img src={previewUrl} alt={alt} style={{ maxWidth: "160px", maxHeight: "120px", objectFit: "contain" }} />;
};
// #endregion

// #region Private
const getShortcutParentRowId = (args: EditGridSubDetailRenderArgs): number =>
{
    const rowId = Number(args.row.RowId ?? args.row.rowId ?? args.row.rowid ?? 0);
    return Number.isFinite(rowId) ? rowId : 0;
};

const DefaultOptionsJson = "{\"categoryIds\":\"\",\"tagIds\":\"\"}";

const parseOptionsText = (value?: string | null): HomePageOptionsJson =>
{
    try
    {
        const parsed = JSON.parse(normalizeOptionsText(value)) as Partial<HomePageOptionsJson>;
        return { categoryIds: normalizeText(parsed.categoryIds), tagIds: normalizeText(parsed.tagIds) };
    } catch
    {
        return { categoryIds: "", tagIds: "" };
    }
};

const updateHeaderOptions = (
    binding: ServerFormBinding<HomePageSet>,
    lang: Lang,
    key: HomePageOptionsKey,
    value: unknown,
): void =>
{
    binding.setFormData(prev =>
    {
        const base = prev ?? createEmptyHomePage1821Set(lang);
        const currentOptions = parseOptionsText(base.SpecHomePage1821?.LinkOptions);
        const nextOptions = { ...currentOptions, [key]: toCsvText(value) };

        return {
            ...base,
            SpecHomePage1821: {
                ...base.SpecHomePage1821,
                LinkOptions: JSON.stringify(nextOptions),
            },
        };
    });
};

const normalizeOptionsText = (value?: string | null): string =>
{
    const text = normalizeText(value);
    return text || DefaultOptionsJson;
};

const splitCsvValues = (value?: string | null): string[] =>
{
    return normalizeText(value).split(",").map(item => item.trim()).filter(Boolean);
};

const toCsvText = (value: unknown): string =>
{
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean).join(",");
    return normalizeText(value as string | number | boolean | null | undefined);
};

const normalizeText = (value?: string | number | boolean | null): string =>
{
    return String(value ?? "").trim();
};

const getLangDisplayName = (lang?: string) =>
{
    const key = String(lang ?? "").trim().toLowerCase() as Lang;
    return LangLabelMap[key] ?? lang ?? "";
};

const useHomePageEditGridRenderers = () =>
{
    const renderPicturePreview = useCallback((args: EditGridCellRenderArgs) => <HomePageImagePreview value={args.value} />, []);

    return { renderPicturePreview };
};

const getHeaderFieldValue = (data: HomePageSet | undefined, fieldName: HeaderPictureFieldProps["fieldName"]): string =>
{
    return String(data?.SpecHomePage1821?.[fieldName] ?? "");
};

const updateHeaderPictureId = (
    binding: ServerFormBinding<HomePageSet>,
    lang: Lang,
    fieldName: HeaderPictureFieldProps["fieldName"],
    internalId: string,
): void =>
{
    const nextId = normalizeRelationId(internalId);

    binding.setFormData(prev =>
    {
        const base = prev ?? createEmptyHomePage1821Set(lang);
        return { ...base, SpecHomePage1821: { ...base.SpecHomePage1821, [fieldName]: nextId } };
    });
};

const normalizeRelationId = (value?: string | null): string | null =>
{
    const text = String(value ?? "").trim();
    return text || null;
};
// #endregion
