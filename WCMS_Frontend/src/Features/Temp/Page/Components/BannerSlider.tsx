/* Banner */
import { useEffect, useRef } from 'react';
import {Carousel} from 'bootstrap'
import 'swiper/swiper-bundle.css';



const BannerSlider = () => {
  const bannerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    // ✅ Bootstrap Carousel
    if (bannerRef.current) {
        const myCarousel = bannerRef.current.querySelector('#carousel-Controls');
        const myCarousel2 = bannerRef.current.querySelector('#carousel-Controls_MB');
  
        if (myCarousel) {
          new Carousel(myCarousel, {
            interval: 5000,
            pause: false,
            ride: 'carousel',
            touch: true,
            wrap: true,
            keyboard: true,
          });
        }
  
        if (myCarousel2) {
          new Carousel(myCarousel2, {
            interval: 5000,
            pause: false,
            ride: 'carousel',
            touch: true,
            wrap: true,
            keyboard: true,
          });
        }
  
        // ✅ jQuery 控制播放暫停
        // 確保 jQuery ($) 已經被載入
        if (typeof window.$ === 'function') {
          window.$(() => {
            window.$('#cycleCarousel').click(() => {
              window.$('#carousel-Controls').carousel('cycle');
            });
            window.$('#pauseCarousel').click(() => {
              window.$('#carousel-Controls').carousel('pause');
            });
            window.$('#cycleCarousel_MB').click(() => {
              window.$('#carousel-Controls').carousel('cycle');
            });
            window.$('#pauseCarousel_MB').click(() => {
              window.$('#carousel-Controls').carousel('pause');
            });
          });
        }
    }}, []);
