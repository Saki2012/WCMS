using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Validation;
namespace WCMS.Features.WEB.Banner;

public partial class Banner : HeaderModel
{
    /// <summary>
    /// 橫幅ID
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.BannerId)]
    public string BannerId { get; set; } = string.Empty;
    /// <summary>
    /// 類別ID
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, DisplayName.Banner_CategoryName)]
    public string BannerCategoryName { get; set; } = string.Empty;
    /// <summary>
    /// 轉換間隔
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Banner_Interval)]
    public short Interval { get; set; }
    /// <summary>
    /// 轉換速度
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Banner_Speed)]
    public short Speed { get; set; }
    /// <summary>
    /// 橫幅高度
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Banner_Height)]
    public short Height { get; set; }
    /// <summary>
    /// 橫幅寬度
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Banner_Width)]
    public short Width { get; set; }

    #region 主子表關聯
    [InverseProperty(nameof(BannerDetail._Banner))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<BannerDetail> _BannerDetail { get; set; } = [];
    #endregion
}
[LibDesc(DisplayName.BannerDetail)]
public partial class BannerDetail : DetailModel
{
    /// <summary>
    /// 
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.BannerId)]
    public string BannerId { get; set; } = string.Empty;
    /// <summary>
    /// 
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    /// <summary>
    /// 圖片來源取檔案關聯
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Banner_PicSrcId)]
    public string PicSrcId { get; set; } = string.Empty;
    /// <summary>
    /// 字體顏色
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Banner_FontColor)]
    public string FontColor { get; set; } = string.Empty;
    /// <summary>
    /// 資料有效日期-起
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Banner_StartDate)]
    public DateTime Validate_Start { get; set; }
    /// <summary>
    /// 資料有效日期-迄
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Banner_EndDate)]
    public DateTime Validate_End { get; set; }
    /// <summary>
    /// 播放順序
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Banner_Sort)]
    public ushort Sort { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(BannerId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public Banner _Banner { get; set; }
    [InverseProperty(nameof(BannerDetailInfo._BannerDetail))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<BannerDetailInfo> _BannerDetailInfo { get; set; } = [];
    #endregion
}
public partial class BannerDetailInfo : DetailModel
{
    /// <summary>
    /// 
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.BannerId)]
    public string BannerId { get; set; } = string.Empty;
    /// <summary>
    /// 
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
    public int ParentRowId { get; set; }
    /// <summary>
    /// 
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Title)]
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Content)]
    public string Content { get; set; } = string.Empty;

    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, DisplayName.Common_Url)]
    public string URL { get; set; } = string.Empty;
    /// <summary>
    /// 網址開啟方式
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_UrlOpen)]
    public WindowTarget URL_Open { get; set; }

    #region 主子表關聯
    [ForeignKey($@"{nameof(BannerId)},{nameof(ParentRowId)}")]
    [LibField(ApiFieldMode.ReadOnly)]
    public BannerDetail _BannerDetail { get; set; }
    #endregion
}
