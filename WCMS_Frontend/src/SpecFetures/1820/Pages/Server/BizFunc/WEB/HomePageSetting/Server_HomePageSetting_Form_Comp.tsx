import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { EditGridCellRenderArgs, EditGridCellValue, IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import LibCheckBox from "@/SysCore/Components/FormField/FieldComponets/LibCheckBox_Comp";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { type Lang, LangLabelMap, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import {
    SpecHomePage1820ModelFields,
    SpecHomePage1820SetFields,
} from "@/types/SchemaFields";
import { type ReactNode, useCallback, useMemo } from "react";
import {
    getHomePageFilePreviewUrl,
    toHomePageFileCellValue,
    useHomePage1820BannerMediaEditGrid,
    useHomePage1820DetailEditGrid,
    useHomePage1820LangFormTemplate,
    useHomePage1820MarqueeEditGrid,
    useHomePage1820ResourceEditGrid,
    useHomePage1820SummaryFetchData,
} from "./Server_HomePageSetting_Form_Hook";

// #region Property
type HomePageSet = components["schemas"]["SpecHomePage1820Set_DTO"];


const editGridStyle: IEditGridView_Style = {
    TableStyle: "table table-striped table-bordered table-hover",
    ToolbarStyle: "d-flex align-items-center justify-content-between mb-2",
    ButtonStyle: "btn btn-custom btn-rounded btn-sm",
    DangerButtonStyle: "btn btn-danger btn-rounded btn-sm",
    ErrorStyle: "text-danger small mt-1",
};


const tinyMceGridStyle = {
    Labelstyle: "sr-only visually-hidden",
    SelectStyle: "col-12 p-0",
};
// #endregion

// #region Public
export const Server_HomePage1820_Form_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    // 外層只查語系摘要，實際表單資料、儲存與 toast 交給各語系 Server_FormTemplate。
    const summary = useHomePage1820SummaryFetchData({ supportLangs: SUPPORTED_LANGS });

    return (
        <LoadingErrorHandler isLoading={summary.isLoading} errorList={summary.errors}>
            <MainFormComp theme={prop.theme} supportLangs={summary.rawData.supportLangs} summary={summary} />
        </LoadingErrorHandler>
    );
};
// #endregion

// #region Section
const MainFormComp = (prop: { theme: IBETheme; supportLangs: Lang[]; summary: ReturnType<typeof useHomePage1820SummaryFetchData>; }) =>
{
    /** 外層語系頁籤 */
    const langTabs: LibTabsProp = useMemo(
        () => ({ Style: prop.theme.Tabs, item: Object.fromEntries(prop.supportLangs.map(lang => [lang, getLangDisplayName(lang)])) }),
        [prop.theme.Tabs, prop.supportLangs],
    );

    /** 外層語系頁籤內容 */
    const components = useMemo<Record<string, ReactNode[]>>(() =>
    {
        return Object.fromEntries(
            prop.supportLangs.map(lang => [lang, [<LangFormTabComp key={lang} theme={prop.theme} lang={lang as Lang} summary={prop.summary} />]]),
        );
    }, [prop.summary, prop.supportLangs, prop.theme]);

    return <TabContentComp tabInfos={langTabs} components={components} />;
};


const LangFormTabComp = (prop: { theme: IBETheme; lang: Lang; summary: ReturnType<typeof useHomePage1820SummaryFetchData>; }) =>
{
    // 每個語系都建立獨立的 Spec Form Template，讓儲存、toast、loading 與 toolbar 集中處理。
    const internalId = prop.summary.rawData.langInternalIdMap[prop.lang] ?? "";
    const template = useHomePage1820LangFormTemplate({
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
            renderContent={({ vm }) => <LangSetTabComp theme={prop.theme} lang={prop.lang} binding={vm.binding} cateOpts={vm.refs.categoryMap} />}
        />
    );
};


const LangSetTabComp = (
    prop: {
        theme: IBETheme;
        lang: string;
        binding: ServerFormBinding<HomePageSet>;
        cateOpts: Record<string, string>;
    },
) =>
{
    // 建立區塊頁籤 key
    const buildSectionKey = (section: string) => `${prop.lang}_${section}`;

    const sectionTabs: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: {
            [buildSectionKey("Section1")]: "區塊1",
            [buildSectionKey("Section2")]: "區塊2",
            [buildSectionKey("Section3")]: "區塊3",
            [buildSectionKey("Section4")]: "區塊4",
            [buildSectionKey("Section5")]: "區塊5",
            [buildSectionKey("Section6")]: "區塊6",
        },
    };

    const sectionComponents: Record<string, ReactNode[]> = {
        [buildSectionKey("Section1")]: [<Section1Comp key="s1" theme={prop.theme} formData={prop.binding} lang={prop.lang} />],
        [buildSectionKey("Section2")]: [<Section2Comp key="s2" theme={prop.theme} formData={prop.binding} />],
        [buildSectionKey("Section3")]: [<Section3Comp key="s3" theme={prop.theme} formData={prop.binding} cateOpts={prop.cateOpts} />],
        [buildSectionKey("Section4")]: [<Section4Comp key="s4" theme={prop.theme} formData={prop.binding} lang={prop.lang} />],
        [buildSectionKey("Section5")]: [<Section5Comp key="s5" theme={prop.theme} formData={prop.binding} lang={prop.lang} />],
        [buildSectionKey("Section6")]: [<Section6Comp key="s6" theme={prop.theme} formData={prop.binding} lang={prop.lang} />],
    };

    return (
        <div className="col-12">
            <TabContentComp tabInfos={sectionTabs} components={sectionComponents} />
        </div>
    );
};


const Section1Comp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: string; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);

    return (
        <>
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.Section1Title_L, "string")}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.Section1Title_M, "string")}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.Section1Title_R, "string")}
            />
            <BannerMediaComp theme={prop.theme} formData={prop.formData} lang={prop.lang} />
        </>
    );
};


