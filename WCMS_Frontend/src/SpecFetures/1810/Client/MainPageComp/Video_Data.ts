/* 抓取最新消息(Latest News) */
export interface NewsData {
  Id: string; 
  Title:string
  Url:string; 
}


export function mock_NewsData(): NewsData[] {
  return [
    {Id: '0001', Title:"地方創生藝術共榮 記憶畫像", Url:"https://www.youtube.com/embed/pkIHsOtB17M?si=NW8ZkYG2A7ozGkrN"},
    {Id: '0001', Title:"2023臺藝大校園簡介3分鐘版", Url:"https://www.youtube.com/embed/mJARRF5n3cI?si=gjl1Vs2VeJuIYSgx"},
    {Id: '0001', Title:"「美大臺藝 國際學府」— 2021國立臺灣藝術大學簡介影片", Url:"https://www.youtube.com/embed/Hw0Yf3TDaFQ?si=RfGueYmlVFcK6cKq"},
    {Id: '0001', Title:"文化平權活動成果花絮", Url:"https://www.youtube.com/embed/34mOZuTq6Ps?si=gssaLSJ2YSDnb0qm"},
  ];
}