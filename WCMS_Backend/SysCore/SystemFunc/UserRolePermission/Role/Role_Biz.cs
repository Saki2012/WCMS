using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MimeDetective;
using MimeDetective.Storage;
using SharpCompress.Archives;
using System.IO;
using System.Net;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Threading.Tasks;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.Security;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;
using static MimeDetective.Definitions.DefaultDefinitions;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.UserRolePermission.Role
{
    public class RoleBiz(IRepositoryMapProvider repoMapProvider) : BizService<RoleSet>(repoMapProvider), IBizService<RoleSet>
    {
        #region Public

        #endregion

        #region Private

        #endregion
    }
}
