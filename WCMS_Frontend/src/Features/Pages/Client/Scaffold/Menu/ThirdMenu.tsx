import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data"
import { Link } from "react-router-dom"


export const ThirdMenuComp = (prop: { item: MenuItemData[] }) => {
    return (
        <>
            {prop.item && (
                <div id="ContentPlaceContent_ContentThirdMenu" className="col-sm-12 col-12 px-0 page-righttopmenu">
                    <div className="row">
                        <ul className="third-list-group">
                            {prop.item.map((i, idx) => (
                                <>
                                    <li key={idx}><Link className="list-group-item" to={i.Url} title={i.SrcData}>{i.SrcData}</Link></li>
                                </>
                            ))}
                        </ul>
                    </div>
                </div>

            )}
        </>
    )

}