const BannerMediaComp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: string; }) =>
{
    // Banner 明細改由 EditGrid 統一新增、編輯、刪除與拖曳排序
    const { renderPicturePreview } = useHomePageEditGridRenderers(prop.theme);
    const bannerGrid = useHomePage1820BannerMediaEditGrid({ binding: prop.formData, lang: prop.lang, style: editGridStyle, renderPicturePreview });

    return (
        <div className="col-12 mt-3">
            <EditGrid {...bannerGrid.editGridProps} />
        </div>
    );
};


const Section2Comp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);

    return (
        <>
            <LibTinyMCE Style={prop.theme.TinyMCE} {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.HeroText, "string")} />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入連結"
                {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.HeroText_ViewMoreLink, "string")}
            />
        </>
    );
};


const Section3Comp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; cateOpts: Record<string, string>; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);

    return (
        <>
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.AnnouncementTitle, "string")}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.AnnouncementSubTitle, "string")}
            />

            <LibCheckBox
                Style={prop.theme.CheckBox}
                options={prop.cateOpts}
                {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.AnnouncementCategoryIds, "string", undefined, "csv")}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入連結"
                {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.Announcement_ViewMoreLink, "string")}
            />
        </>
    );
};


const Section4Comp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: string; }) =>
{
    // Section4 明細改由 EditGrid 統一新增、編輯、刪除、拖曳排序與 TinyMCE 內文編輯
    const { renderPicturePreview, renderIntroPreview, renderIntroEditor } = useHomePageEditGridRenderers(prop.theme);
    const detailGrid = useHomePage1820DetailEditGrid({
        binding: prop.formData,
        lang: prop.lang,
        style: editGridStyle,
        renderPicturePreview,
        renderIntroPreview,
        renderIntroEditor,
    });

    return (
        <div className="col-12">
            <EditGrid {...detailGrid.editGridProps} />
        </div>
    );
};


const Section5Comp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: string; }) =>
{
    // Section5 跑馬燈改由 EditGrid 統一新增、編輯、刪除與拖曳排序
    const { renderPicturePreview } = useHomePageEditGridRenderers(prop.theme);
    const marqueeGrid = useHomePage1820MarqueeEditGrid({ binding: prop.formData, lang: prop.lang, style: editGridStyle, renderPicturePreview });

    return (
        <div className="col-12">
            <EditGrid {...marqueeGrid.editGridProps} />
        </div>
    );
};


