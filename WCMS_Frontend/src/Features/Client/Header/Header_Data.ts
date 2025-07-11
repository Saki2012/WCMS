/* 抓取最新消息(Latest News) */
export interface HeaderData {
  Title:string
  SrcImg:string
  SubSrcImg:string
}


export function mock_HeaderData(): HeaderData {
  return (
    {Title:"國立臺灣藝術大學_研究發展處 LOGO", SrcImg:"/Legacy/Images/logo/logo_450x80.svg", SubSrcImg:"/Legacy/Images/logo/logo_M320_191x60.svg"}
);}