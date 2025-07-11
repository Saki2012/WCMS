using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.SpecFeatures.T1810.SiteEdit.Research
{
    public class SpecResearchSet
    {
        public SpecResearch MasterData { get; set; }
        public List<SpecResearchDetail> Details { get; set; }
    }

    public class SpecResearch : MasterDataModel
    {
        /// <summary>
        /// 橫幅ID
        /// </summary>
        [Key]
        public string ResearchId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        public string CategoryId { get; set; }
        /// <summary>
        /// 轉換間隔
        /// </summary>
        public short Interval { get; set; }
        /// <summary>
        /// 轉換速度
        /// </summary>
        public short Speed { get; set; }
        /// <summary>
        /// 橫幅高度
        /// </summary>
        public short Height { get; set; }
        /// <summary>
        /// 橫幅寬度
        /// </summary>
        public short Width { get; set; }
        /// <summary>
        /// 橫幅效果
        /// </summary>
        public byte Effect { get; set; }
    }

    public class SpecResearchDetail : DetailRowModel
    {
        [Key]
        public string ResearchId { get;set; }

        public int RowId { get; set; }
        /// <summary>
        /// 圖片來源取檔案關聯
        /// </summary>
        public string PicSrcId { get; set; }
        /// <summary>
        /// 字體顏色
        /// </summary>
        public byte FontColor { get; set; }
        /// <summary>
        /// 資料有效日期-起
        /// </summary>
        [LibDesc("有效日期-起")]
        public DateTime Validate_Start { get; set; }
        /// <summary>
        /// 資料有效日期-迄
        /// </summary>
        [LibDesc("有效日期-迄")]
        public DateTime Validate_End { get; set; }
        /// <summary>
        /// 網址開啟方式
        /// </summary>
        public byte URL_Open { get; set; }
        /// <summary>
        /// 播放順序
        /// </summary>
        public ushort Sort { get; set; }
    }

}
