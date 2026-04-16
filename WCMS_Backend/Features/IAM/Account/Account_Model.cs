using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.COMM.Person;
using WCMS.Features.IAM.RolePermission;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.IAM.Account
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
        [ForeignKey(nameof(PersonId))] public PersonModel? Person { get; set; }
        [StringLength(SysLengthParam.ID)] public string? PersonId { get; set; }
        /// <summary>
        /// 角色
        /// </summary>
        [ForeignKey(nameof(RoleId))] public RoleDataModel? Role { get; set; }
        [StringLength(SysLengthParam.ID)] public string? RoleId { get; set; }
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
        /// <summary>
        /// 密碼最後修改時間:檢測90天
        /// </summary>
        public DateOnly PasswordChangeDate { get; set; }
    }
}
