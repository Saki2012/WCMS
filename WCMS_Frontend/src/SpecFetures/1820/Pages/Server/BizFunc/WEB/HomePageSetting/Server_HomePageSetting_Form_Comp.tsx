import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import LibCheckBox from "@/SysCore/Components/FormField/FieldComponets/LibCheckBox_Comp";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibFileInput, LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField, useSetTableFileField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { type Lang, LangLabelMap, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import {
    SpecHomePage1820_BannerMediaFields,
    SpecHomePage1820_DetailFields,
    SpecHomePage1820_MarqueeFields,
    SpecHomePage1820_ResourceFields,
    SpecHomePage1820ModelFields,
    SpecHomePage1820SetFields,
} from "@/types/SchemaFields";
import { type ReactNode, useMemo } from "react";
import {
    createEmptyHomePage1820Set,
    useHomePage1820FormDataByAdapter,
    useHomePage1820SummaryFetchData,
} from "./Server_HomePageSetting_Form_Hook";

type HomePageSet = components["schemas"]["SpecHomePage1820Set_DTO"];

const getLangDisplayName = (lang?: string) =>
{
    // 取得語系顯示名稱
    const key = String(lang ?? "").trim().toLowerCase() as Lang;
    return LangLabelMap[key] ?? lang ?? "";
};

const getNextRowId = (rows?: Array<{ RowId?: number | null; }> | null) =>
{
    return (rows ?? []).reduce((max, row) => Math.max(max, Number(row?.RowId ?? 0)), 0) + 1;
};
const buildRowKeys = (row: { HomePageId?: string | null; RowId?: number | null; }) =>
{
    // 建立子表複合鍵
    return { HomePageId: row.HomePageId ?? "", RowId: row.RowId ?? 0 };
};

export const Server_HomePage1820_Form_Comp = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    // 先用固定語系，之後再改成站台設定來源

    const summary = useHomePage1820SummaryFetchData({ supportLangs: SUPPORTED_LANGS });

    const formProp: FormCompProp = {
        Title: "1820首頁設定",
        Theme: prop.theme,
        IsLoading: summary.isLoading,
        ErrorList: summary.errors,
    };

    return (
        <FormComp prop={formProp}>
            <MainFormComp theme={prop.theme} supportLangs={summary.rawData.supportLangs} summary={summary} />
        </FormComp>
    );
};

const MainFormComp = (prop: {
    theme: IBETheme;
    supportLangs: Lang[];
    summary: ReturnType<typeof useHomePage1820SummaryFetchData>;
}) =>
{
    /** 外層語系頁籤 */
    const langTabs: LibTabsProp = useMemo(() => ({
        Style: prop.theme.Tabs,
        item: Object.fromEntries(prop.supportLangs.map(lang => [lang, getLangDisplayName(lang)])),
    }), [prop.theme.Tabs, prop.supportLangs]);

    /** 外層語系頁籤內容 */
    const components = useMemo<Record<string, ReactNode[]>>(() =>
    {
        return Object.fromEntries(
            prop.supportLangs.map(lang => [
                lang,
                [<LangFormTabComp key={lang} theme={prop.theme} lang={lang as Lang} summary={prop.summary} />],
            ]),
        );
    }, [prop.summary, prop.supportLangs, prop.theme]);

    return <TabContentComp tabInfos={langTabs} components={components} />;
};

const LangFormTabComp = (prop: {
    theme: IBETheme;
    lang: Lang;
    summary: ReturnType<typeof useHomePage1820SummaryFetchData>;
}) =>
{
    const internalId = prop.summary.rawData.langInternalIdMap[prop.lang] ?? "";
    const getData = useHomePage1820FormDataByAdapter(prop.summary.adapter.HomePage, prop.lang, internalId);
    const isSaving = Boolean(prop.summary.rawData.savingMap[prop.lang]);

    const handleSave = async () =>
    {
        await prop.summary.rawData.saveLang(prop.lang, getData.rawData.formData.data);
    };

    return (
        <LangSetTabComp
            theme={prop.theme}
            lang={prop.lang}
            formData={getData.rawData.formData}
            cateOpts={getData.rawData.categoryMap}
            isSaving={isSaving}
            onSave={handleSave}
        />
    );
};

