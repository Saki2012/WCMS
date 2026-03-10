import type { IFETheme } from '@/Features/Pages/Client/Theme/ITheme';
import type { Lang } from '@/SysCore/i18n/lang';
import ModuleContent from '@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import type { components } from '@/types/api';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';
import type { INormNode } from '@/Features/Pages/Client/Route/Site-Routing';

// ✅ 新架構：Adapter + LoaderData initial
import { useLoaderData } from 'react-router-dom';
import type { ApiLoaderData } from '@/SysCore/Utils/API/APIAdapter';
import { GalleryAdapter } from '@/Features/Hooks/BizFunc/WebManagement/Gallery_Api';
import type { GalleryFormLoaderData } from './GalleryForm_Hook';

type GallerySet = components["schemas"]["GallerySet_DTO"];
const emptyData: GallerySet = {};

const GalleryForm = (props: { node: INormNode; theme: IFETheme; lang: Lang }) => {
    // 宣告變數
    const { internalId } = useParams();
    const loaderData = useLoaderData() as GalleryFormLoaderData | null;

    const adapter = useMemo(() => ({ Gallery: GalleryAdapter() }), []);
    const safeInternalId = `${internalId ?? ""}`.trim();

    // 宣告變數：SSR loaderData → hooks initial（避免 hydration 重撈）
    const initialData = useMemo<ApiLoaderData<string, GallerySet> | null>(() => {
        if (!loaderData?.args?.dataId) return null;
        if (loaderData.args.dataId !== safeInternalId) return null;

        return {
            args: safeInternalId,
            apiRes: {
                IsSuccess: true,
                Data: loaderData.res.dataRes ?? emptyData,
                SysMessage: [],
            },
        };
    }, [loaderData, safeInternalId]);

    // 執行 function：QueryData（SSR initial → CSR 接手）
    const useGalleryFormData = adapter.Gallery.hooks.useQueryData({
        internalId: safeInternalId,
        initial: initialData,
        deps: [safeInternalId, props.lang],
    });

    const loadingList = [useGalleryFormData.isLoading];
    const errorList = [useGalleryFormData.errorText];

    const title = useGalleryFormData.data?.GalleryInfo?.find(p => p.Lang === props.lang)?.Title ?? "";
    const children = useMemo(() => {
        return <GalleryFormList key="grid" lang={props.lang} data={useGalleryFormData.data ?? emptyData} />;
    }, [useGalleryFormData.data, props.lang]);

    // return
    return (
        <ModuleContent nodeTitle={props.node.title} title={title} isLoading={loadingList.some(Boolean)} errorList={errorList}>
            {children}
        </ModuleContent>
    );
};

export default GalleryForm;

const GalleryFormList = (props: { lang: Lang; data: GallerySet }) => {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const w = window as any;
        const $ = w.$ || w.jQuery;

        // 1️⃣ 先嘗試 jQuery 版 plugin：$('.venobox').venobox()
        if ($ && $.fn && typeof $.fn.venobox === "function") {
            $('.venobox').venobox();
        }

        // 2️⃣ 如果有新版 class 版 VenoBox，也一起初始化（對應 prototype 的 new VenoBox({...})）
        if (typeof w.VenoBox === "function") {
            if (w.__vbInstance && typeof w.__vbInstance.destroy === "function") {
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

        if ((!$ || !$.fn?.venobox) && typeof w.VenoBox !== "function") {
            // 兩種都沒有 → 代表 venobox js 根本沒載到
            console.warn("VenoBox / $.fn.venobox not found, please check LoadFeaturesJs.ts and script paths.");
        }
    }, [props.data, props.lang]);

    return (
        <>
            <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">
                {props.data?.GalleryPhotos?.map((item, idx) => {
                    const infoDt = props.data.GalleryPhotosInfo?.find(p => p.ParentRowId === item.RowId && p.Lang === props.lang)
                    const photoTitle = infoDt?.Title ?? ""
                    const photoUrl = `${FileManagementAPI.PREVIEW_URL}/${item.PicSrcId}`
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
                    )
                })}
            </div>
        </>
    );
};
