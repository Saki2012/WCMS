import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";

// #region Property
type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];

type Resources = components["schemas"]["SpecHomePage1820_Resource_DTO"];
// #endregion

// #region Public
/** 1820 首頁資源區塊 */
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
                                    <div className="Expand-wrapper">{data.map((item) => <ResourceCard key={`${item.HomePageId}_${item.RowId}`} item={item} />)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
// #endregion

// #region EntityComp
/** 資源卡片 */
const ResourceCard = (props: { item: Resources; }) =>
{
    return (
        <div className="Expand-card" style={{ backgroundImage: `url('${FileManagementAPI.get_Public_Preview_Url(props.item.PicFileId)}')` }}>
            <div className="overlay"></div>

            <div className="Expand-content text-center text-white">
                <div className="Expand-title-tw font-wt-xxl">{props.item.PicTitle}</div>
                <div className="Expand-title-en font-wt-xxl">{props.item.PicSubTitle}</div>
            </div>

            <div className="special__box">
                <div className="Rmore-link-box">
                    <LangLink to={props.item.Link ?? ""} className="Rmore-link font-wt-lg" target="_self" title={props.item.PicTitle ?? ""} aria-label={props.item.PicTitle ?? ""}>
                        <span className="ms-1">〉</span>
                        <span className="vm">View More</span>
                    </LangLink>
                </div>
            </div>
        </div>
    );
};
// #endregion
