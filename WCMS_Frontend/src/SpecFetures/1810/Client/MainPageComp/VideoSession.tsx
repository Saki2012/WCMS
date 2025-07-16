/* Banner */
import 'swiper/swiper-bundle.css';
import {BaseCarousel} from '../../../../SysCore/Components/BaseCarousel'

const VideoSession = () => {

    BaseCarousel({ selectorId: '#Video', itemCount: 3 });

    return (
        <section className="Vedio-section owl-box" style={{backgroundImage: "url(/Legacy/Client/Images/bg/background-image_video_2000x1500.jpg)"}}>
            <div className="Mask-DivBox layout_padding1">
                <div className="customizeBox">
                    <div className="container">
                        <div className="row">
                            <div className="col-12 + p-0">
                                <div className="content-box + animate__animated animate__slow wow animate__zoomIn" data-wow-delay="0.15s">
                                    <div id="Vedio" className="owl-carousel owl-theme px-2">
                                            {/* <asp:Literal ID="Lit_Video" runat="server" /> */}
                                    </div>
                                    {/*// Banner 控制 暫停 / 播放 按鈕 START // */}
                                    <div className="control-box">
                                        <a id="Vedio_start" href="javascript:void(0);" className="play" tabIndex={14} title="播放">
                                            <div className="control_start">
                                                <span className="control-start-icon"><span className="d-none">播放</span></span>
                                            </div>
                                        </a>
                                        <a id="Vedio_pause" href="javascript:void(0);" className="stop" tabIndex={14} title="暫停">
                                            <div className="control_pause">
                                                <span className="control-pause-icon"><span className="d-none">暫停</span></span>
                                            </div>
                                        </a>
                                    </div>
                                    <div className="btn_Div justify-content-end px-2">
                                        <div className="customize_btn my-3">
                                            <a href="/Front/EventHighlights/Event-video/WebResource.aspx?id=V2GibEubNrg=" className="Btn_s1" tabIndex={14} title="更多影音">VIEW ALL<span className="ml-2">+</span></a>
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

export default VideoSession;