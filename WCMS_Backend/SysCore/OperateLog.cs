using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.Member.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;

namespace WCMS.SysCore
{
    //資料傳輸用的物件
    public class OperateLogModel
    {
        [Key]public int Id { get; set; }
        [StringLength(SysLengthParam.Name)] public string APIName { get; set; } = string.Empty;
        [ForeignKey(nameof(UserId))] public AccountModel? User { get; set; }
        [StringLength(SysLengthParam.ID)] public string? UserId { get; set; }
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


        public OperateLogModel AddMoveFollow(string apiName,string userId,string jsonData,string ip)
        {
            return AddMoveFollow(new(){APIName = apiName,UserId = userId,followingDT = jsonData,IP = ip});
        }
        public OperateLogModel AddMoveFollow(OperateLogModel log)
        {
            DataAccess.Add(log);
            DataAccess.SaveChanges();
            return log;
        }
    }
}
