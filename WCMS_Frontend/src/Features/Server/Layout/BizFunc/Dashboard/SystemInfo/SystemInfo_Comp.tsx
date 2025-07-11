
//主機狀態


const ServerInfo = () =>{
    return(
        <div className="col-sm-12">
            <div className="card">
                <div className="card-header">
                    <h3><i className="fas fa-braille me-2"></i>主機資訊</h3>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="panel">
                                <div className="panel-body">
                                    <div className="form">
                                        <div className="row mx-0">

                                            <div className="col-md-6 col-xl-3">
                                                <div className="panel">
                                                    <div className="panel-body">                                                
                                                        <div className="panel-header bg-primary text-white">
                                                            <h4 className="fw-bold text-white">作業系統</h4>
                                                        </div>
                                                        <div className="panel-ContentBox">
                                                            <div className="row">
                                                                <div className="col-12">
                                                                    <div className="col-auto d-flex align-items-center">                                                            
                                                                        <i className="fas fa-server + text-dark f-26 m-r-10"></i>
                                                                        <h5 className="f-w-b d-flex align-items-center m-b-0">
                                                                            Windows Server 2019 Standard 
                                                                        </h5>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>    
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6 col-xl-3">
                                                <div className="panel">
                                                    <div className="panel-body">
                                                        <div className="panel-header bg-success text-white">
                                                            <h4 className="fw-bold text-white">作業系統</h4>
                                                        </div>
                                                        <div className="panel-ContentBox">
                                                            <div className="row">
                                                                <div className="col-12">
                                                                    <div className="col-auto d-flex align-items-center">
                                                                        <i className="fas fa-laptop + text-dark f-26 m-r-10"></i>
                                                                        <h5 className="f-w-b d-flex align-items-center m-b-0">
                                                                            Microsoft-IIS / 10.0
                                                                        </h5>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>    
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6 col-xl-3">
                                                <div className="panel">
                                                    <div className="panel-body">
                                                        <div className="panel-header bg-warning text-white">
                                                            <h4 className="fw-bold text-white">記憶體使用率</h4>
                                                        </div>
                                                        <div className="panel-ContentBox">
                                                            <div className="row">
                                                                <div className="col-12">
                                                                    <div className="progress-box">
                                                                        <i className="fas fa-microchip + text-dark f-26 m-r-10"></i>
                                                                        <div className="progress">
                                                                            <div className="progress-bar progress-bar-striped progress-bar-animated bg-warning" role="progressbar" style="width: 37%;" aria-valuenow="37" aria-valuemin="0" aria-valuemax="100"></div>
                                                                        </div>
                                                                        <div className="ml-auto">
                                                                            <p className="f-w-b mb-0">37%</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>                                                
                                                        </div>    
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6 col-xl-3">
                                                <div className="panel">
                                                    <div className="panel-body">
                                                        <div className="panel-header bg-danger text-white">
                                                            <h4 className="fw-bold text-white">硬碟使用率</h4>
                                                        </div>
                                                        <div className="panel-ContentBox">
                                                            <div className="row">
                                                                <div className="col-12">
                                                                    <div className="progress-box">
                                                                        <i className="fas fa-hdd + text-dark f-26 m-r-10"></i>
                                                                        <div className="progress">
                                                                            <div className="progress-bar progress-bar-striped progress-bar-animated bg-danger" role="progressbar" style="width: 37%;" aria-valuenow="38" aria-valuemin="0" aria-valuemax="100"></div>
                                                                        </div>
                                                                        <div className="ml-auto">
                                                                            <p className="f-w-b mb-0">38%</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>                                                
                                                        </div>    
                                                    </div>
                                                </div>
                                            </div>

                                        </div>   
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>                            
                </div>
            </div>
        </div>
    )
}

