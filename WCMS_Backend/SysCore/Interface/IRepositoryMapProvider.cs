
namespace WCMS.SysCore.Interface
{
    public interface IRepositoryMapProvider
    {
        object EnsureRepo<TSet>(Type modelType) where TSet : class;
        Dictionary<string, object> GetRepoDict<TSet>() where TSet : class;

    }
}
