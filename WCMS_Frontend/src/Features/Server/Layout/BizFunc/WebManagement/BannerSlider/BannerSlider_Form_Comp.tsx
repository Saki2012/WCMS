import {LibTextBox } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import { useGetTagListByProgId } from "../Tags/Tag_Hook";
import BannerSliderProvider from "./BannerSlider_Api";
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import type { components } from "../../../../../../types/api";
type BannerSet = components["schemas"]["BannerSet"]
import { useEffect } from "react";
import { useFetchFormData } from "../../../../../../SysCore/Utils/FetchFormData";


const emptyData:BannerSet={
    Banner:{},
    BannerDetail:[],
    BannerDetailInfo:[]
}

export const BannerSliderFormComp = ({theme}:{theme:IBETheme}) => {
    const { internalId } = useParams();
    const useCategory = useGetCategoryListByProgId("Announcement","zh-tw");
    const useTag = useGetTagListByProgId("Announcement","zh-tw");
    const formData = useFetchFormData<BannerSet>(BannerSliderProvider(),internalId,emptyData)
    const useToolbar = useFormToolbarActions(BannerSliderProvider(), formData.data as BannerSet, internalId as string,() => formData.refetch())
    const isLoading=[useTag.isLoading,useCategory.isLoading,formData.isLoading]
    const errors=[useTag.error,useCategory.error,formData.error]
    
    useEffect(() => {if (formData.data) {formData.setFormData(formData.data);}}, [formData.data]);

    const prop:FormCompProp={ Title:"設定輪播", Theme:theme, LoadingList:isLoading, ErrorList:errors, Toolbar:useToolbar.action }


    return (
        <FormComp prop={prop}>
            <LibTextBox key={`${1}-Title`} Style={theme.TextBox} ColumnDisplayName={`橫幅名稱`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""} OnChange={(val) => (val)} />
            <LibTextBox key={`${2}-Title`} Style={theme.TextBox} ColumnDisplayName={`轉換速度`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""} OnChange={(val) => (val)} />
            <LibTextBox key={`${3}-Title`} Style={theme.TextBox} ColumnDisplayName={`橫幅寬度 ( W ) ( 像素 px )`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""} OnChange={(val) => (val)} />
            <LibTextBox key={`${4}-Title`} Style={theme.TextBox} ColumnDisplayName={`轉換間隔`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""}OnChange={(val) => (val)} />
            <LibTextBox key={`${5}-Title`} Style={theme.TextBox} ColumnDisplayName={`橫幅效果`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""}OnChange={(val) => (val)} />
            <LibTextBox key={`${6}-Title`} Style={theme.TextBox} ColumnDisplayName={`橫幅高度 ( H ) ( 像素 px )`} DefaultInputDisplay="請輸入" InputValue={formData.data?.Banner?.BannerId ?? ""} OnChange={(val) => (val)} />
        </FormComp>
    )
}