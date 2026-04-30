import type { TryCountDetailViewRequest } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import { useGalleryFormFetchData } from "@/Features/Pages/Client/BizFunc/WEB/Gallery/GalleryForm_Loader";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent, { type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { useEffect, useMemo, useState } from "react";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Share from "yet-another-react-lightbox/plugins/share";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

type GallerySet = components["schemas"]["GallerySet_DTO"];

const GalleryForm = (props: { site: INormSite; node: INormNode; theme: IFETheme; lang: Lang; }) =>
{
    // 讀取 feature 收斂後的單一資料入口
    const formData = useGalleryFormFetchData({ lang: props.lang });

    // 建立瀏覽次數設定
    const viewCountConfig = useMemo<ModuleViewCountConfig>(() =>
    {
        const request: TryCountDetailViewRequest = { SiteIndex: props.site.siteIndex, ProgId: PGID.Gallery, InternalId: formData.internalId };
        return { mode: "form", contentKey: formData.internalId, request };
    }, [props.site.siteIndex, formData.internalId]);

    return (
        <ModuleContent
            nodeTitle={props.node.title}
            title={formData.title}
            isLoading={formData.isLoading}
            errorList={formData.errorList}
            viewCountConfig={viewCountConfig}
        >
            <NewGalleryFormList lang={props.lang} data={formData.data} />
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
                    const infoDt = props.data.GalleryPhotosInfo?.find((p) => p.ParentRowId === item.RowId && p.Lang === props.lang);
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
                                        {
                                            /* <div className="customize_picture_ZoomIn_btn">
                                            <a href={photoUrl} className="QuickView + p_Btn_zm1 venobox" data-gall="myGallery" type="button" role="button" title="放大圖片">
                                                <i className="fas fa-expand-alt"></i>
                                                <span className="sr-only">放大圖片</span>
                                            </a>
                                        </div> */
                                        }
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

const NewGalleryFormList = (props: { lang: Lang; data: GallerySet; }) =>
{
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);

    const slides = [...(props.data?.GalleryPhotos ?? [])].sort((a, b) =>
    {
        const sortCompare = (a.Sort ?? 0) - (b.Sort ?? 0);
        return sortCompare !== 0 ? sortCompare : (a.RowId ?? 0) - (b.RowId ?? 0);
    }).map((item) =>
    {
        const infoDt = props.data?.GalleryPhotosInfo?.find((p) => p.ParentRowId === item.RowId && p.Lang?.toLowerCase() === props.lang.toLowerCase());
        const title = infoDt?.Title ?? "";
        const url = FileManagementAPI.get_Public_Preview_Url(item.PicSrcId);
        return { src: url, title, description: title, download: url };
    });

    return (
        <>
            <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
                {slides.map((slide, idx) => (
                    <div key={idx} className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 Standard_ItemDiv">
                        <article className="cardbox">
                            <div className="card_content">
                                <figure className="figure_Box">
                                    <button
                                        type="button"
                                        className="card_image_link border-0 bg-transparent p-0 w-100"
                                        onClick={() =>
                                        {
                                            setIndex(idx);
                                            setOpen(true);
                                        }}
                                        title={slide.title}
                                    >
                                        <div className="card_figure">
                                            <div className="img-wrapper">
                                                <img className="card_image" src={slide.src} alt={slide.title} />
                                            </div>
                                        </div>
                                    </button>
                                </figure>

                                <div className="card_titleDiv mb-md-2 mb-sm-1 mb-0">
                                    <div className="card_subtitle">{slide.title}</div>
                                </div>
                            </div>
                        </article>
                    </div>
                ))}
            </div>

            <Lightbox
                open={open}
                close={() => setOpen(false)}
                index={index}
                slides={slides}
                plugins={[Captions, Counter, Download, Fullscreen, Share, Thumbnails, Zoom]}
                captions={{ descriptionTextAlign: "center" }}
                counter={{ container: { style: { top: "unset", bottom: 0 } } }}
                zoom={{ maxZoomPixelRatio: 3, zoomInMultiplier: 2 }}
                thumbnails={{ position: "bottom", width: 100, height: 70, gap: 8 }}
            />
        </>
    );
};
