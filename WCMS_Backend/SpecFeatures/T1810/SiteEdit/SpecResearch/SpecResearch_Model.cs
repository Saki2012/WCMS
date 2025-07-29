using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch
{
    public class SpecResearchSet
    {
        public SpecResearchModel SpecResearch { get; set; } = new();
        public List<SpecResearchDetailModel> SpecResearchDetail { get; set; } = [];
    }

    public class SpecResearchModel : MasterDataModel
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
        

    }

    public class SpecResearchDetailModel : DetailRowModel
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
        [LibDesc]
        public DateTime Validate_Start { get; set; }
        /// <summary>
        /// 資料有效日期-迄
        /// </summary>
        [LibDesc]
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