const LangSetTabComp = (prop: {
    theme: IBETheme;
    lang: string;
    formData: UseFetchFormDataResult<HomePageSet>;
    cateOpts: Record<string, string>;
    isSaving: boolean;
    onSave: () => Promise<void>;
}) =>
{
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
        [buildSectionKey("Section1")]: [
            <Section1Comp key="s1" theme={prop.theme} formData={prop.formData} lang={prop.lang} />,
        ],
        [buildSectionKey("Section2")]: [<Section2Comp key="s2" theme={prop.theme} formData={prop.formData} />],
        [buildSectionKey("Section3")]: [
            <Section3Comp key="s3" theme={prop.theme} formData={prop.formData} cateOpts={prop.cateOpts} />,
        ],
        [buildSectionKey("Section4")]: [
            <Section4Comp key="s4" theme={prop.theme} formData={prop.formData} lang={prop.lang} />,
        ],
        [buildSectionKey("Section5")]: [
            <Section5Comp key="s5" theme={prop.theme} formData={prop.formData} lang={prop.lang} />,
        ],
        [buildSectionKey("Section6")]: [
            <Section6Comp key="s6" theme={prop.theme} formData={prop.formData} lang={prop.lang} />,
        ],
    };

    return (
        <>
            <div className="col-12">
                <TabContentComp tabInfos={sectionTabs} components={sectionComponents} />
            </div>

            <div className="col-12 mt-3">
                <button
                    type="button"
                    className="btn btn-custom btn-rounded btn-sm"
                    title="儲存當前語系設定"
                    onClick={() => void prop.onSave()}
                    disabled={prop.isSaving || prop.formData.isLoading}
                >
                    {prop.isSaving ? "儲存中..." : "儲存當前語系設定"}
                </button>
            </div>
        </>
    );
};

// #region Section1 BannerMedia
const Section1Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<HomePageSet>; lang: string; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);

    return (
        <>
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.Section1Title_L,
                    "string",
                )}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.Section1Title_M,
                    "string",
                )}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.Section1Title_R,
                    "string",
                )}
            />
            <BannerMediaComp theme={prop.theme} formData={prop.formData} lang={prop.lang} />
        </>
    );
};

const BannerMediaComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<HomePageSet>; lang: string; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);
    const setFileField = useSetTableFileField(prop.formData);
    const rows = prop.formData.data?.SpecHomePage1820_BannerMedia ?? [];

    const addRow = () =>
    {
        // 新增 Banner 明細
        prop.formData.setFormData(prev => ({
            ...(prev ?? createEmptyHomePage1820Set(prop.lang)),
            SpecHomePage1820_BannerMedia: [
                ...(prev?.SpecHomePage1820_BannerMedia ?? []),
                {
                    HomePageId: prev?.SpecHomePage1820?.HomePageId ?? "",
                    RowId: getNextRowId(prev?.SpecHomePage1820_BannerMedia),
                    BannerFileId: "",
                    BannerFileDescription: "",
                },
            ],
        }));
    };

    const removeRow = (rowId: number) =>
    {
        // 移除 Banner 明細
        prop.formData.setFormData(prev => ({
            ...(prev ?? createEmptyHomePage1820Set(prop.lang)),
            SpecHomePage1820_BannerMedia: (prev?.SpecHomePage1820_BannerMedia ?? []).filter(a =>
                Number(a.RowId) !== rowId
            ),
        }));
    };

    return (
        <div className="col-12">
            <button type="button" className="btn btn-outline-primary mb-3" onClick={addRow}>新增 Banner</button>

            {rows.map(row =>
            {
                const rowKeys = buildRowKeys(row);
                return (
                    <div key={`banner-${row.RowId}`} className="border rounded p-3 mb-3">
                        <LibFileInput
                            {...setFileField(
                                SpecHomePage1820SetFields.SpecHomePage1820_BannerMedia,
                                SpecHomePage1820_BannerMediaFields.BannerFileId,
                                undefined,
                                rowKeys,
                            )}
                            Accept="image/*"
                            onDelete={() => removeRow(Number(row.RowId ?? 0))}
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入圖片說明"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_BannerMedia,
                                SpecHomePage1820_BannerMediaFields.BannerFileDescription,
                                "string",
                                rowKeys,
                            )}
                        />
                    </div>
                );
            })}
        </div>
    );
};
// #endregion

// #region Section2
const Section2Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<HomePageSet>; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);

    return (
        <>
            <LibTinyMCE
                Style={prop.theme.TinyMCE}
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.HeroText,
                    "string",
                )}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入連結"
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.HeroText_ViewMoreLink,
                    "string",
                )}
            />
        </>
    );
};
// #endregion

// #region Section3
const Section3Comp = (prop: {
    theme: IBETheme;
    formData: UseFetchFormDataResult<HomePageSet>;
    cateOpts: Record<string, string>;
}) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);

    return (
        <>
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.AnnouncementTitle,
                    "string",
                )}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.AnnouncementSubTitle,
                    "string",
                )}
            />

            <LibCheckBox
                Style={prop.theme.CheckBox}
                options={prop.cateOpts}
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.AnnouncementCategoryIds,
                    "string",
                    undefined,
                    "csv",
                )}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入連結"
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.Announcement_ViewMoreLink,
                    "string",
                )}
            />
        </>
    );
};
// #endregion