const Section6Comp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: string; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);

    return (
        <>
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.Resource_Title, "string")}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecHomePage1820SetFields.SpecHomePage1820, SpecHomePage1820ModelFields.Resource_SubTitle, "string")}
            />
            <ResourceComp theme={prop.theme} formData={prop.formData} lang={prop.lang} />
        </>
    );
};


const ResourceComp = (prop: { theme: IBETheme; formData: ServerFormBinding<HomePageSet>; lang: string; }) =>
{
    // Section6 資源連結改由 EditGrid 統一新增、編輯、刪除與拖曳排序
    const { renderPicturePreview } = useHomePageEditGridRenderers(prop.theme);
    const resourceGrid = useHomePage1820ResourceEditGrid({ binding: prop.formData, lang: prop.lang, style: editGridStyle, renderPicturePreview });

    return (
        <div className="col-12 mt-3">
            <EditGrid {...resourceGrid.editGridProps} />
        </div>
    );
};
// #endregion

// #region Private
const HomePageImagePreview = (props: { value: EditGridCellValue; }) =>
{
    // 顯示首頁圖片欄位的預覽圖，沒有圖片時避免破圖。
    const file = toHomePageFileCellValue(props.value);
    const previewUrl = file.url ?? getHomePageFilePreviewUrl(file.internalId);
    const alt = file.originalFileName || file.fileName || "首頁圖片預覽";

    if (!previewUrl) return <span className="small">尚未選擇圖片</span>;
    return <img src={previewUrl} alt={alt} style={{ maxWidth: "160px", maxHeight: "120px", objectFit: "contain" }} />;
};


const HomePageIntroPreview = (props: { value: EditGridCellValue; }) =>
{
    // 唯讀狀態顯示 TinyMCE 內文摘要，避免表格直接露出 HTML tag。
    const text = getPlainTextFromHtml(props.value);
    if (!text) return <span className="small">尚未輸入內文</span>;
    return <span>{text}</span>;
};


const HomePageTinyMceEditor = (props: { theme: IBETheme; args: EditGridCellRenderArgs; }) =>
{
    // EditGrid 編輯狀態改用 TinyMCE 回寫 Intro 欄位。
    const value = typeof props.args.value === "string" ? props.args.value : String(props.args.value ?? "");
    const handleChange = (nextValue: string) => props.args.updateValue(nextValue);

    return (
        <div style={{ minWidth: "520px" }}>
            <LibTinyMCE
                Style={{ ...props.theme.TinyMCE, ...tinyMceGridStyle }}
                ColumnDisplayName={props.args.column.title}
                InputValue={value}
                OnChange={handleChange}
            />
        </div>
    );
};


const getLangDisplayName = (lang?: string) =>
{
    // 取得語系顯示名稱
    const key = String(lang ?? "").trim().toLowerCase() as Lang;
    return LangLabelMap[key] ?? lang ?? "";
};


const useHomePageEditGridRenderers = (theme: IBETheme) =>
{
    // 建立首頁 EditGrid 共用 render，避免各區塊重複定義圖片與 TinyMCE 欄位。
    const renderPicturePreview = useCallback((args: EditGridCellRenderArgs) => <HomePageImagePreview value={args.value} />, []);
    const renderIntroPreview = useCallback((args: EditGridCellRenderArgs) => <HomePageIntroPreview value={args.value} />, []);
    const renderIntroEditor = useCallback((args: EditGridCellRenderArgs) => <HomePageTinyMceEditor theme={theme} args={args} />, [theme]);

    return { renderPicturePreview, renderIntroPreview, renderIntroEditor };
};


const getPlainTextFromHtml = (value: EditGridCellValue): string =>
{
    // 將 TinyMCE HTML 轉成表格摘要文字。
    const html = typeof value === "string" ? value : String(value ?? "");
    return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
};
// #endregion
