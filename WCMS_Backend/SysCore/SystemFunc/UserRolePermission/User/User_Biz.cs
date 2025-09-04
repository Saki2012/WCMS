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
using static MimeDetective.Definitions.DefaultDefinitions;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.UserRolePermission.User
{
    public class UserBiz(IRepositoryMapProvider repoMapProvider, IErrorHelper message) : BizService<UserSet>(repoMapProvider, message), IBizService<UserSet>
    {
        #region Public
        public bool VerifyPassword(UserSet user, string password) => PasswordHasher.Verify(password, user.User.PasswordHash, user.User.PasswordSalt, user.User.PasswordAlgoVer);
        #endregion

        #region Private

        #endregion
    }
}
