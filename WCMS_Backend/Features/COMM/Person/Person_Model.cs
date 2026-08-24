using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.Features.COMM.Person;

[LibDesc(DisplayName.Person_PersonModel)]
public class Person : HeaderModel
{
    /// <summary>
    /// 人員ID
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.Reference, DbStrLen.ID, DisplayName.Person_PersonId)]
    public string PersonId { get; set; } = string.Empty;
    /// <summary>
    /// 人員名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, DisplayName.Person_PersonName)]
    public string PersonName { get; set; } = string.Empty;
    /// <summary>
    /// 大頭貼圖片ID
    /// </summary>
    [ForeignKey(nameof(PersonImgId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? PersonImg { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, DisplayName.Person_PersonImgId)]
    public string? PersonImgId { get; set; }
    /// <summary>
    /// 性別
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Enum_Gender)]
    public Gender Gender { get; set; }
    /// <summary>
    /// 常用Email
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Email, DisplayName.Common_Email)]
    public string Email { get; set; } = string.Empty;
    /// <summary>
    /// 手機號碼
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Phone, DisplayName.Common_MobilePhone)]
    public string MobilePhone { get; set; } = string.Empty;
    /// <summary>
    /// 聯絡電話
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Phone, DisplayName.Common_HomePhone)]
    public string HomePhone { get; set; } = string.Empty;
}
