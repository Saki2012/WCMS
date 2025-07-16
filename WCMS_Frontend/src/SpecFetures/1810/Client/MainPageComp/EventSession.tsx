/* Banner */
import {BaseCarousel} from '../../../../SysCore/Components/BaseCarousel'
// import {fetchUserData, getMockUser} from './FetchEvent'
import { useEffect, useRef } from 'react';
import {mock_EventDatas} from './Event_Data'




const EventSession = () => {
    const eventRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
        BaseCarousel({ selectorId: '#Event', itemCount: 4 });
    }, []);

    const eventList = mock_EventDatas(); // 呼叫函式拿到 array

    return (
        <section className="Event-section owl-box" style={{backgroundImage: "url(/Legacy/Client/Images/bg/background-transparent-image_1920x600.png)"}} ref={eventRef}>
            <div className="Mask-DivBox layout_padding2">
                <div className="customizeBox">
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-12 px-4 + animate__animated animate__slow wow animate__bounceInUp" data-wow-delay="0.1s">
                                {/* // 標題 start // */}
                                <div className="Standard-TitleDiv div-header">
                                    <div className="TextDIV">
                                        <h3><span className="title2-tw">活動資訊<span className="c-line-white"></span></span></h3>
                                        <span className="en-box">
                                            <span className="title2-en">Event information</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container-customize1">
                        <div className="row">
                            <div className="col-12 + p-0">
                                <div className="content-box + animate__animated animate__slow wow animate__bounceInUp" data-wow-delay="0.1s">
                                    <div id="Event" className="owl-carousel owl-theme px-2">
                                        {/* <asp:Literal ID="Lit_Event" runat="server" /> {/*輪播項目*/}
                                        {eventList.map((item, index) => (
                                        <div className="owl-item" key={item.Id}>
                                            <div className="item">
                                                <a href={item.Url} title={item.Title} tabIndex={index + 1}>
                                                    <div className="DivBox_content v_itemBOX">
                                                        <div className="Picture_Div">
                                                            <div className="img_wrapper">
                                                                <div className="figure_wrapper">
                                                                    <img src={item.ImgSrc} alt={item.Title} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="TxtBoxDiv">
                                                            <div className="card_titleDiv">
                                                                <div className="card_title">{item.Title}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="m-news_detail">
                                                    <div className="category_box">
                                                        <div className="m-news_category"> <i className="fa fa-bookmark" aria-hidden="true"></i>
                                                            <div className="tags-text">{item.Tags}</div>
                                                        </div>
                                                    </div>
                                                    <div className="TimeBoxDiv">
                                                        <div className="card_time"><i className="fa fa-clock-o" aria-hidden="true"></i>2025/04/11</div>
                                                        <div className="card_arrow"><i className="fa fa-arrow-circle-right" aria-hidden="true"></i></div>
                                                    </div>
                                                </div>
                                                </a>
                                            </div>
                                        </div>
                                        ))}
                                    </div>
                                    <div className="control-box">
                                        <a id="Event_start" href="javascript:void(0);" className="play" tabIndex={12} title="播放">
                                            <div className="control_start">
                                                <span className="control-start-icon"><span className="d-none">播放</span></span>
                                            </div>
                                        </a>
                                        <a id="Event_pause" href="javascript:void(0);" className="stop" tabIndex={12} title="暫停">
                                            <div className="control_pause">
                                                <span className="control-pause-icon"><span className="d-none">暫停</span></span>
                                            </div>
                                        </a>
                                    </div>
                                    <div className="btn_Div justify-content-end px-2">
                                        <div className="customize_btn my-3">
                                            <a href="/Front/Allnews/Intramural-activities/In-school-activities/News.aspx?id=eDkgsr5WXo4=" className="Btn_s2" tabIndex={12} title="更多活動資訊">VIEW ALL<span className="ml-2">+</span></a>
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

export default EventSession;