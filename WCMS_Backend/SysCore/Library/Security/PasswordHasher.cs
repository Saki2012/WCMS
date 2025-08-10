using System.Security.Cryptography;

namespace WCMS.SysCore.Library.Security
{

    public static class PasswordHasher
    {
        // 建議可放到設定檔
        private const int SaltSize = 16;    // 128-bit
        private const int KeySize = 32;     // 256-bit
        private const int Iter = 100_000;   // .NET 8 以上可 150k+

        public static (byte[] hash, byte[] salt, int ver) Hash(string password, int ver = 1)
        {
            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iter, HashAlgorithmName.SHA256, KeySize);
            return (hash, salt, ver);
        }

        public static bool Verify(string password, byte[] hash, byte[] salt, int ver)
        {
            var computed = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iter, HashAlgorithmName.SHA256, KeySize);
            return CryptographicOperations.FixedTimeEquals(computed, hash);
        }
    }
}
