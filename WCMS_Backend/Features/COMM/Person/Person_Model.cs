using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.COMM.Person
{
    /// <summary>
    /// 人員基本資料
    /// </summary>
    public class PersonSet : ITSet
    {
        public PersonModel Person { get; set; } = new();
    }
    public class PersonModel : MasterDataModel
    {
        /// <summary>
        /// 人員ID
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string PersonId { get; set; }
        /// <summary>
        /// 人員名稱
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string PersonName { get; set; }
        /// <summary>
        /// 大頭貼圖片ID
        /// </summary>
        [ForeignKey(nameof(PersonImgId))]public FileManageModel PersonImg { get; set; }
        [StringLength(SysLengthParam.InternalId)] public string? PersonImgId { get; set; }
        /// <summary>
        /// 性別
        /// </summary>
        public Gender Gender { get; set; }
        /// <summary>
        /// 常用Email
        /// </summary>
        [StringLength(SysLengthParam.Email)] public string Email { get; set; }
        /// <summary>
        /// 手機號碼
        /// </summary>
        [StringLength(SysLengthParam.Phone)] public string MobilePhone { get; set; }
        /// <summary>
        /// 聯絡電話
        /// </summary>
        [StringLength(SysLengthParam.Phone)] public string HomePhone { get; set; }
    }
}
