using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.Features.COMM.Person;
using WCMS.Features.IAM.RolePermission;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.Features.IAM.Account;

[Index(nameof(PersonId), IsUnique = true)]
public class AccountModel : HeaderModel
{
    /// <summary>
    /// 帳戶Id
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.Account_AccountId)]
    public string AccountId { get; set; } = string.Empty;
    /// <summary>
    /// 帳戶名稱
    /// 注:通常與Person.PersonName相同。
    /// 平時新建時不是從Person帶過來就是手動輸入
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, DisplayName.Account_AccountName)]
    public string AccountName { get; set; } = string.Empty;
    /// <summary>
    /// 人員編號
    /// 注: 必填，一個人只能有一個帳號
    /// </summary>
    [ForeignKey(nameof(PersonId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public PersonModel? Person { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, DisplayName.Person_PersonId)]
    public string? PersonId { get; set; }
    /// <summary>
    /// 角色
    /// </summary>
    [ForeignKey(nameof(RoleId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public RoleDataModel? Role { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, DisplayName.RolePermission_RoleId)]
    public string? RoleId { get; set; }
    /// <summary>
    /// 帳戶狀態
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Enum_AccountStatus)]
    public AccountStatus AccountStatus { get; set; }
    /// <summary>
    /// 密碼最後修改時間:檢測90天
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Account_PasswordChangeDate)]
    public DateOnly PasswordChangeDate { get; set; }

    #region Virtual Field
    /// <summary>
    /// 密碼
    /// </summary>
    [NotMapped]
    [LibField(ApiFieldMode.WriteOnly, DisplayName.Common_Password)]
    public string Password { get; set; } = default!;
    #endregion

    #region Entity Field
    /// <summary>
    /// 雜湊密碼
    /// </summary>
    [JsonIgnore]
    [LibField(ApiFieldMode.Ignore)]
    public byte[] PasswordHash { get; set; } = default!; // PBKDF2/Argon2 之後會寫
    /// <summary>
    /// 密碼加鹽
    /// </summary>
    [JsonIgnore]
    [LibField(ApiFieldMode.Ignore)]
    public byte[] PasswordSalt { get; set; } = default!;
    /// <summary>
    /// 密碼演算法版本
    /// </summary>
    [JsonIgnore]
    [LibField(ApiFieldMode.Ignore)]
    public int PasswordAlgoVer { get; set; } = 1;
    #endregion

}
