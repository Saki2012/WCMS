using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.Member.Personnel
{
    /// <summary>
    /// 人員基本資料表單
    /// </summary>
    [LibDesc(ModelDisplayName.Person_PersonSet)]public class PersonSet_DTO : ITSet_DTO
    {
        public PersonModel_DTO Person { get; set; } = new();
    }
    /// <summary>
    /// 人員基本資料
    /// </summary>
    [LibDesc(ModelDisplayName.Person_PersonModel)]public class PersonModel_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 人員ID
        /// </summary>
        [LibDesc(ModelDisplayName.Person_PersonId), StringLength(SysLengthParam.ID)] public string? PersonId { get; set; }
        /// <summary>
        /// 人員名稱
        /// </summary>
        [LibDesc(ModelDisplayName.Person_PersonName), StringLength(SysLengthParam.Name)] public string? PersonName { get; set; }
        /// <summary>
        /// 大頭貼圖片ID
        /// </summary>
        [ForeignKey(nameof(PersonImgId))] public FileManageModel? PersonImg { get; set; }
        [LibDesc(ModelDisplayName.Person_PersonImgId), StringLength(SysLengthParam.InternalId)] public string? PersonImgId { get; set; }
        /// <summary>
        /// 性別
        /// </summary>
        [LibDesc(ModelDisplayName.Enum_Gender)] public Gender Gender { get; set; }
        /// <summary>
        /// 常用Email
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Email), StringLength(SysLengthParam.Email)] public string? Email { get; set; }
        /// <summary>
        /// 手機號碼
        /// </summary>
        [LibDesc(ModelDisplayName.Common_MobilePhone), StringLength(SysLengthParam.Phone)] public string? MobilePhone { get; set; }
        /// <summary>
        /// 家用電話
        /// </summary>
        [LibDesc(ModelDisplayName.Common_HomePhone), StringLength(SysLengthParam.Phone)] public string? HomePhone { get; set; }
    }
}
