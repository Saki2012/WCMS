import { LibDropList, LibTextBox, LibFile, LibPicture, LibCalendar, LibTextArea } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import BannerSliderProvider from "./BannerSlider_Api";
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import type { components } from "../../../../../../types/api";
type BannerSet = components["schemas"]["BannerSet_DTO"]
import { useEffect, useState } from "react";
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";
import { useFetchFormData, type UseFetchFormDataResult } from "../../../../../../SysCore/Utils/API/FetchFormData";

const emptyData: BannerSet = {
    Banner: {},
    BannerDetail: [],
    BannerDetailInfo: []
}

export const BannerSliderFormComp = ({ theme }: { theme: IBETheme }) => {
    const { internalId } = useParams();
    const formData = useFetchFormData<BannerSet>(BannerSliderProvider(), internalId, emptyData)
    const useToolbar = useFormToolbarActions(BannerSliderProvider(), formData.data as BannerSet, internalId as string, () => formData.refetch())
    const isLoading = [formData.isLoading]
    const errors = [formData.error]


    useEffect(() => { if (formData.data) { formData.setFormData(formData.data); } }, [formData.data]);

    const prop: FormCompProp = { Title: "設定輪播", Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.action }
    const headerComp = GetHeaderComp(theme, formData)
    const detailComp = GetBannerDetailComp(theme, formData)

    return (
        <>
            <FormComp prop={prop}>
                {Object.entries(headerComp).map(([lang, nodes]) => (
                    <div key={lang} className="form-group">
                        <div className="row">
                            {nodes}
                        </div>
                    </div>
                ))}
                <TabContentComp libTabsProp={detailComp.LibTabsPropA} components={detailComp.componentsA}></TabContentComp>
            </FormComp>
        </>
    )
}

const GetHeaderComp = (theme: IBETheme, formData: UseFetchFormDataResult<BannerSet>) => {
    const data = [
        <LibTextBox key={`${1}-Title`} Style={theme.TextBox} ColumnDisplayName={`橫幅名稱`} DefaultInputDisplay="請輸入" InputValue={formData?.data?.Banner?.BannerCategoryName ?? ""} OnChange={(val) => (val)} />,
        <LibTextBox key={`${2}-Title`} Style={theme.TextBox} ColumnDisplayName={`轉換速度`} DefaultInputDisplay="請輸入" InputValue={formData?.data?.Banner?.Speed ?? 0} OnChange={(val) => (val)} />,
        <LibTextBox key={`${3}-Title`} Style={theme.TextBox} ColumnDisplayName={`橫幅寬度 ( W ) ( 像素 px )`} DefaultInputDisplay="請輸入" InputValue={formData?.data?.Banner?.Width ?? 0} OnChange={(val) => (val)} />,
        <LibTextBox key={`${4}-Title`} Style={theme.TextBox} ColumnDisplayName={`轉換間隔`} DefaultInputDisplay="請輸入" InputValue={formData?.data?.Banner?.Interval ?? 0} OnChange={(val) => (val)} />,
        <LibTextBox key={`${6}-Title`} Style={theme.TextBox} ColumnDisplayName={`橫幅高度 ( H ) ( 像素 px )`} DefaultInputDisplay="請輸入" InputValue={formData?.data?.Banner?.Height ?? 0} OnChange={(val) => (val)} />,
        <LibDropList key={`${5}-Title`} Style={theme.DropList} ColumnDisplayName={`橫幅效果`} InputValue={formData?.data?.Banner?.Effect ?? ""} onChange={(val) => (val)} />
    ]
    const toComponents = (arr?: React.ReactNode[] | null): Record<string, React.ReactNode[]> => {
        if (!arr) return {}; // 防止 null / undefined
        return arr.reduce((acc, value, index) => {
            acc[index.toString()] = [value]; // key 用 index
            return acc;
        },
            {} as Record<string, React.ReactNode[]>);
    };
    return toComponents(data);
}

