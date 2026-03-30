import { useEffect, useMemo } from "react";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import ModuleContent, {type ModuleViewCountConfig, } from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import type { components } from "@/types/api";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Api";
import { PGID } from "@/types/SchemaFields";
import { useGalleryFormFetchData } from "@/Features/Pages/Client/BizFunc/WebManagement/Gallery/GalleryForm_Loader";

type GallerySet = components["schemas"]["GallerySet_DTO"];

const GalleryForm = (props: {site: INormSite; node: INormNode; theme: IFETheme; lang: Lang;}) =>
{
    // 讀取 feature 收斂後的單一資料入口
    const formData = useGalleryFormFetchData({lang: props.lang,});

    // 建立瀏覽次數設定
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = {
            SiteIndex: props.site.siteIndex,
            ProgId: PGID.Gallery,
            InternalId: formData.internalId,
        };
        return {
            mode: "form",
            contentKey: formData.internalId,
            request,
        };
    }, [props.site.siteIndex, formData.internalId]);

    return (
        <ModuleContent
            nodeTitle={props.node.title}
            title={formData.title}
            isLoading={formData.isLoading}
            errorList={formData.errorList}
            viewCountConfig={viewCountConfig}
        >
            <GalleryFormList
                lang={props.lang}
                data={formData.data}
            />
        </ModuleContent>
    );
};

export default GalleryForm;

const GalleryFormList = (props: { lang: Lang; data: GallerySet; }) =>
{
    useEffect(() =>
    {
        if (typeof window === "undefined") return;

        const w = window as any;
        const $ = w.$ || w.jQuery;

        // 先嘗試 jQuery 版 plugin 初始化
        if ($ && $.fn && typeof $.fn.venobox === "function")
        {
            $(".venobox").venobox();
        }

        // 如果有新版 class 版 VenoBox，也一起初始化
        if (typeof w.VenoBox === "function")
        {
            if (w.__vbInstance && typeof w.__vbInstance.destroy === "function")
            {
                w.__vbInstance.destroy();
            }

            w.__vbInstance = new w.VenoBox({
                selector: ".venobox",
                autoplay: false,
                maxWidth: "1200px",
                border: "0px",
                titleattr: "title",
                titlePosition: "top",
                numeration: true,
                infinigall: true,
                share: true,
                spinner: "rotating-bounce",
            });
        }

        if ((!$ || !$.fn?.venobox) && typeof w.VenoBox !== "function")
        {
            console.warn("VenoBox / $.fn.venobox not found, please check LoadFeaturesJs.ts and script paths.");
        }
    }, [props.data, props.lang]);

    return (
        <>
            <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
                {props.data?.GalleryPhotos?.map((item, idx) =>
                {
                    const infoDt = props.data.GalleryPhotosInfo?.find(
                        (p) => p.ParentRowId === item.RowId && p.Lang === props.lang,
                    );
                    const photoTitle = infoDt?.Title ?? "";
                    const photoUrl = FileManagementAPI.get_Public_Preview_Url(item.PicSrcId);

                    return (
                        <div key={idx} className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 + Standard_ItemDiv">
                            <article className="cardbox">
                                <div className="card_content">
                                    <figure className="figure_Box">
                                        <a href={photoUrl} className="card_image_link venobox" data-gall="myGallery" title={photoTitle}>
                                            <div className="card_figure">
                                                <div className="img-wrapper">
                                                    <img className="card_image" src={photoUrl} alt="" />
                                                </div>
                                            </div>
                                        </a>
                                        {/* 會重複圖片，先暫時取消 */}
                                        {/* <div className="customize_picture_ZoomIn_btn">
                                            <a href={photoUrl} className="QuickView + p_Btn_zm1 venobox" data-gall="myGallery" type="button" role="button" title="放大圖片">
                                                <i className="fas fa-expand-alt"></i>
                                                <span className="sr-only">放大圖片</span>
                                            </a>
                                        </div> */}
                                    </figure>

                                    <div className="card_titleDiv + mb-md-2 mb-sm-1 mb-0">
                                        <div className="card_subtitle">{photoTitle}</div>
                                    </div>
                                </div>
                            </article>
                        </div>
                    );
                })}
            </div>
        </>
    );
};