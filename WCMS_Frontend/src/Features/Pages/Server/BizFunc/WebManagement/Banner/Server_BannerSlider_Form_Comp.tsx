import { LibDropList, LibTextBox, LibFile, LibPicture, LibCalendar, LibTextArea } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import BannerSliderProvider from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useActions } from "@/Features/Hooks/Common/useActions";
import { useParams } from "react-router-dom";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { components } from "@/types/api";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import * as SchemaFields from "@/types/SchemaFields";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge as LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
type BannerSet = components["schemas"]["BannerSet_DTO"]
type BannerDetail = components["schemas"]["BannerDetail_DTO"]
type BannerDetailInfo = components["schemas"]["BannerDetailInfo_DTO"]
const emptyData: BannerSet = { Banner: {}, BannerDetail: [{ RowId: 1 }], BannerDetailInfo: [] }

export const BannerSliderFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const formData = useFetchFormData<BannerSet>(BannerSliderProvider(), internalId, emptyData)
    useEnsureLangDetails(formData, { headerName: SchemaFields.BannerSetFields.BannerDetail, detailName: SchemaFields.BannerSetFields.BannerDetailInfo, parentKeys: [SchemaFields.BannerDetailInfoFields.BannerId, SchemaFields.BannerDetailInfoFields.ParentRowId], preferFirstLang: prop.lang });
    const actions = useActions(BannerSliderProvider(), formData.data as BannerSet, internalId ?? "")
    const isLoading = [formData.isLoading]
    const errors = [formData.error]
    const formProp: FormCompProp = { Title: "設定輪播", Theme: prop.theme, LoadingList: isLoading, ErrorList: errors, Actions: actions }
    return (
        <>
            <FormComp prop={formProp}>
                <HeaderComp theme={prop.theme} formData={formData} />
                <DetailComp theme={prop.theme} formData={formData} />
            </FormComp>
        </>
    )
}
const HeaderComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<BannerSet> }) => {
    const setField = useSetTableField<BannerSet>(props.formData);
    return (
        <>
            <div className="form-group">
                <div className="row">
                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.Banner, SchemaFields.BannerFields.BannerCategoryName, "string")} />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.Banner, SchemaFields.BannerFields.Width, "number")} />
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.Banner, SchemaFields.BannerFields.Height, "number")} />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.Banner, SchemaFields.BannerFields.Speed, "number")} />
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.Banner, SchemaFields.BannerFields.Interval, "number")} />
                </div>
            </div>
        </>
    )
}
const DetailComp = (props: { theme: IBETheme, formData: UseFetchFormDataResult<BannerSet> }) => {
    const setField = useSetTableField<BannerSet>(props.formData);
    const useUploadPic = useUploadPicture();
    const details = (props.formData.data)?.BannerDetail ?? [];
    //添加頁籤，之後要做成FUNCTION參數傳入即可
    const handleAdd = () => {
        if (!props.formData.data) return;
        const maxRowId = details.reduce((max, d: any) => {
            return d.RowId && d.RowId > max ? d.RowId : max;
        }, 0);
        const newRowId = maxRowId + 1;
        const newItem: BannerDetail = {
            BannerId: props.formData.data.Banner?.BannerId,
            RowId: newRowId,
            PicSrcId: "",
            FontColor: "0"
        };
        const subNewItem: BannerDetailInfo[] = [
            {
                BannerId: props.formData.data.Banner?.BannerId,
                ParentRowId: newRowId,
                RowId: 1,
                Lang: 'zh-tw',
                Content: "",
            },
            {
                BannerId: props.formData.data.Banner?.BannerId,
                ParentRowId: newRowId,
                RowId: 2,
                Lang: 'en',
                Content: "",
            },
        ]
        // 更新 BannerDetailInfo
        const updated = {
            ...props.formData.data,
            BannerDetail: [...(props.formData.data.BannerDetail ?? []), newItem],
            BannerDetailInfo: [...(props.formData.data.BannerDetailInfo ?? []), ...subNewItem],
        };
        props.formData.setFormData(updated);
    };

    const removeOne = (rowKey: number | string): void => {
        const keyStr = String(rowKey);
        props.formData.setFormData(prev => {
            if (!prev) return prev;
            const allDetails = prev.BannerDetail ?? [];
            const target = allDetails.find((d, i) => String(d.RowId ?? i) === keyStr);
            if (!target) return prev;
            // 有正式 RowId：用複合鍵過濾；沒有：用索引當後備（避免新筆比不到）
            let nextDetails: typeof allDetails;
            if (target.RowId != null) {
                nextDetails = allDetails.filter(d => !(d.BannerId === target.BannerId && d.RowId === target.RowId));
            } else {
                const hitIdx = allDetails.findIndex((d, i) => String(d.RowId ?? i) === keyStr);
                nextDetails = allDetails.filter((_, i) => i !== hitIdx);
            }
            // 子明細一併清掉（只有既有 RowId 才有 ParentRowId 對應）
            const allInfos = prev.BannerDetailInfo ?? [];
            const nextInfos =
                target.RowId != null
                    ? allInfos.filter(info => !(info.BannerId === target.BannerId && info.ParentRowId === target.RowId))
                    : allInfos; // 新筆通常沒有子明細（或 ParentRowId 未定），直接保留
            return { ...prev, BannerDetail: nextDetails, BannerDetailInfo: nextInfos };
        });
    };

    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: details.reduce<Record<string, string>>((acc, d, idx) => {
            const key = String(d.RowId ?? idx);
            acc[key] = `圖片${idx + 1}`;
            return acc;
        }, {}),
        onAddTab: () => { handleAdd(); },
        // ⬅ 如果 removeOne 需要 number（RowId）
        onRemoveTab: (key) => removeOne(Number(key)),
        // ✅ 這裡要回傳 boolean，寫成表達式最安全
        // isRemovable: (key) => key !== String(details[0]?.RowId ?? "1"),
    };

    const tabContent: Record<string, React.ReactNode[]> = details.reduce<Record<string, React.ReactNode[]>>(
        (acc, d, idx) => {
            const detailRowId = d.RowId ?? idx;
            const picSrc = d.PicSrcId ? `${FileManagementAPI.PREVIEW_URL}/${d.PicSrcId}` : "https://dummyimage.com/1920x550/555/fff.png";
            const rowKeys = { [SchemaFields.BannerDetailFields.BannerId]: d.BannerId, [SchemaFields.BannerDetailFields.RowId]: d.RowId }
            acc[String(detailRowId)] = [
                <LibFile
                    Style={props.theme.File}
                    ColumnDisplayName="選擇圖片"
                    Multiple={false}
                    parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
                    InputValue=""
                    onChange={(files) =>
                        useUploadPic.handleFileChange(files, (internalId) => {
                            props.formData.setFormData((prev) => ({
                                ...prev!, BannerDetail: (prev?.BannerDetail ?? []).map((d) => d.RowId === detailRowId ? { ...d, PicSrcId: internalId } : d),
                            }));
                        })
                    }
                >
                    <LibPicture PicSrc={picSrc} />
                </LibFile>,
                <LibCalendar {...setField(SchemaFields.BannerSetFields.BannerDetail, SchemaFields.BannerDetailFields.Validate_Start, "datetime", rowKeys)} />,
                <LibCalendar {...setField(SchemaFields.BannerSetFields.BannerDetail, SchemaFields.BannerDetailFields.Validate_End, "datetime", rowKeys)} />,
                <LibDropList Style={props.theme.DropList} Options={fontColorOptions} {...setField(SchemaFields.BannerSetFields.BannerDetail, SchemaFields.BannerDetailFields.FontColor, "string", rowKeys)} />,
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetail, SchemaFields.BannerDetailFields.Sort, "number", rowKeys)} />,
                <SubDetailComp theme={props.theme} formData={props.formData} parentRowId={detailRowId} />,
            ];
            return acc;
        }, {}
    );
    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>)
};
const SubDetailComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<BannerSet>; parentRowId: number }) => {
    const setField = useSetTableField<BannerSet>(props.formData);
    const windowTarget = useFetchEnumOptions("WindowTarget")
    const rawDetails = props.formData.data?.BannerDetailInfo?.filter(p => p.ParentRowId === props.parentRowId) ?? [];

    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.BannerId, info.ParentRowId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    };
    // // 每個語系的欄位內容
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.BannerId, info.ParentRowId, info.RowId, info.Lang)
            const rowKeys =
            {
                [SchemaFields.BannerDetailInfoFields.BannerId]: info.BannerId,
                [SchemaFields.BannerDetailInfoFields.ParentRowId]: info.ParentRowId,
                [SchemaFields.BannerDetailInfoFields.RowId]: info.RowId,
            }
            compMap[langKey] = [
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.Title, "string", rowKeys)} />,
                <LibTextArea Style={props.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.Content, "string", rowKeys)} />,
                <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.URL, "string", rowKeys)} />,
                <LibDropList Style={props.theme.DropList} Options={windowTarget.data} {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.URL_Open, "number", rowKeys)} />,
            ]
            return compMap;
        }, {}
    );
    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    )
}
/** 標題顏色，後續看是否可調成進階選取RGBA */
const fontColorOptions: Record<string, string> = { ["0"]: "系統預設", ["1"]: "白色", ["2"]: "綠色", }
