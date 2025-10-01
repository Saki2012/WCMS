/* Banner */
import 'swiper/swiper-bundle.css';
import { BaseCarousel } from '@/SysCore/Components/BaseCarousel'
import { Link } from 'react-router-dom';
import GalleryProvider from '@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api';
import type { components } from '@/types/api';
type GallerySet = components["schemas"]["GallerySet_DTO"]
type CategorySet = components["schemas"]["CategoryDataSet_DTO"]
import * as SchemaFields from "@/types/SchemaFields";
import { useFetchGridListData } from '@/SysCore/Utils/API/FetchGridListData';
import { FormatDate } from '@/SysCore/Utils/Library/LibData';
import LoadingErrorHandler from '@/SysCore/Components/LoadingErrorHandler';
import { useEffect, useRef } from 'react';
import CategoryProvider from '@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api';
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';

const useGalleryList = () => {
    const provider = GalleryProvider();
    return useFetchGridListData<GallerySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.GalleryFields.GalleryId,
                SchemaFields.GalleryFields.InternalId,
                SchemaFields.GalleryFields.Categories,
                SchemaFields.GalleryFields.CoverPicSrcId,
                SchemaFields.GalleryFields.CreateTime,
                SchemaFields.GalleryFields.Validate_Start,
                `${SchemaFields.GallerySetFields.GalleryInfo}.${SchemaFields.GalleryInfoFields.Lang}`,
                `${SchemaFields.GallerySetFields.GalleryInfo}.${SchemaFields.GalleryInfoFields.Title}`,
            ],
            Condition: `${SchemaFields.GalleryFields.Categories} In (25,26,27,28)`,
            OrderBy: [{ Col: SchemaFields.GalleryFields.ModifyTime, Desc: true }],
            PageNumber: 1,
            PageSize: 10,
        }),
        enabled: true,
        deps: [],
    });
};

const useCategoryList = () => {
    const provider = CategoryProvider();
    return useFetchGridListData<CategorySet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.CategoryFields.CategoryId,
                `${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.Lang}`,
                `${SchemaFields.CategoryDataSetFields.CategoryDetail}.${SchemaFields.CategoryDetailFields.CategoryName}`,
            ],
            Condition: `${SchemaFields.TagDataFields.ProgId} = Gallery`,
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [],
    });
};

interface DataProp { internalId: string; picInternalId: string; title: string; date: string; catName: string; }

const getDataProps = (lang: string, galleryData: GallerySet[], catData: CategorySet[]) => {
    const result: DataProp[] = [];
    const catDict: Record<string, string> = Object.fromEntries(
        (catData ?? []).map(cat => {
            const id = cat.Category?.CategoryId;
            const name = cat.CategoryDetail?.find(p => p.Lang === lang)?.CategoryName ?? "";
            return [id, name];
        })
    );
    galleryData.map((item) => {
        const cats = (item.Gallery?.Categories ?? "").split(",").map(s => s.trim()).filter(Boolean);
        const catsName = cats.map(id => catDict[id] ?? "").filter(Boolean).join(", ");
        result.push({
            internalId: item.Gallery?.InternalId ?? "",
            picInternalId: item.Gallery?.CoverPicSrcId ?? "",
            title: item.GalleryInfo?.find(p => p.Lang === lang)?.Title ?? "",
            date: FormatDate(item.Gallery?.Validate_Start),
            catName: catsName,
        })
    })
    return result
}

