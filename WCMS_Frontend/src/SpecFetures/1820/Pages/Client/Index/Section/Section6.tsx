import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];
type Resources = components["schemas"]["SpecHomePage1820_Resource_DTO"];

/** 渲染單一卡片 */
const renderCard = (item: Resources) =>
{
    return (
        <div
            className="Expand-card"
            style={{ backgroundImage: `url('${FileManagementAPI.get_Public_Preview_Url(item.PicFileId)}')` }}
            key={`${item.HomePageId}_${item.RowId}`}
        >
            <div className="overlay"></div>

            <div className="Expand-content text-center text-white">
                <div className="Expand-title-tw font-wt-xxl">{item.PicTitle}</div>
                <div className="Expand-title-en font-wt-xxl">{item.PicSubTitle}</div>
            </div>

            <div className="special__box">
                <div className="Rmore-link-box">
                    <LangLink
                        to={item.Link ?? ""}
                        className="Rmore-link font-wt-lg"
                        target="_self"
                        title={item.PicTitle ?? ""}
                        aria-label={item.PicTitle ?? ""}
                    >
                        <span className="ms-1">〉</span>
                        <span className="vm">View More</span>
                    </LangLink>
                </div>
            </div>
        </div>
    );
};

export const Section6 = (props: { header: HomePageModel; data: Resources[]; }) =>
{
    const header = props.header;
    const data = props.data;
    if (data.length === 0) return null;
    return (
        <section className="Resources_section Layout_Padding_1 bg-custom">
            <div className="Mask-DivBox">
                <div className="customizeBox">
                    <div className="container-customize2">
                        <div className="row">
                            <div className="col-12">
                                <div className="Header_Div">
                                    <div className="title-accent font-wt-lg">{header.Resource_SubTitle}</div>
                                    <div className="main-title display-5">{header.Resource_Title}</div>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="DivBox_style">
                                    <div className="Expand-wrapper">{data.map(renderCard)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
