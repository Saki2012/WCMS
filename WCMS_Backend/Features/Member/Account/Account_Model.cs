using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.Member.Permission;
using WCMS.Features.Member.Personnel;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.Member.Account
{
    public class AccountSet : ITSet
    {
        public AccountModel Account { get; set; } = new();
    }

    [Index(nameof(PersonId), IsUnique = true)]
    public class AccountModel : MasterDataModel
    {
        /// <summary>
        /// 帳戶Id
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string AccountId { get; set; }
        /// <summary>
        /// 帳戶名稱
        /// 注:通常與Person.PersonName相同。
        /// 平時新建時不是從Person帶過來就是手動輸入
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string AccountName { get; set; }
        /// <summary>
        /// 人員編號
        /// 注: 必填，一個人只能有一個帳號
        /// </summary>
        [ForeignKey(nameof(PersonId))] public PersonModel Person { get; set; }
        [StringLength(SysLengthParam.ID)] public string PersonId { get; set; }
        /// <summary>
        /// 雜湊密碼
        /// </summary>
        public byte[] PasswordHash { get; set; } = default!;  // PBKDF2/Argon2 之後會寫
        /// <summary>
        /// 密碼加鹽
        /// </summary>
        public byte[] PasswordSalt { get; set; } = default!;
        /// <summary>
        /// 密碼演算法版本
        /// </summary>
        public int PasswordAlgoVer { get; set; } = 1;
        /// <summary>
        /// 帳戶狀態
        /// </summary>
        public AccountStatus AccountStatus { get; set; }
    }
}
