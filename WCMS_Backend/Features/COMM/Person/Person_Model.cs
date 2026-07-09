using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.COMM.Person
{
    [LibDesc(DisplayName.Person_PersonModel)]
public class PersonModel : HeaderModel
    {
        /// <summary>
        /// 人員ID
        /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.Person_PersonId)]
public string PersonId { get; set; } = string.Empty;
        /// <summary>
        /// 人員名稱
        /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Name, DisplayName.Person_PersonName)]
public string PersonName { get; set; } = string.Empty;
        /// <summary>
        /// 大頭貼圖片ID
        /// </summary>
[ForeignKey(nameof(PersonImgId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel PersonImg { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Person_PersonImgId)]
public string? PersonImgId { get; set; }
        /// <summary>
        /// 性別
        /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Enum_Gender)]
public Gender Gender { get; set; }
        /// <summary>
        /// 常用Email
        /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Email, DisplayName.Common_Email)]
public string Email { get; set; } = string.Empty;
        /// <summary>
        /// 手機號碼
        /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Phone, DisplayName.Common_MobilePhone)]
public string MobilePhone { get; set; } = string.Empty;
        /// <summary>
        /// 聯絡電話
        /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Phone, DisplayName.Common_HomePhone)]
public string HomePhone { get; set; } = string.Empty;
    }
}
