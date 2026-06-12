using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.Banner;

[LibDesc(ModelDisplayName.BannerSet)]public partial class BannerSet_DTO : ITSet_DTO
{
    [LibDesc] public Banner_DTO Banner { get; set; } = new();
    [LibDesc] public List<BannerDetail_DTO> BannerDetail { get; set; } = [];
    [LibDesc] public List<BannerDetailInfo_DTO> BannerDetailInfo { get; set; } = [];
}
public partial class Banner_DTO : DTOBasicDataModel
{
    /// <summary>
    /// 橫幅ID
    /// </summary>
    [LibDesc(ModelDisplayName.BannerId)] public string? BannerId { get; set; }
    /// <summary>
    /// 類別ID
    /// </summary>
    [LibDesc(ModelDisplayName.Banner_CategoryName)] public string? BannerCategoryName { get; set; }
    /// <summary>
    /// 轉換間隔
    /// </summary>
    [LibDesc(ModelDisplayName.Banner_Interval)] public short Interval { get; set; }
    /// <summary>
    /// 轉換速度
    /// </summary>
    [LibDesc(ModelDisplayName.Banner_Speed)] public short Speed { get; set; }
    /// <summary>
    /// 橫幅高度
    /// </summary>
    [LibDesc(ModelDisplayName.Banner_Height)] public short Height { get; set; }
    /// <summary>
    /// 橫幅寬度
    /// </summary>
    [LibDesc(ModelDisplayName.Banner_Width)] public short Width { get; set; }

    #region 主子表關聯
    public List<BannerDetail_DTO>? _BannerDetail { get; set; }
    #endregion
}
[LibDesc(ModelDisplayName.BannerDetail)]public partial class BannerDetail_DTO
{
    /// <summary>
    /// 
    /// </summary>
    [LibDesc(ModelDisplayName.BannerId)] public string? BannerId { get; set; }
    /// <summary>
    /// 
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
    /// <summary>
    /// 圖片來源取檔案關聯
    /// </summary>
    [LibDesc(ModelDisplayName.Banner_PicSrcId)] public string? PicSrcId { get; set; }
    /// <summary>
    /// 字體顏色
    /// </summary>
    [LibDesc(ModelDisplayName.Banner_FontColor)] public string? FontColor { get; set; }
    /// <summary>
    /// 資料有效日期-起
    /// </summary>
    [LibDesc(ModelDisplayName.Banner_StartDate)] public DateTime? Validate_Start { get; set; }
    /// <summary>
    /// 資料有效日期-迄
    /// </summary>
    [LibDesc(ModelDisplayName.Banner_EndDate)] public DateTime? Validate_End { get; set; }
    /// <summary>
    /// 播放順序
    /// </summary>
    [LibDesc(ModelDisplayName.Banner_Sort)] public ushort Sort { get; set; }

    #region 主子表關聯
    public Banner_DTO? _Banner { get; set; }
    public List<BannerDetailInfo_DTO>? _BannerDetailInfo { get; set; }
    #endregion
}
public partial class BannerDetailInfo_DTO
{
    /// <summary>
    /// 
    /// </summary>
    [LibDesc(ModelDisplayName.BannerId)] public string? BannerId { get; set; }
    /// <summary>
    /// 
    /// </summary>
    [LibDesc(ModelDisplayName.Common_ParentRowId)] public int ParentRowId { get; set; }
    /// <summary>
    /// 
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Title)] public string? Title { get; set; }
    /// <summary>
    /// 
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Content)] public string? Content { get; set; }

    [LibDesc(ModelDisplayName.Common_Url)] public string? URL { get; set; }
    /// <summary>
    /// 網址開啟方式
    /// </summary>
    [LibDesc(ModelDisplayName.Common_UrlOpen)] public WindowTarget URL_Open { get; set; }

    #region 主子表關聯
    public BannerDetail_DTO? _BannerDetail { get; set; }
    #endregion
}
