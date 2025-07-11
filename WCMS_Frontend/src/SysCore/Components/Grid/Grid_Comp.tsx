import { Routes,Route } from "react-router-dom"









const ColRender = () =>{
    return (
        <thead>
                <tr className="tr-only-hide-titlebar">
                <th style={{ whiteSpace: 'nowrap' }} >{"param: lbl_startdate"}</th>
                <th>{"param: lbl_title"}</th>
                <th style={{ whiteSpace: 'nowrap' }} >{"param: lbl_visitor_count"}</th>
                </tr>
        </thead>
    )
}

const RowRender = () =>{
    return (
        <tbody>
            <tr>
                <td className="table_td_vertical_align" data-th="{param: lbl_startdate}" style={{ whiteSpace: 'nowrap' }} >2025-06-26</td>
                <td className="table_td_vertical_align" data-th="{param: lbl_title}">
                    <a href="?Sn=101" tabIndex={1} title="公告一">公告一</a>
                    <span  className="label label-danger">{"param: lbl_hot"}</span>
                    <span  className="label label-success">{"param: lbl_top"}</span>
                    <span  className="label label-warning">{"param: lbl_new"}</span>
                </td>
                <td className="table_td_vertical_align" data-th="{param: lbl_visitor_count}" style={{ whiteSpace: 'nowrap' }} >123</td>
            </tr>
        </tbody>
    )
}

const GridDetailRender = () => {
    return (
        <table className="table table-striped table-bordered table-hover table-rwd">
            <ColRender></ColRender>
            <RowRender></RowRender>
        </table>
    )
}
const PaginationRender = () =>{
    return (
        <ul className="pagination">
            <li className="paginate_button">
                <a href="/Front/Allnews/All-announcement/News.aspx?id=i3kqobGUgUc=&amp;page=1" title="第一頁">
                    <i className="fa icon_stop-angle-left" aria-hidden="true">
                        <span className="sr-only">第一頁</span>
                    </i>
                </a>
            </li>
            <li className="paginate_button disabled"><a href="#" title="上一頁">
                    <i className="fa icon_angle-left" aria-hidden="true"><span className="sr-only">上一頁</span>
                    </i>
                </a></li>
            <li className="paginate_button active"><a href="#">1</a></li>
            <li className="paginate_button"><a href="/Front/Allnews/All-announcement/News.aspx?id=i3kqobGUgUc=&amp;page=2" title="2">2</a></li>
            <li className="paginate_button"><a href="/Front/Allnews/All-announcement/News.aspx?id=i3kqobGUgUc=&amp;page=3" title="3">3</a></li>
            <li className="paginate_button"><a href="/Front/Allnews/All-announcement/News.aspx?id=i3kqobGUgUc=&amp;page=4" title="4">4</a></li>

            <li className="paginate_button">
                <a href="/Front/Allnews/All-announcement/News.aspx?id=i3kqobGUgUc=&amp;page=2" title="下一頁">
                    <i className="fa icon_angle-right" aria-hidden="true">
                        <span className="sr-only">下一頁</span>
                    </i>
                </a>
            </li>
            <li className="paginate_button"><a href="/Front/Allnews/All-announcement/News.aspx?id=i3kqobGUgUc=&amp;page=23" title="最後頁"><i className="fa icon_stop-angle-right" aria-hidden="true"><span className="sr-only">最後頁</span></i></a></li>
        </ul>
    )
}

const GridComp = () => {
    return (
        <>
        <GridDetailRender></GridDetailRender>
        <PaginationRender></PaginationRender>
        </>
    )

}

export default GridComp

