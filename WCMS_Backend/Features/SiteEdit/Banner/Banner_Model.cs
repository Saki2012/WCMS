using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.Banner
{
    [LibDesc]
    public class BannerSet
    {
        [LibDesc] public Banner Banner { get; set; } = new Banner();
        [LibDesc] public List<BannerDetail> BannerDetail { get; set; } = [];
        [LibDesc] public List<BannerDetailInfo> BannerDetailInfo { get; set; } = [];
    }
    public class Banner: MasterDataModel
    {
        /// <summary>
        /// 橫幅ID
        /// </summary>
        [LibDesc, Key] public string BannerId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        public string BannerCategoryName { get; set; }
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
        public string Effect { get; set; }
    }
    public class BannerDetail:DetailRowModel
    {
        /// <summary>
        /// 
        /// </summary>
        [LibDesc, Key] public string BannerId { get;set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 圖片來源取檔案關聯
        /// </summary>
        [LibDesc] public string PicSrcId { get; set; }
        /// <summary>
        /// 字體顏色
        /// </summary>
        [LibDesc] public string FontColor { get; set; }
        /// <summary>
        /// 資料有效日期-起
        /// </summary>
        [LibDesc] public DateTime Validate_Start { get; set; }
        /// <summary>
        /// 資料有效日期-迄
        /// </summary>
        [LibDesc] public DateTime Validate_End { get; set; }
        /// <summary>
        /// 播放順序
        /// </summary>
        [LibDesc] public ushort Sort { get; set; }
    }
    public class BannerDetailInfo : DetailRowModel
    {
        /// <summary>
        /// 
        /// </summary>
        [LibDesc, Key] public string BannerId { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc, Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 語系
        /// </summary>
        [LibDesc] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc] public string Title { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc] public string Content { get; set; }
        /// <summary>
        /// 網址開啟方式
        /// </summary>
        [LibDesc] public byte URL_Open { get; set; }
    }
}
