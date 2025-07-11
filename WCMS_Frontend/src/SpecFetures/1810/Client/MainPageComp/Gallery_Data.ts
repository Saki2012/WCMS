/* 抓取活動花絮 (Gallery Information) */
export interface GalleryData {
  Id: string;
  Title:string; //標題
  ImgSrc:string; //圖片來源
  Url:string; //連結
  Tags:string; 
  Date:Date;
}

export function mock_GalleryDatas(): GalleryData[] {
  return [
    {Id:"0001", Title:"臺藝大與清華大學簽署教育聯盟與學生交流協議", ImgSrc:"/Legacy/File/Image/Album/30/臺藝大與清華大學簽署教育聯盟與學生交流協議04.jpg", Url:"", Tags:"臺灣文化政策智庫中心", Date:new Date(2018,9,25)},
    {Id:"0002", Title:"匯聚亞洲文化中介組織的新合作介面", ImgSrc:"/Legacy/File/Image/Album/29/匯聚亞洲文化中介組織的新合作介面01.png", Url:"", Tags:"學術發展組", Date:new Date(2018,9,25)},
    {Id:"0003", Title:"科技部專題計畫諮詢工作坊", ImgSrc:"/Legacy/File/Image/Album/28/科技部專題計畫諮詢工作cover.jpg", Url:"", Tags:"學術發展組", Date:new Date(2018,9,25)},
    {Id:"0004", Title:"科技部專題計畫諮詢工作坊", ImgSrc:"/Legacy/File/Image/Album/27/科技部專題計畫諮詢工作坊03.jpg", Url:"", Tags:"學術發展組", Date:new Date(2018,9,25)},
    {Id:"0005", Title:"科技部專題計畫申請及執行秘訣講座", ImgSrc:"/Legacy/File/Image/Album/26/科技部專題計畫申請及執行秘訣講座01.jpg", Url:"", Tags:"學術發展組", Date:new Date(2018,9,25)},
    {Id:"0006", Title:"以科技點亮藝術─演算藝術與音像表演", ImgSrc:"/Legacy/File/Image/Album/25/以科技點亮藝術─演算藝術與音像表演04.jpg", Url:"", Tags:"學術發展組", Date:new Date(2020,9,26)}
  ];
}