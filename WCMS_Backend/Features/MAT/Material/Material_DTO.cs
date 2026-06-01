using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.Features.COMM.Tag;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;

namespace WCMS.Features.MAT.Material;

/// <summary>
/// 公告功能
/// </summary>
[LibDesc(ModelDisplayName.MaterialSet)] public class MaterialSet_DTO : ITSet_DTO
{
    public Material_DTO Material { get; set; } = new();
    public List<MaterialLangInfo_DTO> MaterialLangInfo { get; set; } = [];
    [LibDesc(ModelDisplayName.MaterialPicture)]public List<MaterialPicture_DTO> MaterialPicture { get; set; } = [];
    public List<MaterialTags_DTO> MaterialTags { get; set; } = [];
}

/// <summary>
/// 物件主表
/// </summary>
public class Material_DTO : DTOBasicDataModel
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [LibDesc(ModelDisplayName.MaterialId), Key, StringLength(SysLengthParam.ID)] public string? MaterialId { get; set; }
    /// <summary>
    /// 類別
    /// </summary>
    [ForeignKey(nameof(CategoryId))] public Category_DTO? Category { get; set; }
    [LibDesc(ModelDisplayName.CategoryId), StringLength(SysLengthParam.ID)] public string? CategoryId { get; set; }
    /// <summary>
    /// 商品價格 (未來要移動到商品資料，而非物件資料)
    /// </summary>
    [LibDesc(ModelDisplayName.Product_Price)] public decimal? Price { get; set; }

    #region 主子表關聯
    [InverseProperty(nameof(MaterialLangInfo_DTO._Material))] public List<MaterialLangInfo_DTO>? _MaterialLangInfo { get; set; }
    [InverseProperty(nameof(MaterialPicture_DTO._Material))] public List<MaterialPicture_DTO>? _MaterialPicture { get; set; }
    [InverseProperty(nameof(MaterialTags_DTO._Material))] public List<MaterialTags_DTO>? _MaterialTags { get; set; }
    #endregion
}
/// <summary>
/// 物件資訊
/// </summary>
public class MaterialLangInfo_DTO 
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [LibDesc(ModelDisplayName.MaterialId), Key, StringLength(SysLengthParam.ID)] public string? MaterialId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
    /// <summary>
    /// 物件名稱
    /// </summary>
    [LibDesc(ModelDisplayName.MaterialName), StringLength(SysLengthParam.Title)] public string? MaterialName { get; set; }
    /// <summary>
    /// 物件資訊 (Json格式儲存，內容可依物件類別設定的欄位設定需求自訂)
    /// </summary>
    [LibDesc(ModelDisplayName.Material_Info)] public string? MaterialInfoJson { get; set; }
    /// <summary>
    /// 資訊說明 (XML資訊)
    /// </summary>
    [LibDesc(ModelDisplayName.Material_Memo)] public string? Memo { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(MaterialId))] public Material_DTO? _Material { get; set; } = null!;
    #endregion
}
/// <summary>
/// 物件照片
/// </summary>
public class MaterialPicture_DTO 
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [LibDesc(ModelDisplayName.MaterialId), Key, StringLength(SysLengthParam.ID)] public string? MaterialId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    /// <summary>
    /// 照片來源
    /// </summary>
    [ForeignKey(nameof(PictureId))] public FileManageModel_DTO? Picture { get; set; }
    [LibDesc(ModelDisplayName.Common_Picture), StringLength(SysLengthParam.InternalId)] public string? PictureId { get; set; }
    /// <summary>
    /// 檔案名稱
    /// </summary>
    [LibDesc(ModelDisplayName.Common_PictureName), StringLength(SysLengthParam.Title)] public string? PictureName { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(MaterialId))] public Material_DTO? _Material { get; set; }
    #endregion
}
/// <summary>
/// 物件標籤
/// </summary>
public class MaterialTags_DTO 
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [LibDesc(ModelDisplayName.MaterialId), Key, StringLength(SysLengthParam.ID)] public string? MaterialId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    /// <summary>
    /// 標籤
    /// </summary>
    [ForeignKey(nameof(TagId))] public TagData_DTO? Tag { get; set; }
    [LibDesc(ModelDisplayName.TagId), StringLength(SysLengthParam.ID)] public string? TagId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(MaterialId))] public Material_DTO? _Material { get; set; } = null!;
    #endregion
}