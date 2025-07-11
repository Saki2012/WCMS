using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.Features.SiteEdit.FileArchive
{
    public class FileArchiveBiz(IRepositoryMapProvider repoMapProvider) : BizService<FileArchiveSet>(repoMapProvider), IBizService<FileArchiveSet> { }
}
