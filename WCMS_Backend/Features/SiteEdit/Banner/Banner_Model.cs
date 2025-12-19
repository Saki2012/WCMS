using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.Banner
{
    [LibDesc]
    public partial class BannerSet:ITSet
    {
        [LibDesc] public Banner Banner { get; set; } = new Banner();
        [LibDesc] public List<BannerDetail> BannerDetail { get; set; } = [];
        [LibDesc] public List<BannerDetailInfo> BannerDetailInfo { get; set; } = [];
    }
    public partial class Banner: MasterDataModel
    {
        /// <summary>
        /// 橫幅ID
        /// </summary>
        [LibDesc, Key, StringLength(SysLengthParam.ID)] public string BannerId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string BannerCategoryName { get; set; }
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
        #region 主子表關聯
        [InverseProperty(nameof(BannerDetail._Banner))] public List<BannerDetail> _BannerDetail { get; set; } = [];
        #endregion
    }
    public partial class BannerDetail:DetailRowModel
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
        [LibDesc] public DateTime? Validate_Start { get; set; }
        /// <summary>
        /// 資料有效日期-迄
        /// </summary>
        [LibDesc] public DateTime? Validate_End { get; set; }
        /// <summary>
        /// 播放順序
        /// </summary>
        [LibDesc] public ushort Sort { get; set; }
        #region 主子表關聯
        [ForeignKey(nameof(BannerId))] public Banner _Banner { get; set; }
        [InverseProperty(nameof(BannerDetailInfo._BannerDetail))] public List<BannerDetailInfo> _BannerDetailInfo { get; set; }
        #endregion
    }
    public partial class BannerDetailInfo : DetailRowModel
    {
        /// <summary>
        /// 
        /// </summary>
        [LibDesc, Key, StringLength(SysLengthParam.ID)] public string BannerId { get; set; }
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
        [LibDesc] public LangCode Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.Title)] public string Title { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc] public string Content { get; set; }

        [LibDesc, StringLength(SysLengthParam.Url)] public string URL { get; set; }
        /// <summary>
        /// 網址開啟方式
        /// </summary>
        [LibDesc] public WindowTarget URL_Open { get; set; }

        #region 主子表關聯
        [ForeignKey($@"{nameof(BannerId)},{nameof(ParentRowId)}")] public BannerDetail _BannerDetail { get; set; }
        #endregion
    }
}