// #region Section4 Detail
const Section4Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<HomePageSet>; lang: string; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);
    const setFileField = useSetTableFileField(prop.formData);
    const rows = prop.formData.data?.SpecHomePage1820_Detail ?? [];

    const addRow = () =>
    {
        // 新增 Detail 明細
        prop.formData.setFormData(prev => ({
            ...(prev ?? createEmptyHomePage1820Set(prop.lang)),
            SpecHomePage1820_Detail: [
                ...(prev?.SpecHomePage1820_Detail ?? []),
                {
                    HomePageId: prev?.SpecHomePage1820?.HomePageId ?? "",
                    RowId: getNextRowId(prev?.SpecHomePage1820_Detail),
                },
            ],
        }));
    };

    const removeRow = (rowId: number) =>
    {
        // 移除 Detail 明細
        prop.formData.setFormData(prev => ({
            ...(prev ?? createEmptyHomePage1820Set(prop.lang)),
            SpecHomePage1820_Detail: (prev?.SpecHomePage1820_Detail ?? []).filter(a => Number(a.RowId) !== rowId),
        }));
    };

    return (
        <div className="col-12">
            <button type="button" className="btn btn-outline-primary mb-3" onClick={addRow}>新增內容</button>

            {rows.map(row =>
            {
                const rowKeys = buildRowKeys(row);
                return (
                    <div key={`detail-${row.RowId}`} className="border rounded p-3 mb-3">
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.Title,
                                "string",
                                rowKeys,
                            )}
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.SubTitle,
                                "string",
                                rowKeys,
                            )}
                        />

                        <LibFileInput
                            {...setFileField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.MainPictureId,
                                undefined,
                                rowKeys,
                            )}
                            Accept="image/*"
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入主圖說明"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.MainPictureDescription,
                                "string",
                                rowKeys,
                            )}
                        />

                        <LibFileInput
                            {...setFileField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.SubPictureId,
                                undefined,
                                rowKeys,
                            )}
                            Accept="image/*"
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入副圖說明"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.SubPictureDescription,
                                "string",
                                rowKeys,
                            )}
                        />

                        <LibTinyMCE
                            Style={prop.theme.TinyMCE}
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.Intro,
                                "string",
                                rowKeys,
                            )}
                        />

                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入主連結標題"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.MainLinkTitle,
                                "string",
                                rowKeys,
                            )}
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入主連結"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.MainLink,
                                "string",
                                rowKeys,
                            )}
                        />

                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入次連結標題1"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.SubLinkTitle1,
                                "string",
                                rowKeys,
                            )}
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入次連結1"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.SubLink1,
                                "string",
                                rowKeys,
                            )}
                        />

                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入次連結標題2"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.SubLinkTitle2,
                                "string",
                                rowKeys,
                            )}
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入次連結2"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.SubLink2,
                                "string",
                                rowKeys,
                            )}
                        />

                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入次連結標題3"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.SubLinkTitle3,
                                "string",
                                rowKeys,
                            )}
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入次連結3"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Detail,
                                SpecHomePage1820_DetailFields.SubLink3,
                                "string",
                                rowKeys,
                            )}
                        />

                        <button
                            type="button"
                            className="btn btn-outline-danger mt-2"
                            onClick={() => removeRow(Number(row.RowId ?? 0))}
                        >
                            刪除此筆
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
// #endregion

