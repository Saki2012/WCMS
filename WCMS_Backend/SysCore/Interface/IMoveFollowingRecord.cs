namespace WCMS.SysCore.Interface
{
    public interface IMoveFollowingRecord
    {
        public IList<MoveFollow> MoveFollows { get; set; }
        public void AddMoveFollow(MoveFollow _MoveFollows);
    }
}
