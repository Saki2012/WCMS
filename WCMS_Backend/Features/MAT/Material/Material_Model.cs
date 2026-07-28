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
/// 物件
/// </summary>
public class MaterialSet:ITSet
{
    public Material Material { get; set; } = new Material();
    public List<MaterialLangInfo> MaterialLangInfo{ get; set; } = [];
    public List<MaterialPicture> MaterialPicture { get; set; } = [];
    public List<MaterialTags> MaterialTags { get; set; } = [];
}
/// <summary>
/// 物件主表
/// </summary>
public class Material: MasterDataModel
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [LibDesc(ModelDisplayName.MaterialId), Key, StringLength(SysLengthParam.ID)] public string MaterialId { get; set; }
    /// <summary>
    /// 類別
    /// </summary>
    [ForeignKey(nameof(CategoryId))] public Category Category { get; set; }
    [LibDesc(ModelDisplayName.CategoryId), StringLength(SysLengthParam.ID)] public string? CategoryId { get; set; }
    /// <summary>
    /// 商品價格 (未來要移動到商品資料，而非物件資料)
    /// </summary>
    [LibDesc(ModelDisplayName.Product_Price)] public decimal Price { get; set; }

    #region 主子表關聯
    [InverseProperty(nameof(MaterialLangInfo._Material))] public List<MaterialLangInfo> _MaterialLangInfo { get; set; }
    [InverseProperty(nameof(MaterialPicture._Material))] public List<MaterialPicture> _MaterialPicture { get; set; }
    [InverseProperty(nameof(MaterialTags._Material))] public List<MaterialTags> _MaterialTags { get; set; }
    

    #endregion
}
/// <summary>
/// 物件資訊
/// </summary>
public class MaterialLangInfo : DetailRowModel
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [LibDesc(ModelDisplayName.MaterialId), Key, StringLength(SysLengthParam.ID)] public string? MaterialId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode Lang { get; set; }
    /// <summary>
    /// 物件名稱
    /// </summary>
    [LibDesc(ModelDisplayName.MaterialName), StringLength(SysLengthParam.Title)] public string MaterialName { get; set; }
    /// <summary>
    /// 物件資訊 (Json格式儲存，內容可依物件類別設定的欄位設定需求自訂)
    /// </summary>
    [LibDesc(ModelDisplayName.Material_Info)] public string MaterialInfoJson { get; set; }
    /// <summary>
    /// 資訊說明 (XML資訊)
    /// </summary>
    [LibDesc(ModelDisplayName.Material_Memo)] public string Memo{ get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(MaterialId))] public Material _Material { get; set; } = null!;
    #endregion
}
/// <summary>
/// 物件照片
/// </summary>
public class MaterialPicture : DetailRowModel
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [LibDesc(ModelDisplayName.MaterialId), Key, StringLength(SysLengthParam.ID)] public string MaterialId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 
    /// </summary>
    public int RowNo { get; set; }
    /// <summary>
    /// 照片來源
    /// </summary>
    [ForeignKey(nameof(PictureId))] public FileManageModel? Picture { get; set; }
    [LibDesc(ModelDisplayName.Common_Picture), StringLength(SysLengthParam.InternalId)] public string? PictureId { get; set; }
    /// <summary>
    /// 檔案名稱
    /// </summary>
    [LibDesc(ModelDisplayName.Common_PictureName), StringLength(SysLengthParam.Title)] public string PictureName { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(MaterialId))] public Material _Material { get; set; }
    #endregion
}
/// <summary>
/// 物件標籤
/// </summary>
public class MaterialTags : DetailRowModel
{
    /// <summary>
    /// 物件代碼
    /// </summary>
    [LibDesc(ModelDisplayName.MaterialId), Key, StringLength(SysLengthParam.ID)] public string? MaterialId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 標籤
    /// </summary>
    [ForeignKey(nameof(TagId))] public TagData Tag { get; set; }
    [LibDesc(ModelDisplayName.TagId), StringLength(SysLengthParam.ID)] public string TagId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(MaterialId))] public Material _Material { get; set; } = null!;
    #endregion
}