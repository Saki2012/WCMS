using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;

namespace WCMS.SysCore
{
    //資料傳輸用的物件
    public class OperateLogModel
    {
        [Key]public int Id { get; set; }
        [StringLength(SysLengthParam.Name)] public string APIName { get; set; } = string.Empty;
        [StringLength(SysLengthParam.ID)] public string? UserId { get; set; }
        [ForeignKey(nameof(UserId))] public UserModel? User { get; set; }
        public string followingDT { get; set; } = string.Empty;
        [StringLength(SysLengthParam.Memo)]public string Browser { get; set; } = string.Empty;
        [StringLength(SysLengthParam.IP)]public string IP { get; set; } = string.Empty;
        public DateTime ExcuteTime { get; set; } = DateTime.UtcNow;
        public ExcStatus ExcStatus { get; set; }
    }

    public enum ExcStatus : byte
    { 
        OK,
        Excuting,
        CancelExc,
        Fail
    }

    //實做操作記錄的點
    public class OperateLog(ApplicationDbContext dataAccess): IOperateLog
    {
        private readonly ApplicationDbContext DataAccess = dataAccess;
        public IList<OperateLogModel> MoveFollows { get; set; } = [];

        public void AddMoveFollow(OperateLogModel _MoveFollows)
        {
            DataAccess.Add(_MoveFollows);
            DataAccess.SaveChanges();
        }
    }
}
