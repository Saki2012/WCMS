/*站台資訊
e.x.:
瀏覽人數:0000000004     更新日期:2025/06/20
*/

export interface SiteInfoItem {
    Visitors: number; // 瀏覽人數
    UpdateDate: Date; //更新日期
};

export interface FieldDisplayName {
    FieldId:string;
    DisplayName:string;
}



export default function getSiteInfoData(): [SiteInfoItem,FieldDisplayName[]] {
  return [
    {
      Visitors:10,
      UpdateDate:new Date(2025,5,27)
    },
    [
      {
        FieldId:"Visitors",
        DisplayName:"瀏覽人數"
      },
      {
        FieldId:"UpdateDate",
        DisplayName:"更新日期"
      },
    ]
  ];
}

export function mock_SiteInfoData(): [SiteInfoItem,FieldDisplayName[]] {
  return [
    {
      Visitors:10,
      UpdateDate:new Date(2025,5,27)
    },
    [
      {
        FieldId:"Visitors",
        DisplayName:"瀏覽人數"
      },
      {
        FieldId:"UpdateDate",
        DisplayName:"更新日期"
      },
    ]
  ];
}