const GetBannerDetailComp = (theme: IBETheme, formData: UseFetchFormDataResult<BannerSet>) => {
    const [previewUrlByDetail, setPreviewUrlByDetail] = useState<Record<number, string>>({});
    const [selectedFileNameByDetail, setSelectedFileNameByDetail] = useState<Record<number, string>>({});

    const handleFileChange = (detailRowId: number) => (files: File[]) => {
        if (files && files.length > 0) {
            const file = files[0];
            setSelectedFileNameByDetail(prev => ({ ...prev, [detailRowId]: file.name }));
            setPreviewUrlByDetail(prev => ({ ...prev, [detailRowId]: URL.createObjectURL(file) }));
        } else {
            setSelectedFileNameByDetail(prev => ({ ...prev, [detailRowId]: "" }));
            setPreviewUrlByDetail(prev => ({ ...prev, [detailRowId]: "" }));
        }
    };

    const details = formData?.data?.BannerDetail ?? [];
    const infos = formData?.data?.BannerDetailInfo ?? [];

    // ---- 外層 Tab: 依每筆 BannerDetail 動態建立 ----
    const libTabsPropA: LibTabsProp = {
        Style: theme.Tabs,
        item: details.reduce<Record<string, string>>((acc, d, idx) => {
            // 用 RowId 當 key（轉字串），標籤先用「圖片{排序}」；若你有顯示名稱欄位可改成 d.DisplayName
            const key = String(d.RowId ?? idx);
            acc[key] = `圖片${idx + 1}`;
            return acc;
        }, {})
    };

    // ---- 內層(語系) Tab 與內容：針對每一個 Detail 個別建立 ----
    const componentsA: Record<string, React.ReactNode[]> = details.reduce<Record<string, React.ReactNode[]>>(
        (acc, d, idx) => {
            const detailRowId = d.RowId ?? idx;

            // 挑出與此 Detail 關聯的語系資訊
            const relatedInfos = infos.filter(x => x.ParentRowId === detailRowId);

            // 動態語系標籤（Lang → 顯示名稱）
            const langLabelMap: Record<string, string> = {
                "zh-tw": "繁體中文",
                "en": "English",
                "zh-cn": "简体中文",
                "ja": "日本語"
                // 之後有其它語系再補
            };

            const innerTabsProp: LibTabsProp = {
                Style: theme.Tabs,
                item: relatedInfos.reduce<Record<string, string>>((tabItems, info) => {
                    const langKey = info.Lang?.toLowerCase?.() ?? "unknown";
                    tabItems[langKey] = langLabelMap[langKey] ?? info.Lang ?? "Unknown";
                    return tabItems;
                }, {})
            };

            // 每個語系的欄位內容
            const innerComponents: Record<string, React.ReactNode[]> = relatedInfos.reduce<Record<string, React.ReactNode[]>>(
                (compMap, info) => {
                    const langKey = info.Lang?.toLowerCase?.() ?? "unknown";
                    compMap[langKey] = generateLangFields(
                        langKey,
                        innerTabsProp.item[langKey] ?? info.Lang ?? "Unknown",
                        theme,
                        formData,
                        detailRowId,
                        info // 帶進去讓欄位可取預設值
                    );
                    return compMap;
                },
                {}
            );

            // 此筆 detail 的主要內容（圖片上傳 + 其他欄位 + 語系子 Tab）
            const fileName = selectedFileNameByDetail[detailRowId] ?? "";
            const picSrc = previewUrlByDetail[detailRowId] || "https://dummyimage.com/1920x550/555/fff.png";

            acc[String(detailRowId)] = [
                <LibFile
                    key={`file-${detailRowId}`}
                    Style={theme.File}
                    ColumnDisplayName="選擇圖片"
                    Multiple={false}
                    parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
                    onChange={handleFileChange(detailRowId)}
                >
                    <LibPicture
                        key={`preview-${detailRowId}`}
                        ColumnDisplayName={fileName}
                        PicSrc={picSrc}
                        PicDescription={`選中的圖片 ${fileName}`}
                    />
                </LibFile>,

                <div key={`hint-${detailRowId}`} role="note" aria-label="建議圖片尺寸" className="col-12">
                    最佳尺寸：1920px X 550px
                </div>,

                <LibCalendar
                    key={`vs-${detailRowId}`}
                    colDisplayName="新增日期"
                    InputValue={d.Validate_Start ?? ""}
                    onChange={(val) => {
                        formData.setFormData(prev => {
                            const next = { ...(prev ?? {}) } as BannerSet;
                            next.BannerDetail = (next.BannerDetail ?? []).map(x =>
                                (x.RowId ?? -1) === detailRowId ? { ...x, Validate_Start: val } : x
                            );
                            return next;
                        });
                    }}
                />,

                <LibCalendar
                    key={`pub-${detailRowId}`}
                    colDisplayName="公告日期"
                    InputValue={d.Validate_Start ?? ""}
                    onChange={(val) => {
                        formData.setFormData(prev => {
                            const next = { ...(prev ?? {}) } as BannerSet;
                            next.BannerDetail = (next.BannerDetail ?? []).map(x =>
                                (x.RowId ?? -1) === detailRowId ? { ...x, PubDate: val } : x
                            );
                            return next;
                        });
                    }}
                />,

                <LibCalendar
                    key={`vd-${detailRowId}`}
                    colDisplayName="下架日期"
                    InputValue={d.Validate_End ?? ""}
                    onChange={(val) => {
                        formData.setFormData(prev => {
                            const next = { ...(prev ?? {}) } as BannerSet;
                            next.BannerDetail = (next.BannerDetail ?? []).map(x =>
                                (x.RowId ?? -1) === detailRowId ? { ...x, Validate_End: val } : x
                            );
                            return next;
                        });
                    }}
                />,

                <LibDropList
                    key={`fc-${detailRowId}`}
                    Style={theme.DropList}
                    ColumnDisplayName="字體顏色"
                    InputValue={d.FontColor ?? ""}
                    onChange={(val) => {
                        formData.setFormData(prev => {
                            const next = { ...(prev ?? {}) } as BannerSet;
                            next.BannerDetail = (next.BannerDetail ?? []).map(x =>
                                (x.RowId ?? -1) === detailRowId ? { ...x, FontColor: val as string } : x
                            );
                            return next;
                        });
                    }}
                />,

                <LibTextBox
                    key={`sort-${detailRowId}`}
                    Style={theme.TextBox}
                    ColumnDisplayName="排序編號"
                    DefaultInputDisplay="請輸入"
                    InputValue={d.Sort ?? 0}
                    OnChange={(val) => {
                        formData.setFormData(prev => {
                            const next = { ...(prev ?? {}) } as BannerSet;
                            next.BannerDetail = (next.BannerDetail ?? []).map(x =>
                                (x.RowId ?? -1) === detailRowId ? { ...x, SortNo: Number(val) || 0 } : x
                            );
                            return next;
                        });
                    }}
                />,

                <TabContentComp
                    key={`inner-tab-${detailRowId}`}
                    libTabsProp={innerTabsProp}
                    components={innerComponents}
                />
            ];

            return acc;
        },
        {}
    );

    return { LibTabsPropA: libTabsPropA, componentsA };
};

