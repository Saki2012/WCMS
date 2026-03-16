import React, { useCallback,  useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LibDropList, LibTextBox, LibFile, LibPicture, LibCalendar, LibTextArea } from "@/SysCore/Components/FormField/LibFormField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { components } from "@/types/api";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import * as SchemaFields from "@/types/SchemaFields";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { useBannerSliderFormFetchData } from "./Server_BannerSlider_Form_Hook";
type BannerSet = components["schemas"]["BannerSet_DTO"];
type BannerDetail = components["schemas"]["BannerDetail_DTO"];
type BannerDetailInfo = components["schemas"]["BannerDetailInfo_DTO"];
const emptyData: BannerSet = { Banner: {}, BannerDetail: [{ RowId: 1 }], BannerDetailInfo: [] };
export const BannerSliderFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const onBackToList = useCallback(() => {navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));}, [navigate, pathname]);
    const actionsOpt = useMemo(() => {return { onBackToList };}, [onBackToList]);
    const getData = useBannerSliderFormFetchData({lang: prop.lang,internalId: internalId ?? "",emptyData, actionsOpt});
    // 執行 function：補齊多語系子明細
    useEnsureLangDetails(getData.rawData.formData, {
        headerName: SchemaFields.BannerSetFields.BannerDetail,
        detailName: SchemaFields.BannerSetFields.BannerDetailInfo,
        parentKeys: [SchemaFields.BannerDetailInfoFields.BannerId, SchemaFields.BannerDetailInfoFields.ParentRowId],
        preferFirstLang: prop.lang,
    });
    const formProp: FormCompProp = { Title: "設定輪播", Theme: prop.theme, IsLoading: getData.isLoading, ErrorList: getData.errors, Actions: getData.rawData.actions };
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={getData.rawData.formData} />
            <DetailComp theme={prop.theme} formData={getData.rawData.formData} />
        </FormComp>
    );
};
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
    );
};
const DetailComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<BannerSet> }) => {
    const setField = useSetTableField<BannerSet>(props.formData);
    const useUploadPic = useUploadPicture();
    const details = props.formData.data?.BannerDetail ?? [];

    // 添加頁籤（維持原邏輯）
    const handleAdd = () => {
        // 宣告變數
        const cur = props.formData.data;
        if (!cur) return;

        const maxRowId = details.reduce<number>((max, d) => {
            const id = d.RowId ?? 0;
            return id > max ? id : max;
        }, 0);

        const newRowId = maxRowId + 1;

        const newItem: BannerDetail = {
            BannerId: cur.Banner?.BannerId,
            RowId: newRowId,
            PicSrcId: "",
            FontColor: "0",
        };

        const subNewItem: BannerDetailInfo[] = [
            {
                BannerId: cur.Banner?.BannerId,
                ParentRowId: newRowId,
                RowId: 1,
                Lang: "zh-tw",
                Content: "",
                SpecLatestShows: "",
                SpecShowDate: "",
                SpecShowLocation: "",
            },
            {
                BannerId: cur.Banner?.BannerId,
                ParentRowId: newRowId,
                RowId: 2,
                Lang: "en",
                Content: "",
                SpecLatestShows: "",
                SpecShowDate: "",
                SpecShowLocation: "",
            },
        ];

        // 執行 function：更新 header + detail
        const updated: BannerSet = {
            ...cur,
            BannerDetail: [...(cur.BannerDetail ?? []), newItem],
            BannerDetailInfo: [...(cur.BannerDetailInfo ?? []), ...subNewItem],
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

            // 有正式 RowId：用複合鍵過濾；沒有：用索引當後備
            let nextDetails: typeof allDetails;
            if (target.RowId != null) {
                nextDetails = allDetails.filter(d => !(d.BannerId === target.BannerId && d.RowId === target.RowId));
            } else {
                const hitIdx = allDetails.findIndex((d, i) => String(d.RowId ?? i) === keyStr);
                nextDetails = allDetails.filter((_, i) => i !== hitIdx);
            }

            // 子明細一併清掉
            const allInfos = prev.BannerDetailInfo ?? [];
            const nextInfos =
                target.RowId != null
                    ? allInfos.filter(info => !(info.BannerId === target.BannerId && info.ParentRowId === target.RowId))
                    : allInfos;

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
        onRemoveTab: key => removeOne(Number(key)),
    };

    const tabContent: Record<string, React.ReactNode[]> = details.reduce<Record<string, React.ReactNode[]>>((acc, d, idx) => {
        const detailRowId = d.RowId ?? idx;
        const picSrc = d.PicSrcId ? `${FileManagementAPI.PREVIEW_URL}/${d.PicSrcId}` : "https://dummyimage.com/1920x550/555/fff.png";
        const rowKeys = { [SchemaFields.BannerDetailFields.BannerId]: d.BannerId, [SchemaFields.BannerDetailFields.RowId]: d.RowId };

        acc[String(detailRowId)] = [
            <LibFile
                Style={props.theme.File}
                ColumnDisplayName="選擇圖片"
                Multiple={false}
                parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
                InputValue=""
                onChange={files =>
                    useUploadPic.handleFileChange(files, internalId => {
                        props.formData.setFormData(prev => ({
                            ...prev!,
                            BannerDetail: (prev?.BannerDetail ?? []).map(x => (x.RowId === detailRowId ? { ...x, PicSrcId: internalId } : x)),
                        }));
                    })
                }
            >
                <LibPicture PicSrc={picSrc} />
            </LibFile>,
            <LibCalendar {...setField(SchemaFields.BannerSetFields.BannerDetail, SchemaFields.BannerDetailFields.Validate_Start, "datetime", rowKeys)} />,
            <LibCalendar {...setField(SchemaFields.BannerSetFields.BannerDetail, SchemaFields.BannerDetailFields.Validate_End, "datetime", rowKeys)} />,
            <LibDropList Style={props.theme.DropList} Options={fontColorOptions} {...setField(SchemaFields.BannerSetFields.BannerDetail, SchemaFields.BannerDetailFields.FontColor, "string", rowKeys)} ShowPlaceholder={false}/>,
            <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetail, SchemaFields.BannerDetailFields.Sort, "number", rowKeys)} />,
            <SubDetailComp theme={props.theme} formData={props.formData} parentRowId={detailRowId} />,
        ];

        return acc;
    }, {});

    return (<TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>);
};
const SubDetailComp = (props: { theme: IBETheme; formData: UseFetchFormDataResult<BannerSet>; parentRowId: number }) => {
    const setField = useSetTableField<BannerSet>(props.formData);
    const windowTarget = useFetchEnumOptions("WindowTarget");
    const rawDetails = props.formData.data?.BannerDetailInfo?.filter(p => p.ParentRowId === props.parentRowId) ?? [];

    const tabInfo: LibTabsProp = {
        Style: props.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.BannerId, info.ParentRowId, info.RowId, info.Lang);
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {}),
    };

    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>((compMap, info) => {
        const langKey = LibMerge("_", true, info.BannerId, info.ParentRowId, info.RowId, info.Lang);
        const rowKeys = {
            [SchemaFields.BannerDetailInfoFields.BannerId]: info.BannerId,
            [SchemaFields.BannerDetailInfoFields.ParentRowId]: info.ParentRowId,
            [SchemaFields.BannerDetailInfoFields.RowId]: info.RowId,
        };

        compMap[langKey] = [
            <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.Title, "string", rowKeys)} />,
            <LibTextArea Style={props.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.Content, "string", rowKeys)} />,
            <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.URL, "string", rowKeys)} />,
            <LibDropList Style={props.theme.DropList} Options={windowTarget.data} {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.URL_Open, "number", rowKeys)} ShowPlaceholder={false}/>,
            ...(String(import.meta.env.VITE_SPEC_CODE ?? "") === "1817"
                ? [
                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.SpecLatestShows, "string", rowKeys)} />,
                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.SpecShowLocation, "string", rowKeys)} />,
                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(SchemaFields.BannerSetFields.BannerDetailInfo, SchemaFields.BannerDetailInfoFields.SpecShowDate, "string", rowKeys)} />,
                ]
                : []),
        ];

        return compMap;
    }, {});

    return (
        <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
    );
};

/** 標題顏色，後續看是否可調成進階選取RGBA */
const fontColorOptions: Record<string, string> = { ["0"]: "系統預設", ["1"]: "白色", ["2"]: "綠色" };
