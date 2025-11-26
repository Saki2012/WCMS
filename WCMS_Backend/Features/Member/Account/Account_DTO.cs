using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.Member.Personnel;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.Member.Account
{
    public class AccountSet_DTO : ITSet_DTO
    {
        public Account_DTO Account { get; set; } = new();
    }

    public class Account_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 帳戶Id
        /// </summary>
        [LibDesc(ModelDisplayName.Account_AccountId), StringLength(SysLengthParam.ID)] public string? AccountId { get; set; }
        /// <summary>
        /// 帳戶名稱
        /// 注:通常與Person.PersonName相同。
        /// 平時新建時不是從Person帶過來就是手動輸入
        /// </summary>
        [LibDesc(ModelDisplayName.Account_AccountName), StringLength(SysLengthParam.Name)] public string? AccountName { get; set; }
        /// <summary>
        /// 使用者編號
        /// </summary>
        [ForeignKey(nameof(PersonId))] public PersonModel? Person { get; set; }
        [LibDesc(ModelDisplayName.Person_PersonId), StringLength(SysLengthParam.ID)] public string? PersonId { get; set; }
        /// <summary>
        /// 密碼
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Password)]public string? Password { get; set; } = default!;
        /// <summary>
        /// 帳戶狀態
        /// </summary>
        [LibDesc(ModelDisplayName.Enum_AccountStatus)] public AccountStatus AccountStatus { get; set; }
    }
}
