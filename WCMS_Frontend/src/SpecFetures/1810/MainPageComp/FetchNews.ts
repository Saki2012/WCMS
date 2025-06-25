/* 抓取最新消息(Latest News) */
export interface NewsData {
  Id: string; 
  CategoryName:string; //分類名稱
  Url:string; //分類連結
  Details:NewsDetailData[]
}

export interface NewsDetailData {
  RowId: string;
  Title:string; //標題
  Url:string;
  CreateDate:Date;
  SysLabel:string //最新/熱門...等系統標籤
  Category:string //類別
  Tags:string //標籤
}

export async function fetchNewsData(userId: number): Promise<NewsData> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
  if (!res.ok) throw new Error('API request failed');
  const data = await res.json();
  return data as NewsData;
}

export function mock_NewsData(): NewsData[] {
  return [
    {Id: '0001', CategoryName:"最新公告", Url:"",
        Details:[{RowId: '1',Title: "國科會與匈牙利科學院(NSTC-HAS)共同徵求2026-2027年度雙邊合作研究人員交流互訪計畫，自即日起受理申請，校內截止日至114年9月21日止，欲申請之教師，詳情請參閱以下說明。", Url:"" , CreateDate:new Date(2025,0,24), SysLabel:"最新" , Category:"計畫徵件-國科會計畫", Tags:"學術發展組"},
                 {RowId: '2',Title: "【神社共學 X USR行動】創作獎勵計畫審查通過名單公告", Url:"" , CreateDate:new Date(2025,0,23), SysLabel:"最新" , Category:"計畫徵件-校內計畫", Tags:"大學社會責任實踐計畫推動辦公室"},
                 {RowId: '3',Title: "2025長庚大學【青年老闆築夢計畫】校際盃創新創業競賽獲獎名單", Url:"" , CreateDate:new Date(2025,0,23), SysLabel:"最新" , Category:"獲獎公告", Tags:""},
                 {RowId: '4',Title: "113學年度優秀學位論文與創作獎遴選作業開跑囉！", Url:"" , CreateDate:new Date(2025,0,20), SysLabel:"最新" , Category:"計畫徵件-校內計畫", Tags:"學術發展組"},
                 {RowId: '5',Title: "國科會115年度族群研究與原住民族研究計畫案，自即日起至114年7月31日中午12:00止受理申請，逾期恕不予受理。", Url:"" , CreateDate:new Date(2025,0,18), SysLabel:"最新" , Category:"計畫徵件-國科會計畫", Tags:"學術發展組"},
                 {RowId: '6',Title: "月 12 國科會114年度傑出研究獎申請案，自即日起受理申請，校內截止日至114年7月30日止，逾期恕不予受理。", Url:"" , CreateDate:new Date(2025,0,12), SysLabel:"" , Category:"計畫徵件-國科會計畫", Tags:"學術發展組"},
                ]
    },
    {Id: '0002', CategoryName:"法規公告", Url:"", 
        Details:[{RowId: '1',Title: "修正本校「教師及參與研究計畫人員學術倫理教育實施要點」、「運用自籌經費辦理活動暨展演酬勞支用要點」、「論文發表於國際期刊及出席國際交流活動國家名稱訛誤事件處理要點」、「學術專題研究補助實施要點」及「辦理國科會補助大專校院研究獎勵支給要點」，並自111年12月30日生效。", Url:"" , CreateDate:new Date(2025,0,4), SysLabel:"" , Category:"法規公告", Tags:"學術發展組"},
                 {RowId: '2',Title: "修正本校專題研究計畫兼任助理費用支給標準表", Url:"" , CreateDate:new Date(2024,8,14), SysLabel:"" , Category:"法規公告", Tags:"學術發展組"},
                 {RowId: '3',Title: "修正本校專題研究計畫研究人力工作酬金暨博士後研究員教學研究費用表", Url:"" , CreateDate:new Date(2024,4,30), SysLabel:"" , Category:"法規公告", Tags:"學術發展組"},
                 {RowId: '4',Title: "教育部「教育部補助大專校院STEM領域及女性研發人才培育計畫要點」", Url:"" , CreateDate:new Date(2024,5,9), SysLabel:"" , Category:"法規公告", Tags:"學術發展組"},
                 {RowId: '5',Title: "修正「科技部補助博士生赴國外研究作業要點」", Url:"" , CreateDate:new Date(2024,4,25), SysLabel:"" , Category:"法規公告", Tags:"學術發展組"},
                 {RowId: '6',Title: "修正「科技部補助專題研究計畫作業要點」第十點", Url:"" , CreateDate:new Date(2024,4,11), SysLabel:"" , Category:"法規公告", Tags:"學術發展組"},
                ]
    }
  ];
}