import { LibCheckBox, LibTextBox, LibTextArea, LibFile, LibDropList, LibPicture } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import type { components } from "@/types/api";
import { type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { LangLabelMap, useEnsureLangDetails, type Lang } from "@/SysCore/i18n/lang";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useCallback, useMemo } from "react";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { WebResourceFields, WebResourceInfoFields, WebResourceSetFields } from "@/types/SchemaFields";
import { useWebResourceFormFetchData } from "./Server_WebResource_Form_Hook";
import { SystemInfoTabComp } from "../../../Scaffold/SystemTab/SystemTab";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"]
const emptyData: WebResourceSet = { WebResource: {}, WebResourceInfo: [] }

export const WebResourceFormComp = (prop: { theme: IBETheme; lang: Lang }) => {
    const { internalId } = useParams()
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const onBackToList = useCallback(() => {navigate(pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));}, [navigate, pathname]);
    const actionsOpt = useMemo(() => {return { onBackToList };}, [onBackToList]);
    const getData = useWebResourceFormFetchData({lang: prop.lang,internalId: internalId ?? "",emptyData, actionsOpt});
    useEnsureLangDetails(getData.rawData.formData, { headerName: WebResourceSetFields.WebResource, detailName: WebResourceSetFields.WebResourceInfo, parentKeys: [WebResourceFields.WebResourceId], preferFirstLang: prop.lang });
    const formProp: FormCompProp = { Title: "新增網路資源", Theme: prop.theme, IsLoading: getData.isLoading, ErrorList: getData.errors, Actions: getData.rawData.actions }
    return (
        <FormComp prop={formProp}>
            <HeaderComp theme={prop.theme} formData={getData.rawData.formData} cateOpts={getData.rawData.categoryMap} statusOpts={getData.rawData.statusOpts} tagOpts={getData.rawData.tagMap} />
            <DetailComp theme={prop.theme} formData={getData.rawData.formData} urlOpenOpt={getData.rawData.windowsTarget} />
        </FormComp>
    )
}

const HeaderComp = (prop: {theme: IBETheme; formData: UseFetchFormDataResult<WebResourceSet>;cateOpts: Record<string, string>; statusOpts: Record<string, string>; tagOpts: Record<string, string>;}) => 
{
    const setField = useSetTableField<WebResourceSet>(prop.formData);
    const useUploadPic = useUploadPicture();
    const initialPicId = prop.formData.data?.WebResource?.PicId;
    const previewSrc = useUploadPic.result.previewUrl || (initialPicId ? `${FileManagementAPI.PREVIEW_URL}/${initialPicId}` : "https://dummyimage.com/1920x550/555/fff.png");
    const LibTabsPropA: LibTabsProp = {Style: prop.theme.Tabs,item: { Basic: "基本", Status: "狀態", Tags: "標籤", Img: "圖片", System:"系統資訊" }}
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.cateOpts} {...setField(WebResourceSetFields.WebResource, WebResourceFields.Categories, 'string', undefined, 'csv')} />,],
        Status: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.statusOpts} {...setField(WebResourceSetFields.WebResource, WebResourceFields.ContentStatus, 'number', undefined, { strategy: 'sum', sumKeys: Object.keys(prop.statusOpts ?? {}).map(Number) })} />],
        Tags: [<LibCheckBox Style={prop.theme.CheckBox} options={prop.tagOpts} {...setField(WebResourceSetFields.WebResource, WebResourceFields.Tags, 'string', undefined, 'csv')} />],
        Img: [
            <LibFile Style={prop.theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false} InputValue={""} accept="image/*" parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12" 
                onChange={(files) =>
                    useUploadPic.handleFileChange(files, (internalId) => {
                        prop.formData.setFormData((prev) => ({ ...prev, WebResource: { ...prev?.WebResource, PicId: internalId, }, }));
                    })
                }>
                <LibPicture key="preview" ColumnDisplayName={useUploadPic?.result.previewUrl ?? ""} PicSrc={previewSrc} PicDescription={`選中的圖片`} />
            </LibFile>,
            <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(WebResourceSetFields.WebResource, WebResourceFields.PicDescription, "string")} />,
        ],
        System: [<SystemInfoTabComp theme={prop.theme} formData={prop.formData} setKey={WebResourceSetFields.WebResource} />]
    }
    return <TabContentComp tabInfos={LibTabsPropA} components={componentsA}></TabContentComp>
}
const DetailComp = (prop: { theme: IBETheme, formData: UseFetchFormDataResult<WebResourceSet>; urlOpenOpt: Record<string, string>; }) => {
    const setField = useSetTableField<WebResourceSet>(prop.formData);
    const rawDetails = prop.formData.data?.WebResourceInfo ?? [];
    const tabInfo: LibTabsProp = {
        Style: prop.theme.Tabs,
        item: rawDetails.reduce<Record<string, string>>((tabItems, info) => {
            const langKey = LibMerge("_", true, info.WebResourceId, info.RowId, info.Lang)
            tabItems[langKey] = LangLabelMap[info.Lang as Lang] ?? info.Lang ?? "Unknown";
            return tabItems;
        }, {})
    }
    const tabContent: Record<string, React.ReactNode[]> = rawDetails.reduce<Record<string, React.ReactNode[]>>(
        (compMap, info) => {
            const langKey = LibMerge("_", true, info.WebResourceId, info.RowId, info.Lang)
            const rowKeys = { [WebResourceInfoFields.WebResourceId]: info.WebResourceId, [WebResourceInfoFields.RowId]: info.RowId, }
            compMap[langKey] = [
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Title, "string", rowKeys)} />,
                <LibTextArea Style={prop.theme.TextArea} DefaultInputDisplay="請輸入" {...setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Content, "string", rowKeys)} />,
                <LibTextBox Style={prop.theme.TextBox} DefaultInputDisplay="請輸入" {...setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.ResUrl, "string", rowKeys)} />,
                <LibDropList Style={prop.theme.DropList} Options={prop.urlOpenOpt} {...setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Url_OpenType, "number", rowKeys)} />,
            ]
            return compMap;
        }, {}
    );
    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>
}
