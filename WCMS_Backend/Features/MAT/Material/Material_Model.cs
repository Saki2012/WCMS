using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.COMM.Category;
using WCMS.Features.COMM.Tag;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.Features.MAT.Material;

/// <summary>
/// 物件主表
/// </summary>
public class Material : HeaderModel
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.MaterialId)]
    public string MaterialId { get; set; } = string.Empty;
    /// <summary>
    /// 類別
    /// </summary>
    [ForeignKey(nameof(CategoryId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public Category Category { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, DisplayName.CategoryId)]
    public string? CategoryId { get; set; }
    /// <summary>
    /// 商品價格 (未來要移動到商品資料，而非物件資料)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Product_Price)]
    public decimal Price { get; set; }

    #region 主子表關聯
    [InverseProperty(nameof(MaterialLangInfo._Material))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<MaterialLangInfo> _MaterialLangInfo { get; set; } = [];
    [InverseProperty(nameof(MaterialPicture._Material))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<MaterialPicture> _MaterialPicture { get; set; } = [];
    [InverseProperty(nameof(MaterialTags._Material))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<MaterialTags> _MaterialTags { get; set; } = [];


    #endregion
}
/// <summary>
/// 物件資訊
/// </summary>
public class MaterialLangInfo : DetailModel
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.MaterialId)]
    public string MaterialId { get; set; } = string.Empty;
    /// <summary>
    /// 行代碼
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
    /// 物件名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.MaterialName)]
    public string MaterialName { get; set; } = string.Empty;
    /// <summary>
    /// 物件資訊 (Json格式儲存，內容可依物件類別設定的欄位設定需求自訂)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Material_Info)]
    public string MaterialInfoJson { get; set; } = string.Empty;
    /// <summary>
    /// 資訊說明 (XML資訊)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Material_Memo)]
    public string Memo { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(MaterialId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public Material _Material { get; set; } = null!;
    #endregion
}
/// <summary>
/// 物件照片
/// </summary>
public class MaterialPicture : DetailModel
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.MaterialId)]
    public string MaterialId { get; set; } = string.Empty;
    /// <summary>
    /// 行代碼
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    /// <summary>
    /// 照片來源
    /// </summary>
    [ForeignKey(nameof(PictureId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? Picture { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, DisplayName.Common_Picture)]
    public string? PictureId { get; set; }
    /// <summary>
    /// 檔案名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_PictureName)]
    public string PictureName { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(MaterialId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public Material _Material { get; set; }
    #endregion
}
/// <summary>
/// 物件標籤
/// </summary>
public class MaterialTags : DetailModel
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.MaterialId)]
    public string MaterialId { get; set; } = string.Empty;
    /// <summary>
    /// 行代碼
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    /// <summary>
    /// 標籤
    /// </summary>
    [ForeignKey(nameof(TagId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public TagData Tag { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, DisplayName.TagId)]
    public string? TagId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(MaterialId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public Material _Material { get; set; } = null!;
    #endregion
}