export const GallerySession = () => {

    BaseCarousel({ selectorId: '#Gallery', itemCount: 3 });
    const lang = "zh-tw"
    const gallery = useGalleryList();
    const cate = useCategoryList();

    const isLoading = [gallery.isLoading, cate.isLoading]
    const errors = [gallery.error, cate.error]
    const result: DataProp[] = getDataProps(lang, gallery.rawData, cate.rawData)
    const carouselRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (result.length > 0 && carouselRef.current) {
            const $owl = $(carouselRef.current);

            // Destroy if exists
            if ($owl.hasClass('owl-loaded')) {
                $owl.trigger('destroy.owl.carousel');
            }

            // Init carousel
            setTimeout(() => {
                $owl.owlCarousel({
                    items: 3,
                    loop: true,
                    dots: true,
                    nav: true,
                    margin: 30,
                    // autoplay: true,
                    autoplayTimeout: 3000,
                    autoplayHoverPause: true,
                    responsive: {
                        0: { items: 1 },
                        767: { items: 2 },
                        991: { items: 3 },
                        1200: { items: 3 }
                    }

                });

                // 設定 tabindex
                $('#Gallery .owl-nav button').attr('tabindex', '7');

                // 播放與暫停控制
                $('#Gallery_start').on('click', () => {
                    $owl.trigger('play.owl.autoplay', [6000]);
                });

                $('#Gallery_pause').on('click', () => {
                    $owl.trigger('stop.owl.autoplay');
                });
            }, 0);

            return () => {
                $('#Gallery_start').off();
                $('#Gallery_pause').off();
                if ($owl.hasClass('owl-loaded')) {
                    $owl.trigger('destroy.owl.carousel');
                }
            };
        }
    }, [result]);

    return (
        <LoadingErrorHandler loadingList={isLoading} errorList={errors}>

            <section className="Gallery-section owl-box" style={{ backgroundImage: "url(/Legacy/Client/Images/bg/background-transparent-image_1920x600.png)" }}>
                <div className="Mask-DivBox layout_padding2">
                    <div className="customizeBox">
                        <div className="container-customize1">
                            <div className="row">
                                <div className="col-12 px-4 + animate__animated animate__slow wow animate__bounceInUp" data-wow-delay="0.1s">
                                    {/* // 標題 start // */}
                                    <div className="Standard-TitleDiv div-header">
                                        <div className="TextDIV">
                                            <h3><span className="title-tw">活動花絮<span className="c-line"></span></span></h3>
                                            <span className="en-box">
                                                <span className="title-en">Gallery</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="container-customize1">
                            <div className="row">
                                <div className="col-12 + p-0">
                                    <div className="content-box + animate__animated animate__slow wow animate__zoomIn" data-wow-delay="0.15s">
                                        <div id="Gallery" className="owl-carousel owl-theme px-2" ref={carouselRef}>
                                            {/* <asp:Literal ID="Li_Album" runat="server" /> */}
                                            {result.map((item) => {
                                                return item && (
                                                    <div className="item" key={item.title}>
                                                        <Link to={`/EventHighlights/event-album/${item.internalId}`} tabIndex={13} title={item.title}>
                                                            <div className="DivBox_content v_itemBOX">
                                                                <div className="Picture_Div">
                                                                    <div className="img_wrapper">
                                                                        <div className="figure_wrapper"> <img src={`${FileManagementAPI.PREVIEW_URL}/${item.picInternalId}`} alt={item.title} /> </div>
                                                                    </div>
                                                                </div>
                                                                <div className="TxtBoxDiv">
                                                                    <div className="card_titleDiv">
                                                                        <div className="card_title">{item.title}</div>
                                                                    </div>
                                                                    <div className="m-news_detail">
                                                                        <div className="category_box">
                                                                            <div className="m-news_category"> <i className="fa fa-bookmark" aria-hidden="true"></i>
                                                                                <div className="tags-text">{item.catName}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="TimeBoxDiv">
                                                                            <div className="card_time"><i className="fa fa-clock-o" aria-hidden="true"></i>{item.date}</div>
                                                                            <div className="card_arrow"><i className="fa fa-arrow-circle-right" aria-hidden="true"></i></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {/*// Banner 控制 暫停 / 播放 按鈕 START // */}
                                        <div className="control-box">
                                            <a id="Gallery_start" href="#" onClick={(e) => { e.preventDefault(); }} className="play" tabIndex={13} title="播放">
                                                <div className="control_start">
                                                    <span className="control-start-icon"><span className="d-none">播放</span></span>
                                                </div>
                                            </a>
                                            <a id="Gallery_pause" href="#" onClick={(e) => { e.preventDefault(); }} className="stop" tabIndex={13} title="暫停">
                                                <div className="control_pause">
                                                    <span className="control-pause-icon"><span className="d-none">暫停</span></span>
                                                </div>
                                            </a>
                                        </div>
                                        <div className="btn_Div justify-content-end px-2">
                                            <div className="customize_btn my-3">
                                                <Link to="/EventHighlights/event-album" className="Btn_s1" tabIndex={13} title="更多活動花絮">VIEW ALL<span className="ml-2">+</span></Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </LoadingErrorHandler>

    )
};