// #region Section5 Marquee
const Section5Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<HomePageSet>; lang: string; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);
    const setFileField = useSetTableFileField(prop.formData);
    const rows = prop.formData.data?.SpecHomePage1820_Marquee ?? [];

    const addRow = () =>
    {
        // 新增 Marquee 明細
        prop.formData.setFormData(prev => ({
            ...(prev ?? createEmptyHomePage1820Set(prop.lang)),
            SpecHomePage1820_Marquee: [
                ...(prev?.SpecHomePage1820_Marquee ?? []),
                {
                    HomePageId: prev?.SpecHomePage1820?.HomePageId ?? "",
                    RowId: getNextRowId(prev?.SpecHomePage1820_Marquee),
                    PictureId: "",
                    PictureTitle: "",
                    IsHide: false,
                },
            ],
        }));
    };

    const removeRow = (rowId: number) =>
    {
        // 移除 Marquee 明細
        prop.formData.setFormData(prev => ({
            ...(prev ?? createEmptyHomePage1820Set(prop.lang)),
            SpecHomePage1820_Marquee: (prev?.SpecHomePage1820_Marquee ?? []).filter(a => Number(a.RowId) !== rowId),
        }));
    };

    return (
        <div className="col-12">
            <button type="button" className="btn btn-outline-primary mb-3" onClick={addRow}>新增跑馬燈</button>

            {rows.map(row =>
            {
                const rowKeys = buildRowKeys(row);
                return (
                    <div key={`marquee-${row.RowId}`} className="border rounded p-3 mb-3">
                        <LibFileInput
                            {...setFileField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Marquee,
                                SpecHomePage1820_MarqueeFields.PictureId,
                                undefined,
                                rowKeys,
                            )}
                            Accept="image/*"
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入標題"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Marquee,
                                SpecHomePage1820_MarqueeFields.PictureTitle,
                                "string",
                                rowKeys,
                            )}
                        />
                        <LibCheckBox
                            Style={prop.theme.CheckBox}
                            options={{ IsHide: "隱藏" }}
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Marquee,
                                SpecHomePage1820_MarqueeFields.IsHide,
                                "boolean",
                                rowKeys,
                            )}
                        />

                        <button
                            type="button"
                            className="btn btn-outline-danger mt-2"
                            onClick={() => removeRow(Number(row.RowId ?? 0))}
                        >
                            刪除此筆
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
// #endregion

// #region Section6 Resource
const Section6Comp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<HomePageSet>; lang: string; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);

    return (
        <>
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.Resource_Title,
                    "string",
                )}
            />
            <LibTextBox
                Style={prop.theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(
                    SpecHomePage1820SetFields.SpecHomePage1820,
                    SpecHomePage1820ModelFields.Resource_SubTitle,
                    "string",
                )}
            />
            <ResourceComp theme={prop.theme} formData={prop.formData} lang={prop.lang} />
        </>
    );
};

const ResourceComp = (prop: { theme: IBETheme; formData: UseFetchFormDataResult<HomePageSet>; lang: string; }) =>
{
    const setField = useSetTableField<HomePageSet>(prop.formData);
    const setFileField = useSetTableFileField(prop.formData);
    const rows = prop.formData.data?.SpecHomePage1820_Resource ?? [];

    const addRow = () =>
    {
        // 新增 Resource 明細
        prop.formData.setFormData(prev => ({
            ...(prev ?? createEmptyHomePage1820Set(prop.lang)),
            SpecHomePage1820_Resource: [
                ...(prev?.SpecHomePage1820_Resource ?? []),
                {
                    HomePageId: prev?.SpecHomePage1820?.HomePageId ?? "",
                    RowId: getNextRowId(prev?.SpecHomePage1820_Resource),
                    PicTitle: "",
                    PicSubTitle: "",
                    PicFileId: "",
                    Link: "",
                },
            ],
        }));
    };

    const removeRow = (rowId: number) =>
    {
        // 移除 Resource 明細
        prop.formData.setFormData(prev => ({
            ...(prev ?? createEmptyHomePage1820Set(prop.lang)),
            SpecHomePage1820_Resource: (prev?.SpecHomePage1820_Resource ?? []).filter(a => Number(a.RowId) !== rowId),
        }));
    };

    return (
        <div className="col-12">
            <button type="button" className="btn btn-outline-primary mb-3" onClick={addRow}>新增資源卡片</button>

            {rows.map(row =>
            {
                const rowKeys = buildRowKeys(row);
                return (
                    <div key={`resource-${row.RowId}`} className="border rounded p-3 mb-3">
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入標題"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Resource,
                                SpecHomePage1820_ResourceFields.PicTitle,
                                "string",
                                rowKeys,
                            )}
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入副標題"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Resource,
                                SpecHomePage1820_ResourceFields.PicSubTitle,
                                "string",
                                rowKeys,
                            )}
                        />
                        <LibFileInput
                            {...setFileField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Resource,
                                SpecHomePage1820_ResourceFields.PicFileId,
                                undefined,
                                rowKeys,
                            )}
                            Accept="image/*"
                        />
                        <LibTextBox
                            Style={prop.theme.TextBox}
                            DefaultInputDisplay="請輸入連結"
                            {...setField(
                                SpecHomePage1820SetFields.SpecHomePage1820_Resource,
                                SpecHomePage1820_ResourceFields.Link,
                                "string",
                                rowKeys,
                            )}
                        />

                        <button
                            type="button"
                            className="btn btn-outline-danger mt-2"
                            onClick={() => removeRow(Number(row.RowId ?? 0))}
                        >
                            刪除此筆
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
// #endregion