type BannerDetailInfoItem = NonNullable<BannerSet["BannerDetailInfo"]>[number];

// 讓語系欄位可以吃到該語系對應的 info 與 detailRowId（便於 onChange 更新）
const generateLangFields = (lang: string, label: string, theme: IBETheme, formData: UseFetchFormDataResult<BannerSet>, detailRowId?: number, info?: BannerDetailInfoItem): React.ReactNode[] => {
    const title = info?.Title ?? "";
    const content = info?.Content ?? "";
    const url = info?.URL ?? "";
    const openTarget = info?.URL_Open ?? ""; // 例：_self/_blank

    // 這裡的 onChange 都示範性地把值回寫到 BannerDetailInfo（ParentRowId + Lang）
    const updateInfo = (patch: Partial<typeof info>) => {
        if (detailRowId == null || !info?.Lang) return;
        formData.setFormData(prev => {
            const next = { ...(prev ?? {}) } as BannerSet;
            next.BannerDetailInfo = (next.BannerDetailInfo ?? []).map(x => {
                const isSame =
                    (x.ParentRowId ?? -1) === detailRowId &&
                    (x.Lang ?? "").toLowerCase() === info.Lang!.toLowerCase();
                return isSame ? { ...x, ...patch } : x;
            });
            return next;
        });
    };

    const fields: React.ReactNode[] = [
        <LibTextBox
            key={`${lang}-Title`}
            Style={theme.TextBox}
            ColumnDisplayName={`標題（${label}）`}
            DefaultInputDisplay="請輸入"
            InputValue={title}
            OnChange={(val) => updateInfo({ Title: String(val) })}
        />,
        <LibTextArea
            key={`${lang}-Content`}
            Style={theme.TextArea}
            ColumnDisplayName={`內容（${label}）`}
            DefaultInputDisplay="請輸入"
            InputValue={content}
            OnChange={(val) => updateInfo({ Content: String(val) })}
        />,
        <LibTextBox
            key={`${lang}-Url`}
            Style={theme.TextBox}
            ColumnDisplayName={`網址（${label}）`}
            DefaultInputDisplay="請輸入"
            InputValue={url}
            OnChange={(val) => updateInfo({ Url: String(val) })}
        />,
        <LibDropList
            key={`${lang}-OpenTarget`}
            Style={theme.DropList}
            ColumnDisplayName="開啟方式"
            InputValue={openTarget}
            onChange={(val) => updateInfo({ OpenTarget: String(val) })}
        />
    ];
    return fields;
};