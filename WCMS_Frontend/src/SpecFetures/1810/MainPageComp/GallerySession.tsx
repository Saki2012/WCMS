/* Banner */
import 'swiper/swiper-bundle.css';
import {BaseCarousel} from '../../../Features/Temp/Page/Components/BaseCarousel'

const GallerySession = () => {

    BaseCarousel({ selectorId: '#Gallery', itemCount: 3 });

    return (
        <section className="Gallery-section owl-box" style={{backgroundImage: "url(/Legacy/Images/bg/background-transparent-image_1920x600.png)"}}>
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
                                    </div>
                                    {/*// Banner 控制 暫停 / 播放 按鈕 START // */}
                                    <div className="control-box">
                                        <a id="Gallery_start" href="javascript:void(0);" className="play" tabIndex={13} title="播放">
                                            <div className="control_start">
                                                <span className="control-start-icon"><span className="d-none">播放</span></span>
                                            </div>
                                        </a>
                                        <a id="Gallery_pause" href="javascript:void(0);" className="stop" tabIndex={13} title="暫停">
                                            <div className="control_pause">
                                                <span className="control-pause-icon"><span className="d-none">暫停</span></span>
                                            </div>
                                        </a>
                                    </div>
                                    <div className="btn_Div justify-content-end px-2">
                                        <div className="customize_btn my-3">
                                            <a href="/Front/EventHighlights/event-album/Gallery.aspx?id=mY8LdII%2F3f4=" className="Btn_s1" tabIndex={13} title="更多活動花絮">VIEW ALL<span className="ml-2">+</span></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
};

export default GallerySession;