return (
    <section className="carousel_slide_section" ref={bannerRef}>
                    <div className="sidebar">
                        <div className="scroll_Down"><a href="#content" className="eng_font">SCROLL</a></div>
                    </div>
                    <div className="customize_visualBox + animate__animated animate__slow wow fadeInRight d-xl-block d-lg-block d-md-block d-sm-none d-none" data-wow-delay="0.05s">
                        <div id="carousel-Controls" className="carousel carousel-dark slide carousel-fade" data-bs-ride="carousel">
                            {/* <asp:Literal ID="Lit_Banner_PC" runat="server" /> 以下為測試資料 */}
                            <div className='carousel-inner'>
                                <div className='carousel-item active' data-bs-interval='5000' >
                                    <img src='/Legacy/File/Banner/A9-2E-A9-5C-8E-CF-E0-75-3D-50-5A-3B-CF-6F-78-C8.jpg' className='d-block w-100' alt='首頁Banner圖片' />
                                </div>
                                <div className='carousel-item' data-bs-interval='5000' >
                                    <img src='/Legacy/File/Banner/6B-28-1E-A5-EC-12-E1-E4-73-8F-76-44-8E-97-4D-65.PNG' className='d-block w-100' alt='' />
                                </div>
                                <div className='carousel-item' data-bs-interval='5000' >
                                    <video className='d-block w-100' src='/Legacy/File/Banner/0E-67-17-2F-FF-BB-B6-0A-EC-A9-15-D8-6B-F3-88-6F.mp4' title='影片'  autoPlay muted loop style={{width: '100vw', height: 'auto'}}></video>
                                </div>
                                <div className='carousel-item' data-bs-interval='5000' >
                                    <img src='/Legacy/File/Banner/1C-13-3E-9A-51-ED-8A-B6-0B-1C-1A-C3-3B-42-D7-B0.jpg' className='d-block w-100' alt='圖書館' />
                                </div>	
                                <div className='carousel-item' data-bs-interval='5000' >
                                    <img src='/Legacy/File/Banner/47-1F-F2-A3-C8-CC-55-AC-1B-DF-46-33-7B-10-CA-F0.jpg' className='d-block w-100' alt='有章博物館' />
                                </div>
                            </div>
                            {/* 以上為測試資料 */}

                            <div className="control-box">
                                <div className="carousel_btn-icon-prev">
                                    <a className="carousel-control-prev" href="javascript:void(0);" data-bs-target="#carousel-Controls" role="button" data-bs-slide="prev" title="上一張" tabIndex={1}>
                                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                        <span className="sr-only">Previous</span>
                                    </a>
                                </div>
                                <div className="carousel_btn-icon-next">
                                    <a className="carousel-control-next" href="javascript:void(0);" data-bs-target="#carousel-Controls" role="button" data-bs-slide="next" title="下一張" tabIndex={1}>
                                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                        <span className="sr-only">Next</span>
                                    </a>
                                </div>
                                <div id="cycleCarousel" className="control-start">
                                    <a type="button" href="javascript:void(0);" data-bs-target="#carousel-Controls" onClick={(e) => e.preventDefault()} title="播放" tabIndex={1}>
                                        <span className="control-start-icon"></span><span className="sr-only">播放</span>
                                    </a>
                                </div>
                                <div id="pauseCarousel" className="control-pause">
                                    <a type="button" href="javascript:void(0);" data-bs-target="#carousel-Controls" onClick={(e) => e.preventDefault()} title="暫停" tabIndex={1}>
                                        <span className="control-pause-icon"></span><span className="sr-only">暫停</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="customize_visualBox + animate__animated animate__slow wow fadeInRight d-xl-none d-lg-none d-md-none d-sm-block " data-wow-delay="0.05s">
                        <div id="carousel-Controls_MB" className="carousel carousel-dark slide carousel-fade" data-bs-ride="carousel">
                             {/* <asp:Literal ID="Lit_Banner_MB" runat="server" /> */}
                            <div className='carousel-inner'>
                                <div className='carousel-item active' data-bs-interval='5000' >
                                    <img src='/File/Banner/A9-2E-A9-5C-8E-CF-E0-75-3D-50-5A-3B-CF-6F-78-C8.jpg' className='d-block w-100' alt='首頁Banner圖片' />
                                </div>
                                <div className='carousel-item' data-bs-interval='5000' >
                                    <img src='/File/Banner/6B-28-1E-A5-EC-12-E1-E4-73-8F-76-44-8E-97-4D-65.PNG' className='d-block w-100' alt='' />
                                </div>
                                <div className='carousel-item' data-bs-interval='5000' >
                                    <video className='d-block w-100' src='/File/Banner/0E-67-17-2F-FF-BB-B6-0A-EC-A9-15-D8-6B-F3-88-6F.mp4' title='影片'  autoPlay muted loop style={{width: '100vw', height: 'auto'}}></video>
                                </div>
                                <div className='carousel-item' data-bs-interval='5000' >
                                    <img src='/File/Banner/1C-13-3E-9A-51-ED-8A-B6-0B-1C-1A-C3-3B-42-D7-B0.jpg' className='d-block w-100' alt='圖書館' />
                                </div>	
                                <div className='carousel-item' data-bs-interval='5000' >
                                    <img src='/File/Banner/47-1F-F2-A3-C8-CC-55-AC-1B-DF-46-33-7B-10-CA-F0.jpg' className='d-block w-100' alt='有章博物館' />
                                </div>
                            </div>
                            {/* 以上為測試資料 */}
                            <div className="control-box">
                                <div className="carousel_btn-icon-prev">
                                    <a className="carousel-control-prev" href="#" type="button" data-bs-target="#carousel-Controls_MB" data-bs-slide="prev" title="上一張" tabIndex={1}>
                                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                        <span className="sr-only">Previous</span>
                                    </a>
                                </div>
                                <div className="carousel_btn-icon-next">
                                    <a className="carousel-control-next" href="#" type="button" data-bs-target="#carousel-Controls_MB" data-bs-slide="next" title="下一張" tabIndex={1}>
                                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                        <span className="sr-only">Next</span>
                                    </a>
                                </div>
                                <div id="cycleCarousel_MB" className="control-start">
                                    <a type="button" href="#carousel-Controls_MB" 	onClick={(e) => e.preventDefault()} title="播放" tabIndex={1}>
                                        <span className="control-start-icon"></span><span className="sr-only">播放</span>
                                    </a>
                                </div>
                                <div id="pauseCarousel_MB" className="control-pause">
                                    <a type="button" href="#carousel-Controls_MB" 	onClick={(e) => e.preventDefault()} title="暫停" tabIndex={1}>
                                        <span className="control-pause-icon"></span><span className="sr-only">暫停</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
)
};

export default BannerSlider;