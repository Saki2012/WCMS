/*站台資訊
e.x.:
瀏覽人數:0000000004     更新日期:2025/06/20
*/

export type SiteInfoItem = {
    Visitors: number; // 瀏覽人數
    UpdateDate: string; //更新日期
};

export type FieldDisplayName={
    FieldId:string;
    Name:string;
}

function getFieldName(FieldId: string, map: FieldDisplayName[]): string {
  const match = map.find((f) => f.FieldId === FieldId);
  return match ? match.Name : FieldId;
}


interface Props {
  items: SiteInfoItem[];
  displays: FieldDisplayName[];
}

export default function SiteInfo({ items, displays}: Props) {
  return (
    <ul className="">
      {items.map((item) => (
        <SiteInfoComp 
        displayNameMap={displays}
        infoData={item}
        />
      ))}
    </ul>
  );
}

function SiteInfoComp({ displayNameMap, infoData }: { displayNameMap: FieldDisplayName[];infoData: SiteInfoItem}) {
  return (
    <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 col-12">
        <div className="info_contact">
            <div className="dbox">
                <p>{getFieldName("Visitors", displayNameMap)} : {String(infoData.Visitors).padStart(9, "0")}</p>
                <p className="px-2"> | </p>
                <p>{getFieldName("Updated", displayNameMap)} : {infoData.UpdateDate}</p>
            </div>
        </div>
    </div>
  );
}

