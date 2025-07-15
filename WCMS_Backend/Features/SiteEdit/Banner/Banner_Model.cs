using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.Banner
{
    [LibDesc]
    public class BannerSet
    {
        [LibDesc]
        public Banner Banner { get; set; }
        public List<BannerDetail> BannerDetail { get; set; }
        public List<BannerDetailInfo> BannerDetailInfo { get; set; }
    }

    public class Banner: MasterDataModel
    {
        /// <summary>
        /// 橫幅ID
        /// </summary>
        [Key]
        public string BannerId { get; set; }
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
    public class BannerDetail:DetailRowModel
    {
        [Key]
        public string BannerId { get;set; }
        [Key]
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
    public class BannerDetailInfo : DetailRowModel
    {
        [Key]
        public string BannerId { get; set; }
        [Key]
        public int ParentRowId { get; set; }
        [Key]
        public int RowId { get; set; }

        public string Lang { get; set; }

        public string Title { get; set; }

        public string Content { get; set; }
    }
}
