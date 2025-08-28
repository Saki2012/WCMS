/* Banner */
import 'swiper/swiper-bundle.css';
import { BaseCarousel } from '../../../../SysCore/Components/BaseCarousel'
import { Link } from 'react-router-dom';
import GalleryProvider from '../../../../Features/Server/Layout/BizFunc/WebManagement/Gallery/Gallery_Api';
import type { components } from '../../../../types/api';
type GallerySet = components["schemas"]["GallerySet_DTO"]
type TagSet = components["schemas"]["TagSet_DTO"]
import * as SchemaFields from "../../../../types/SchemaFields";
import { useFetchGridListData } from '../../../../SysCore/Utils/API/FetchGridListData';
import TagProvider from '../../../../Features/Server/Layout/BizFunc/WebManagement/Tags/Tag_Api';
import { FormatDate } from '../../../../SysCore/Utils/Library/LibData';
import LoadingErrorHandler from '../../../../SysCore/Components/LoadingErrorHandler';

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
                SchemaFields.GalleryFields.Tags,
                SchemaFields.GalleryFields.CoverPicSrcId,
                SchemaFields.GalleryFields.CreateTime,
                `${SchemaFields.GallerySetFields.GalleryInfo}.${SchemaFields.GalleryInfoFields.Lang}`,
                `${SchemaFields.GallerySetFields.GalleryInfo}.${SchemaFields.GalleryInfoFields.Title}`,
            ],
            Condition: `${SchemaFields.GalleryFields.Categories} In (25,26,27,28)`,
            PageNumber: 1,
            PageSize: 10,
        }),
        enabled: true,
        deps: [],
    });
};

const useTagList = () => {
    const provider = TagProvider();
    return useFetchGridListData<TagSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.TagDataFields.TagId,
                `${SchemaFields.TagSetFields.TagDetail}.${SchemaFields.TagDetailFields.Lang}`,
                `${SchemaFields.TagSetFields.TagDetail}.${SchemaFields.TagDetailFields.TagName}`,
            ],
            Condition: `${SchemaFields.TagDataFields.ProgId} = Gallery`,
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [],
    });
};

interface DataProp { internalId: string; picInternalId: string; title: string; date: string; tagName: string; }

const getDataProps = (lang: string, galleryData: GallerySet[], tagData: TagSet[]) => {
    const result: DataProp[] = [];
    const tagDict: Record<string, string> = Object.fromEntries(
        (tagData ?? []).map(cat => {
            const id = cat.TagData?.TagId;
            const name = cat.TagDetail?.find(p => p.Lang === lang)?.TagName ?? "";
            return [id, name];
        })
    );
    galleryData.map((item) => {
        const tags = (item.Gallery?.Tags ?? "").split(",").map(s => s.trim()).filter(Boolean);
        const tagsName = tags.map(id => tagDict[id] ?? "").filter(Boolean).join(", ");
        result.push({
            internalId: item.Gallery?.InternalId ?? "",
            picInternalId: item.Gallery?.CoverPicSrcId ?? "",
            title: item.GalleryInfo?.find(p => p.Lang === lang)?.Title ?? "",
            date: FormatDate(item.Gallery?.CreateTime),
            tagName: tagsName,
        })

    })
    return result
}

export const GallerySession = () => {

    BaseCarousel({ selectorId: '#Gallery', itemCount: 3 });
    const lang = "zh-tw"
    const gallery = useGalleryList();
    const tag = useTagList();

    const isLoading = [gallery.isLoading, tag.isLoading]
    const errors = [gallery.error, tag.error]

    const result: DataProp[] = getDataProps(lang, gallery.rawData, tag.rawData)

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
                                        <div id="Gallery" className="owl-carousel owl-theme px-2">
                                            {/* <asp:Literal ID="Li_Album" runat="server" /> */}
                                            <div className="owl-stage-outer">
                                                <div className="owl-stage" >
                                                    {result.map((item) => {
                                                        return (<div className="owl-item active" >
                                                            <div className="item">
                                                                <Link to={`/EventHighlights/event-album/${item.internalId}`} tabIndex={13} title={item.title}>
                                                                    <div className="DivBox_content v_itemBOX">
                                                                        <div className="Picture_Div">
                                                                            <div className="img_wrapper">
                                                                                <div className="figure_wrapper"> <img src={`/Service/FileManagement/Preview/${item.picInternalId}`} alt={item.title} /> </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="TxtBoxDiv">
                                                                            <div className="card_titleDiv">
                                                                                <div className="card_title">{item.title}</div>
                                                                            </div>
                                                                            <div className="m-news_detail">
                                                                                <div className="category_box">
                                                                                    <div className="m-news_category"> <i className="fa fa-bookmark" aria-hidden="true"></i>
                                                                                        <div className="tags-text">{item.tagName}</div>
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
                                                        </div>)
                                                    })}
                                                </div>
                                            </div>
                                            <div className="owl-nav">
                                                <button type="button" role="presentation" className="owl-prev" tabIndex={7}>
                                                    <span aria-label="Previous" title="上一張">
                                                        <span className="d-none">上一張</span>
                                                    </span>
                                                </button>
                                                <button type="button" role="presentation" className="owl-next" tabIndex={7}>
                                                    <span aria-label="Next" title="下一張">
                                                        <span className="d-none">下一張</span>
                                                    </span>
                                                </button>
                                            </div>
                                            <div className="owl-dots">
                                                <button role="button" className="owl-dot active"><span></span></button>
                                                <button role="button" className="owl-dot"><span></span></button>
                                            </div>
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

