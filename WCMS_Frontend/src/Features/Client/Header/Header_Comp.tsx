
/*Header模塊*/
import MenuComp from '../Menu/Menu'
import { mock_HeaderData } from './Header_Data'
import { useHeaderBehaviorRef } from './Header_Hook';
import { useRef } from 'react'

export default function Header_Comp() {
    const data = mock_HeaderData();
    const headerRef = useRef<HTMLElement>(null);
    useHeaderBehaviorRef(headerRef);
    return (
        <>
        <noscript> <div style={{color:'red'}}>您的瀏覽器不支援 JavaScript，請開啟 Javascript 功能。</div> </noscript>
        <a href="#content" id="gotocenter" title="跳到頁面主要內容區" tabIndex={1} className="sr-only sr-only-focusable">跳到頁面主要內容區</a>
        <div id="site-header" className="LL_Header_DivBar main-header w-100">
            <section className="header_section">
                <header className="header_Box" ref={headerRef}>
                    <div className="container-fluid-customize h-100 mr-0 pr-0">
                        <div className="HeaderDivBox">
                            <div className="leftBox">
                                <div className="logo">
                                    <h1>
                                        <a className="P_logo" href="/" title={data.Title} tabIndex={1}>
                                            <img src={data.SrcImg} alt={data.Title} />
                                        </a>
                                        <a className="M320_logo" href="/" title={data.Title} tabIndex={1}>
                                            <img src={data.SubSrcImg} alt={data.Title} />
                                        </a>
                                    </h1>
                                </div>
                            </div>
                            {/* <MenuComp></MenuComp> */}
                            <div className="overlayer"></div>
                            <div className="rightBox">
                                <button className="main">
                                    <div><i className="fa customize-bars" aria-hidden="true"></i></div>
                                    <span>MENU</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            </section>
        </div>
        </>
    );
}
    