//用戶使用情形，希望追加使用裝置(PC/手機...)
const ClientUseInfo = () =>{
    return(
        <div className="col-sm-12">
            <div className="card">
                <div className="card-header">
                    <h3><i className="fas fa-braille me-2"></i>瀏覽器 / 作業系統 資訊</h3>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="panel">
                                <div className="panel-body">
                                    <div className="form">
                                        <div className="row mx-0"> 

                                            <div className="col-md-6">
                                                <div className="panel">
                                                    <div className="panel-body">
                                                        <div className="panel-header bg-secondary text-white">
                                                            <h4 className="fw-bold text-white">瀏覽器使用率</h4>
                                                        </div>
                                                        <div className="panel-ContentBox">
                                                            <div className="row align-items-center justify-content-center">
                                                                <div className="col-12">
                                                                    <div id="chart1" className="c3" style="max-height: 320px; position: relative;"><svg width="686" height="320" style="overflow: hidden;"><defs><clipPath id="c3-1751261074061-clip"><rect width="686" height="296"></rect></clipPath><clipPath id="c3-1751261074061-clip-xaxis"><rect x="-31" y="-20" width="748" height="40"></rect></clipPath><clipPath id="c3-1751261074061-clip-yaxis"><rect x="-29" y="-4" width="20" height="320"></rect></clipPath><clipPath id="c3-1751261074061-clip-grid"><rect width="686" height="296"></rect></clipPath><clipPath id="c3-1751261074061-clip-subchart"><rect width="686" height="0"></rect></clipPath></defs><g transform="translate(0.5,4.5)"><text className="c3-text c3-empty" text-anchor="middle" dominant-baseline="middle" x="343" y="148" style="opacity: 0;"></text><g clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074061-clip)" className="c3-regions" style="visibility: hidden;"></g><g clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074061-clip-grid)" className="c3-grid" style="visibility: hidden;"><g className="c3-xgrid-focus"><line className="c3-xgrid-focus" x1="-10" x2="-10" y1="0" y2="296" style="visibility: hidden;"></line></g></g><g clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074061-clip)" className="c3-chart"><g className="c3-stanford-elements"><g className="c3-stanford-lines" style="shape-rendering: geometricprecision;"></g><g className="c3-stanford-texts"></g><g className="c3-stanford-regions"></g></g><g className="c3-event-rects" style="fill-opacity: 0;"><rect className="c3-event-rect" x="0" y="0" width="686" height="296"></rect></g><g className="c3-chart-bars"><g className="c3-chart-bar c3-target c3-target-Google-Chrome" style="pointer-events: none;"><g className=" c3-shapes c3-shapes-Google-Chrome c3-bars c3-bars-Google-Chrome" style="cursor: pointer;"></g></g><g className="c3-chart-bar c3-target c3-target-Apple-Safari" style="pointer-events: none;"><g className=" c3-shapes c3-shapes-Apple-Safari c3-bars c3-bars-Apple-Safari" style="cursor: pointer;"></g></g><g className="c3-chart-bar c3-target c3-target-Microsoft-Edge" style="pointer-events: none;"><g className=" c3-shapes c3-shapes-Microsoft-Edge c3-bars c3-bars-Microsoft-Edge" style="cursor: pointer;"></g></g><g className="c3-chart-bar c3-target c3-target-Mozilla-Firefox" style="pointer-events: none;"><g className=" c3-shapes c3-shapes-Mozilla-Firefox c3-bars c3-bars-Mozilla-Firefox" style="cursor: pointer;"></g></g></g><g className="c3-chart-lines"><g className="c3-chart-line c3-target c3-target-Google-Chrome" style="opacity: 1; pointer-events: none;"><g className=" c3-shapes c3-shapes-Google-Chrome c3-lines c3-lines-Google-Chrome"></g><g className=" c3-shapes c3-shapes-Google-Chrome c3-areas c3-areas-Google-Chrome"></g><g className=" c3-selected-circles c3-selected-circles-Google-Chrome"></g><g className=" c3-shapes c3-shapes-Google-Chrome c3-circles c3-circles-Google-Chrome" style="cursor: pointer;"></g></g><g className="c3-chart-line c3-target c3-target-Apple-Safari" style="opacity: 1; pointer-events: none;"><g className=" c3-shapes c3-shapes-Apple-Safari c3-lines c3-lines-Apple-Safari"></g><g className=" c3-shapes c3-shapes-Apple-Safari c3-areas c3-areas-Apple-Safari"></g><g className=" c3-selected-circles c3-selected-circles-Apple-Safari"></g><g className=" c3-shapes c3-shapes-Apple-Safari c3-circles c3-circles-Apple-Safari" style="cursor: pointer;"></g></g><g className="c3-chart-line c3-target c3-target-Microsoft-Edge" style="opacity: 1; pointer-events: none;"><g className=" c3-shapes c3-shapes-Microsoft-Edge c3-lines c3-lines-Microsoft-Edge"></g><g className=" c3-shapes c3-shapes-Microsoft-Edge c3-areas c3-areas-Microsoft-Edge"></g><g className=" c3-selected-circles c3-selected-circles-Microsoft-Edge"></g><g className=" c3-shapes c3-shapes-Microsoft-Edge c3-circles c3-circles-Microsoft-Edge" style="cursor: pointer;"></g></g><g className="c3-chart-line c3-target c3-target-Mozilla-Firefox" style="opacity: 1; pointer-events: none;"><g className=" c3-shapes c3-shapes-Mozilla-Firefox c3-lines c3-lines-Mozilla-Firefox"></g><g className=" c3-shapes c3-shapes-Mozilla-Firefox c3-areas c3-areas-Mozilla-Firefox"></g><g className=" c3-selected-circles c3-selected-circles-Mozilla-Firefox"></g><g className=" c3-shapes c3-shapes-Mozilla-Firefox c3-circles c3-circles-Mozilla-Firefox" style="cursor: pointer;"></g></g></g><g className="c3-chart-arcs" transform="translate(343,143)"><text className="c3-chart-arcs-title" style="text-anchor: middle; opacity: 1;">Google Chrome</text><g className="c3-chart-arc c3-target c3-target-Google-Chrome"><g className=" c3-shapes c3-shapes-Google-Chrome c3-arcs c3-arcs-Google-Chrome"><path className=" c3-shape c3-shape c3-arc c3-arc-Google-Chrome" transform="" style="fill: rgb(31, 119, 180); cursor: pointer;" d="M8.318413383208396e-15,-135.85A135.85,135.85,0,0,1,106.21180689328185,84.70108958250894L63.7270841359691,50.82065374950536A81.50999999999999,81.50999999999999,0,0,0,4.991048029925038e-15,-81.50999999999999Z"></path></g><text dy=".35em" className="" transform="translate(97.91729656363493,-47.15448476729622)" style="opacity: 1; text-anchor: middle; pointer-events: none;">35.7%</text></g><g className="c3-chart-arc c3-target c3-target-Apple-Safari"><g className=" c3-shapes c3-shapes-Apple-Safari c3-arcs c3-arcs-Apple-Safari"><path className=" c3-shape c3-shape c3-arc c3-arc-Apple-Safari" transform="" style="fill: rgb(255, 127, 14); cursor: pointer;" d="M106.21180689328185,84.70108958250894A135.85,135.85,0,0,1,-106.21180689328185,84.70108958250896L-63.7270841359691,50.82065374950537A81.50999999999999,81.50999999999999,0,0,0,63.7270841359691,50.82065374950536Z"></path></g><text dy=".35em" className="" transform="translate(6.654730706566719e-15,108.68000000000002)" style="opacity: 1; text-anchor: middle; pointer-events: none;">28.6%</text></g><g className="c3-chart-arc c3-target c3-target-Microsoft-Edge"><g className=" c3-shapes c3-shapes-Microsoft-Edge c3-arcs c3-arcs-Microsoft-Edge"><path className=" c3-shape c3-shape c3-arc c3-arc-Microsoft-Edge" transform="" style="fill: rgb(44, 160, 44); cursor: pointer;" d="M-106.21180689328185,84.70108958250896A135.85,135.85,0,0,1,-106.21180689328186,-84.70108958250893L-63.727084135969115,-50.820653749505354A81.50999999999999,81.50999999999999,0,0,0,-63.7270841359691,50.82065374950537Z"></path></g><text dy=".35em" className="" transform="translate(-108.68000000000002,1.3309461413133437e-14)" style="opacity: 1; text-anchor: middle; pointer-events: none;">21.4%</text></g><g className="c3-chart-arc c3-target c3-target-Mozilla-Firefox"><g className=" c3-shapes c3-shapes-Mozilla-Firefox c3-arcs c3-arcs-Mozilla-Firefox"><path className=" c3-shape c3-shape c3-arc c3-arc-Mozilla-Firefox" transform="" style="fill: rgb(214, 39, 40); cursor: pointer;" d="M-106.21180689328186,-84.70108958250893A135.85,135.85,0,0,1,-2.4955240149625186e-14,-135.85L-1.497314408977511e-14,-81.50999999999999A81.50999999999999,81.50999999999999,0,0,0,-63.727084135969115,-50.820653749505354Z"></path></g><text dy=".35em" className="" transform="translate(-47.15448476729624,-97.91729656363492)" style="opacity: 1; text-anchor: middle; pointer-events: none;">14.3%</text></g></g><g className="c3-chart-texts"><g className="c3-chart-text c3-target c3-target-Google-Chrome" style="opacity: 1; pointer-events: none;"><g className=" c3-texts c3-texts-Google-Chrome"></g></g><g className="c3-chart-text c3-target c3-target-Apple-Safari" style="opacity: 1; pointer-events: none;"><g className=" c3-texts c3-texts-Apple-Safari"></g></g><g className="c3-chart-text c3-target c3-target-Microsoft-Edge" style="opacity: 1; pointer-events: none;"><g className=" c3-texts c3-texts-Microsoft-Edge"></g></g><g className="c3-chart-text c3-target c3-target-Mozilla-Firefox" style="opacity: 1; pointer-events: none;"><g className=" c3-texts c3-texts-Mozilla-Firefox"></g></g></g></g><g clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074061-clip-grid)" className="c3-grid c3-grid-lines"><g className="c3-xgrid-lines"></g><g className="c3-ygrid-lines"></g></g><g className="c3-axis c3-axis-x" clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074061-clip-xaxis)" transform="translate(0,296)" style="visibility: visible; opacity: 0;"><text className="c3-axis-x-label" transform="" style="text-anchor: end;" x="686" dx="-0.5em" dy="-0.5em"></text><g className="tick" transform="translate(343, 0)" style="opacity: 1;"><line x1="0" x2="0" y2="6"></line><text x="0" y="9" transform="" style="text-anchor: middle; display: block;"><tspan x="0" dy=".71em" dx="0">0</tspan></text></g><path className="domain" d="M0,6V0H686V6"></path></g><g className="c3-axis c3-axis-y" clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074061-clip-yaxis)" transform="translate(0,0)" style="visibility: visible; opacity: 0;"><text className="c3-axis-y-label" transform="rotate(-90)" style="text-anchor: end;" x="0" dx="-0.5em" dy="1.2em"></text><g className="tick" transform="translate(0,272)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">2</tspan></text></g><g className="tick" transform="translate(0,231)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">2.5</tspan></text></g><g className="tick" transform="translate(0,190)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">3</tspan></text></g><g className="tick" transform="translate(0,149)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">3.5</tspan></text></g><g className="tick" transform="translate(0,108)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">4</tspan></text></g><g className="tick" transform="translate(0,67)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">4.5</tspan></text></g><g className="tick" transform="translate(0,26)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">5</tspan></text></g><path className="domain" d="M-6,1H0V296H-6"></path></g><g className="c3-axis c3-axis-y2" transform="translate(686,0)" style="visibility: hidden; opacity: 0;"><text className="c3-axis-y2-label" transform="rotate(-90)" style="text-anchor: end;" x="0" dx="-0.5em" dy="-0.5em"></text><g className="tick" transform="translate(0,296)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0</tspan></text></g><g className="tick" transform="translate(0,267)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.1</tspan></text></g><g className="tick" transform="translate(0,237)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.2</tspan></text></g><g className="tick" transform="translate(0,208)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.3</tspan></text></g><g className="tick" transform="translate(0,178)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.4</tspan></text></g><g className="tick" transform="translate(0,149)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.5</tspan></text></g><g className="tick" transform="translate(0,119)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.6</tspan></text></g><g className="tick" transform="translate(0,90)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.7</tspan></text></g><g className="tick" transform="translate(0,60)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.8</tspan></text></g><g className="tick" transform="translate(0,31)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.9</tspan></text></g><g className="tick" transform="translate(0,1)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">1</tspan></text></g><path className="domain" d="M6,1H0V296H6"></path></g></g><g transform="translate(0,300)"><g className="c3-legend-item c3-legend-item-Google-Chrome" style="visibility: visible; cursor: pointer; opacity: 1;"><text x="160.9404411315918" y="9" style="pointer-events: none;">Google Chrome</text><rect className="c3-legend-item-event" x="146.9404411315918" y="-5" width="110.23516082763672" height="17.600000381469727" style="fill-opacity: 0;"></rect><line className="c3-legend-item-tile" x1="144.9404411315918" y1="4" x2="154.9404411315918" y2="4" stroke-width="10" style="stroke: rgb(31, 119, 180); pointer-events: none;"></line></g><g className="c3-legend-item c3-legend-item-Apple-Safari" style="visibility: visible; cursor: pointer; opacity: 1;"><text x="271.1756019592285" y="9" style="pointer-events: none;">Apple Safari</text><rect className="c3-legend-item-event" x="257.1756019592285" y="-5" width="91.17500305175781" height="17.600000381469727" style="fill-opacity: 0;"></rect><line className="c3-legend-item-tile" x1="255.17560195922852" y1="4" x2="265.1756019592285" y2="4" stroke-width="10" style="stroke: rgb(255, 127, 14); pointer-events: none;"></line></g><g className="c3-legend-item c3-legend-item-Microsoft-Edge" style="visibility: visible; cursor: pointer; opacity: 1;"><text x="362.3506050109863" y="9" style="pointer-events: none;">Microsoft Edge</text><rect className="c3-legend-item-event" x="348.3506050109863" y="-5" width="105.55937957763672" height="17.600000381469727" style="fill-opacity: 0;"></rect><line className="c3-legend-item-tile" x1="346.3506050109863" y1="4" x2="356.3506050109863" y2="4" stroke-width="10" style="stroke: rgb(44, 160, 44); pointer-events: none;"></line></g><g className="c3-legend-item c3-legend-item-Mozilla-Firefox" style="visibility: visible; cursor: pointer; opacity: 1;"><text x="467.90998458862305" y="9" style="pointer-events: none;">Mozilla Firefox</text><rect className="c3-legend-item-event" x="453.90998458862305" y="-5" width="92.7496109008789" height="17.600000381469727" style="fill-opacity: 0;"></rect><line className="c3-legend-item-tile" x1="451.90998458862305" y1="4" x2="461.90998458862305" y2="4" stroke-width="10" style="stroke: rgb(214, 39, 40); pointer-events: none;"></line></g></g><text className="c3-title" x="343" y="0"></text></svg><div className="c3-tooltip-container" style="position: absolute; pointer-events: none; display: none; top: 40.9px; left: 341.9px;"><table className="c3-tooltip"><tbody><tr className="c3-tooltip-name--Mozilla-Firefox"><td className="name"><span style="background-color:#d62728"></span>Mozilla Firefox</td><td className="value">14.3%</td></tr></tbody></table></div></div>
                                                                </div>
                                                            </div>
                                                        </div>    
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="panel">
                                                    <div className="panel-body">
                                                        <div className="panel-header bg-secondary text-white">
                                                            <h4 className="fw-bold text-white">作業系統</h4>
                                                        </div>
                                                        <div className="panel-ContentBox">
                                                            <div className="row align-items-center justify-content-center">
                                                                <div className="col-12">
                                                                    <div id="chart2" className="c3" style="max-height: 320px; position: relative;"><svg width="686" height="320" style="overflow: hidden;"><defs><clipPath id="c3-1751261074078-clip"><rect width="686" height="296"></rect></clipPath><clipPath id="c3-1751261074078-clip-xaxis"><rect x="-31" y="-20" width="748" height="40"></rect></clipPath><clipPath id="c3-1751261074078-clip-yaxis"><rect x="-29" y="-4" width="20" height="320"></rect></clipPath><clipPath id="c3-1751261074078-clip-grid"><rect width="686" height="296"></rect></clipPath><clipPath id="c3-1751261074078-clip-subchart"><rect width="686" height="0"></rect></clipPath></defs><g transform="translate(0.5,4.5)"><text className="c3-text c3-empty" text-anchor="middle" dominant-baseline="middle" x="343" y="148" style="opacity: 0;"></text><g clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074078-clip)" className="c3-regions" style="visibility: hidden;"></g><g clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074078-clip-grid)" className="c3-grid" style="visibility: hidden;"><g className="c3-xgrid-focus"><line className="c3-xgrid-focus" x1="-10" x2="-10" y1="0" y2="296" style="visibility: hidden;"></line></g></g><g clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074078-clip)" className="c3-chart"><g className="c3-stanford-elements"><g className="c3-stanford-lines" style="shape-rendering: geometricprecision;"></g><g className="c3-stanford-texts"></g><g className="c3-stanford-regions"></g></g><g className="c3-event-rects" style="fill-opacity: 0;"><rect className="c3-event-rect" x="0" y="0" width="686" height="296"></rect></g><g className="c3-chart-bars"><g className="c3-chart-bar c3-target c3-target-Windows" style="pointer-events: none;"><g className=" c3-shapes c3-shapes-Windows c3-bars c3-bars-Windows" style="cursor: pointer;"></g></g><g className="c3-chart-bar c3-target c3-target-Linux" style="pointer-events: none;"><g className=" c3-shapes c3-shapes-Linux c3-bars c3-bars-Linux" style="cursor: pointer;"></g></g><g className="c3-chart-bar c3-target c3-target-Mac" style="pointer-events: none;"><g className=" c3-shapes c3-shapes-Mac c3-bars c3-bars-Mac" style="cursor: pointer;"></g></g></g><g className="c3-chart-lines"><g className="c3-chart-line c3-target c3-target-Windows" style="opacity: 1; pointer-events: none;"><g className=" c3-shapes c3-shapes-Windows c3-lines c3-lines-Windows"></g><g className=" c3-shapes c3-shapes-Windows c3-areas c3-areas-Windows"></g><g className=" c3-selected-circles c3-selected-circles-Windows"></g><g className=" c3-shapes c3-shapes-Windows c3-circles c3-circles-Windows" style="cursor: pointer;"></g></g><g className="c3-chart-line c3-target c3-target-Linux" style="opacity: 1; pointer-events: none;"><g className=" c3-shapes c3-shapes-Linux c3-lines c3-lines-Linux"></g><g className=" c3-shapes c3-shapes-Linux c3-areas c3-areas-Linux"></g><g className=" c3-selected-circles c3-selected-circles-Linux"></g><g className=" c3-shapes c3-shapes-Linux c3-circles c3-circles-Linux" style="cursor: pointer;"></g></g><g className="c3-chart-line c3-target c3-target-Mac" style="opacity: 1; pointer-events: none;"><g className=" c3-shapes c3-shapes-Mac c3-lines c3-lines-Mac"></g><g className=" c3-shapes c3-shapes-Mac c3-areas c3-areas-Mac"></g><g className=" c3-selected-circles c3-selected-circles-Mac"></g><g className=" c3-shapes c3-shapes-Mac c3-circles c3-circles-Mac" style="cursor: pointer;"></g></g></g><g className="c3-chart-arcs" transform="translate(343,143)"><text className="c3-chart-arcs-title" style="text-anchor: middle; opacity: 1;">WinNT</text><g className="c3-chart-arc c3-target c3-target-Windows"><g className=" c3-shapes c3-shapes-Windows c3-arcs c3-arcs-Windows"><path className=" c3-shape c3-shape c3-arc c3-arc-Windows" transform="" style="fill: rgb(31, 119, 180); cursor: pointer;" d="M8.318413383208396e-15,-135.85A135.85,135.85,0,0,1,67.92500000000004,117.64955110411596L40.755000000000024,70.58973066246958A81.50999999999999,81.50999999999999,0,0,0,4.991048029925038e-15,-81.50999999999999Z"></path></g><text dy=".35em" className="" transform="translate(104.97681880109596,-28.128453821741978)" style="opacity: 1; text-anchor: middle; pointer-events: none;">41.7%</text></g><g className="c3-chart-arc c3-target c3-target-Linux"><g className=" c3-shapes c3-shapes-Linux c3-arcs c3-arcs-Linux"><path className=" c3-shape c3-shape c3-arc c3-arc-Linux" transform="" style="fill: rgb(255, 127, 14); cursor: pointer;" d="M67.92500000000004,117.64955110411596A135.85,135.85,0,0,1,-135.85,1.6636826766416793e-14L-81.50999999999999,9.982096059850076e-15A81.50999999999999,81.50999999999999,0,0,0,40.755000000000024,70.58973066246958Z"></path></g><text dy=".35em" className="" transform="translate(-54.33999999999999,94.1196408832928)" style="opacity: 1; text-anchor: middle; pointer-events: none;">33.3%</text></g><g className="c3-chart-arc c3-target c3-target-Mac"><g className=" c3-shapes c3-shapes-Mac c3-arcs c3-arcs-Mac"><path className=" c3-shape c3-shape c3-arc c3-arc-Mac" transform="" style="fill: rgb(44, 160, 44); cursor: pointer;" d="M-135.85,1.6636826766416793e-14A135.85,135.85,0,0,1,-2.4955240149625186e-14,-135.85L-1.497314408977511e-14,-81.50999999999999A81.50999999999999,81.50999999999999,0,0,0,-81.50999999999999,9.982096059850076e-15Z"></path></g><text dy=".35em" className="" transform="translate(-76.848364979354,-76.84836497935397)" style="opacity: 1; text-anchor: middle; pointer-events: none;">25.0%</text></g></g><g className="c3-chart-texts"><g className="c3-chart-text c3-target c3-target-Windows  " style="opacity: 1; pointer-events: none;"><g className=" c3-texts c3-texts-Windows"></g></g><g className="c3-chart-text c3-target c3-target-Linux  " style="opacity: 1; pointer-events: none;"><g className=" c3-texts c3-texts-Linux"></g></g><g className="c3-chart-text c3-target c3-target-Mac  " style="opacity: 1; pointer-events: none;"><g className=" c3-texts c3-texts-Mac"></g></g></g></g><g clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074078-clip-grid)" className="c3-grid c3-grid-lines"><g className="c3-xgrid-lines"></g><g className="c3-ygrid-lines"></g></g><g className="c3-axis c3-axis-x" clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074078-clip-xaxis)" transform="translate(0,296)" style="visibility: visible; opacity: 0;"><text className="c3-axis-x-label" transform="" style="text-anchor: end;" x="686" dx="-0.5em" dy="-0.5em"></text><g className="tick" transform="translate(343, 0)" style="opacity: 1;"><line x1="0" x2="0" y2="6"></line><text x="0" y="9" transform="" style="text-anchor: middle; display: block;"><tspan x="0" dy=".71em" dx="0">0</tspan></text></g><path className="domain" d="M0,6V0H686V6"></path></g><g className="c3-axis c3-axis-y" clip-path="url(file:///C:/Users/IT-013/Desktop/1810Back_stage/A_01_System_status%E7%B3%BB%E7%B5%B1%E7%8B%80%E6%85%8B.html#c3-1751261074078-clip-yaxis)" transform="translate(0,0)" style="visibility: visible; opacity: 0;"><text className="c3-axis-y-label" transform="rotate(-90)" style="text-anchor: end;" x="0" dx="-0.5em" dy="1.2em"></text><g className="tick" transform="translate(0,296)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">2.8</tspan></text></g><g className="tick" transform="translate(0,272)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">3</tspan></text></g><g className="tick" transform="translate(0,247)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">3.2</tspan></text></g><g className="tick" transform="translate(0,223)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">3.4</tspan></text></g><g className="tick" transform="translate(0,198)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">3.6</tspan></text></g><g className="tick" transform="translate(0,174)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">3.8</tspan></text></g><g className="tick" transform="translate(0,149)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">4</tspan></text></g><g className="tick" transform="translate(0,124)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">4.2</tspan></text></g><g className="tick" transform="translate(0,100)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">4.4</tspan></text></g><g className="tick" transform="translate(0,75)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">4.6</tspan></text></g><g className="tick" transform="translate(0,51)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">4.8</tspan></text></g><g className="tick" transform="translate(0,26)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">5</tspan></text></g><g className="tick" transform="translate(0,1)" style="opacity: 1;"><line x2="-6"></line><text x="-9" y="0" style="text-anchor: end;"><tspan x="-9" dy="3">5.2</tspan></text></g><path className="domain" d="M-6,1H0V296H-6"></path></g><g className="c3-axis c3-axis-y2" transform="translate(686,0)" style="visibility: hidden; opacity: 0;"><text className="c3-axis-y2-label" transform="rotate(-90)" style="text-anchor: end;" x="0" dx="-0.5em" dy="-0.5em"></text><g className="tick" transform="translate(0,296)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0</tspan></text></g><g className="tick" transform="translate(0,267)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.1</tspan></text></g><g className="tick" transform="translate(0,237)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.2</tspan></text></g><g className="tick" transform="translate(0,208)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.3</tspan></text></g><g className="tick" transform="translate(0,178)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.4</tspan></text></g><g className="tick" transform="translate(0,149)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.5</tspan></text></g><g className="tick" transform="translate(0,119)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.6</tspan></text></g><g className="tick" transform="translate(0,90)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.7</tspan></text></g><g className="tick" transform="translate(0,60)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.8</tspan></text></g><g className="tick" transform="translate(0,31)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">0.9</tspan></text></g><g className="tick" transform="translate(0,1)" style="opacity: 1;"><line x2="6"></line><text x="9" y="0" style="text-anchor: start;"><tspan x="9" dy="3">1</tspan></text></g><path className="domain" d="M6,1H0V296H6"></path></g></g><g transform="translate(0,300)"><g className="c3-legend-item c3-legend-item-Windows" style="visibility: visible; cursor: pointer;"><text x="273.4814453125" y="9" style="pointer-events: none;">Windows</text><rect className="c3-legend-item-event" x="259.4814453125" y="-5" width="74.87968826293945" height="17.600000381469727" style="fill-opacity: 0;"></rect><line className="c3-legend-item-tile" x1="257.4814453125" y1="4" x2="267.4814453125" y2="4" stroke-width="10" style="stroke: rgb(31, 119, 180); pointer-events: none;"></line></g><g className="c3-legend-item c3-legend-item-Linux" style="visibility: visible; cursor: pointer;"><text x="348.36113357543945" y="9" style="pointer-events: none;">Linux</text><rect className="c3-legend-item-event" x="334.36113357543945" y="-5" width="54.08749961853027" height="17.600000381469727" style="fill-opacity: 0;"></rect><line className="c3-legend-item-tile" x1="332.36113357543945" y1="4" x2="342.36113357543945" y2="4" stroke-width="10" style="stroke: rgb(255, 127, 14); pointer-events: none;"></line></g><g className="c3-legend-item c3-legend-item-Mac" style="visibility: visible; cursor: pointer;"><text x="402.4486331939697" y="9" style="pointer-events: none;">Mac</text><rect className="c3-legend-item-event" x="388.4486331939697" y="-5" width="38.06992149353027" height="17.600000381469727" style="fill-opacity: 0;"></rect><line className="c3-legend-item-tile" x1="386.4486331939697" y1="4" x2="396.4486331939697" y2="4" stroke-width="10" style="stroke: rgb(44, 160, 44); pointer-events: none;"></line></g></g><text className="c3-title" x="343" y="0"></text></svg><div className="c3-tooltip-container" style="position: absolute; pointer-events: none; display: none;"></div></div>
                                                                </div>
                                                            </div>
                                                        </div>    
                                                    </div>
                                                </div>
                                            </div>

                                            <script type="text/javascript">
                                                // 第一組 //
                                                var chart = c3.generate({
                                                    bindto: '#chart1',
                                                    data: {
                                                        columns: [
                                                            ["Google Chrome", 5], //瀏覽次數 1.2.3.4.5....數量值
                                                            ["Apple Safari", 4],
                                                            ["Microsoft Edge", 3],
                                                            ["Mozilla Firefox", 2],
                                                        ],
                                                        type : 'donut',
                                                        onclick: function (d, i) { console.log("onclick", d, i); },
                                                        onmouseover: function (d, i) { console.log("onmouseover", d, i); },
                                                        onmouseout: function (d, i) { console.log("onmouseout", d, i); }
                                                    },
                                                    donut: {
                                                        title: "Google Chrome"
                                                    }
                                                });

                                                // 第二組 //
                                                var chart = c3.generate({
                                                    bindto: '#chart2',
                                                    data: {
                                                        columns: [
                                                            ["Windows", 5], //瀏覽次數 1.2.3.4.5....數量值
                                                            ["Linux", 4],
                                                            ["Mac", 3],
                                                        ],
                                                        type : 'donut',
                                                        onclick: function (d, i) { console.log("onclick", d, i); },
                                                        onmouseover: function (d, i) { console.log("onmouseover", d, i); },
                                                        onmouseout: function (d, i) { console.log("onmouseout", d, i); }
                                                    },
                                                    donut: {
                                                        title: "WinNT"
                                                    }
                                                });

                                                setTimeout(function () {
                                                    chart.unload({
                                                        ids: 'data1'
                                                    });
                                                    chart.unload({
                                                        ids: 'data2'
                                                    });
                                                }, 2500);
                                            </script>
                                        </div>   
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>                            
                </div>
            </div>
        </div>
    )
}

const SystemInfoComp = ()=>{
    return(
        <>
        <ServerInfo></ServerInfo>
        {/* <ClientUseInfo></ClientUseInfo> */}
        </>
    )
}

export default SystemInfoComp;