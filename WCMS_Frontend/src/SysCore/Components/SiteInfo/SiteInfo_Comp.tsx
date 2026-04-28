/*站台資訊
e.x.:
瀏覽人數:0000000004     更新日期:2025/06/20
*/
import type { FieldDisplayName, SiteInfoItem } from "./SiteInfo_Data";

interface Props
{
    items: SiteInfoItem[];
    displays: FieldDisplayName[];
}

function getFieldName(FieldId: string, map: FieldDisplayName[]): string
{
    const match = map.find((f) => f.FieldId === FieldId);
    return match ? match.DisplayName : FieldId;
}

function SiteInfoComp({ displayNameMap, infoData }: { displayNameMap: FieldDisplayName[]; infoData: SiteInfoItem; })
{
    return (
        <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
            <div className="info_contact">
                <div className="dbox">
                    <p>{getFieldName("Visitors", displayNameMap)} : {String(infoData.Visitors).padStart(9, "0")}</p>
                    <p className="px-2">|</p>
                    <p>{getFieldName("UpdateDate", displayNameMap)} : {infoData.UpdateDate.toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}

export default function SiteInfo({ items, displays }: Props)
{
    return <>{items.map((item, idx) => <SiteInfoComp key={idx} displayNameMap={displays} infoData={item} />)}</>;
}
