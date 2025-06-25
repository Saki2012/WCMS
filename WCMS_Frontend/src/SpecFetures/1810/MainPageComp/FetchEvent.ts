/* 抓取活動資訊 (Event Information) */
export interface EventData {
  Id: string;
  Title:string; //標題
  ImgSrc:string; //圖片來源
  Url:string; //連結
  Tags:string; //
}

// export async function fetchEventData(userId: number): Promise<EventData> {
//   const res :  await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
//   if (!res.ok) throw new Error('API request failed');
//   const data :  await res.json();
//   return data as EventData;
// }

export function mock_EventDatas(): EventData[] {
  return [
    {Id: '0001', Title: '臺藝大研發處推動「地方創生˙藝術共榮」計畫，媒合書畫系攜手板橋榮民之家舉辦「記憶畫像」活動，實踐藝術關懷與世代交流', ImgSrc: '/Legacy/Images/event/Event_01_940x1330.jpg', Url: '/Front/Template/News.aspx?id: zTq4pS6u2k8: &amp;Sn: 255', Tags: '' },
    {Id: '0002', Title: '【演講訊息】4月25日(五)中午12時「藝術學研行遠講座-- 學術倫理與研究倫理：法令規範與生成式AI問世之後」專題講座，歡迎全校師生同仁一同參與。', ImgSrc: '/Legacy/File/News/68-61-E0-20-9F-3B-04-30-BD-0F-D5-27-5A-2D-6B-A8.png', Url: '/Front/Template/News.aspx?id=zTq4pS6u2k8=&amp;Sn=231', Tags: '學術發展組' },
    {Id: '0003', Title: '1140402更新 研究倫理活動專區', ImgSrc: '/Legacy/Images/event/Event_01_940x1330.jpg', Url: '/Front/Template/News.aspx?id=zTq4pS6u2k8=&amp;Sn=254', Tags: '' },
    {Id: '0004', Title: '【USR培力講座】從大學走進地方，USR共創的實踐路徑｜4/17(四)12:10｜歡迎報名！', ImgSrc: '/Legacy/File/News/B7-47-B6-FD-8B-0C-2F-4A-37-5D-BB-D7-9E-73-FD-AF.jpg', Url: '/Front/Template/News.aspx?id=zTq4pS6u2k8=&amp;Sn=252', Tags: '' },
    {Id: '0005', Title: '【USR培力講座】國立臺北大學海山學USR計畫的實踐與推動經驗｜3/13(四)12:10｜歡迎報名！', ImgSrc: '/Legacy/File/News/DC-E6-23-27-C5-96-D9-56-49-C8-36-A1-3D-98-CD-36.jpg', Url: '/Front/Template/News.aspx?id=zTq4pS6u2k8=&amp;Sn=250', Tags: '大學社會責任實踐計畫推動辦公室' },
    {Id: '0006', Title: '中原大學：「學術倫理系列講座—談代寫、抄襲、重複發表的學倫問題」', ImgSrc: '/Legacy/File/News/68-4F-25-83-57-AC-FB-A1-4A-B7-FA-5C-FC-68-68-D8.jpg', Url: '/Front/Template/News.aspx?id=zTq4pS6u2k8=&amp;Sn=117', Tags: '學術發展組' },
  ];
}