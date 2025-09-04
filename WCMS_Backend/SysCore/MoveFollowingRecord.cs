using Newtonsoft.Json;
using System.Collections;
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection;
using WCMS.SysCore.Interface;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;

namespace WCMS.SysCore
{
    //資料傳輸用的物件
    public class MoveFollow
    {
        public string APIName { get; set; } = string.Empty;
        [ForeignKey(nameof(UserId))] public UserModel? User { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string followingDT { get; set; } = string.Empty;
        public string Browser { get; set; } = string.Empty;
        public string IP { get; set; } = string.Empty;
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
    public class MoveFollowingRecord(ApplicationDbContext dataAccess)
    {
        private ApplicationDbContext DataAccess = dataAccess;
        public IList<MoveFollow> MoveFollows { get; set; } = [];

        public void AddMoveFollow(MoveFollow _MoveFollows)
        {
            DataAccess.Add(_MoveFollows);
        }
    }
}
