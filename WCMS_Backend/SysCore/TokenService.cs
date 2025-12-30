using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using WCMS.Features.SystemSetting.Auth;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Model;

namespace WCMS.SysCore
{
    public sealed class TokenService(IMemoryCache cache, IConfiguration cfg) : ITokenService
    {
        private readonly IMemoryCache _cache = cache;
        private readonly IConfiguration _cfg = cfg;

        public (string accessToken, string jti, DateTime expires) IssueAccessToken(User_DTO user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var jti = Guid.NewGuid().ToString("N");
            var expires = DateTime.UtcNow.AddMinutes(int.Parse(_cfg["Jwt:AccessTokenMinutes"] ?? "15"));

            var claims = new[]
            {
                new Claim(nameof(BasicDataModel.InternalId), user.InternalId),
                new Claim(ClaimTypes.NameIdentifier, user.UserId),
                new Claim(ClaimTypes.Name, user.UserName ?? user.UserId),
                //new Claim(ClaimTypes.Role, user.RoleId ?? "User"),
                new Claim(JwtRegisteredClaimNames.Jti, jti),
            };

            var token = new JwtSecurityToken(
                issuer: _cfg["Jwt:Issuer"],
                audience: _cfg["Jwt:Audience"],
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expires,
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return (jwt, jti, expires);
        }

        public (string refreshToken, string tokenId, DateTime expires) IssueRefreshToken(User_DTO user)
        {
            var tokenId = Guid.NewGuid().ToString("N");
            var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var expires = DateTime.UtcNow.AddDays(int.Parse(_cfg["Jwt:RefreshTokenDays"] ?? "7"));

            _cache.Set($"rt:{user.UserId}:{tokenId}", true, expires - DateTime.UtcNow);
            return (raw, tokenId, expires);
        }

        public Task StoreRefreshAsync(string userId, string tokenId, DateTime exp)
        {
            var ttl = exp - DateTime.UtcNow;
            _cache.Set($"rt:{tokenId}", userId, ttl);

            var set = _cache.GetOrCreate<HashSet<string>>($"ur:{userId}", _ => new());
            set!.Add(tokenId);
            _cache.Set($"ur:{userId}", set, ttl);
            return Task.CompletedTask;
        }
        public Task<string?> GetUserIdByRefreshIdAsync(string tokenId)
        {
            return Task.FromResult(_cache.TryGetValue($"rt:{tokenId}", out string? userId) ? userId : null);
        }
        public Task<bool> ValidateRefreshAsync(string userId, string tokenId)
        {
            return Task.FromResult(_cache.TryGetValue($"rt:{userId}:{tokenId}", out _));
        }

        public Task RevokeRefreshAsync(string userId, string tokenId)
        {
            _cache.Remove($"rt:{tokenId}");
            if (_cache.TryGetValue($"ur:{userId}", out HashSet<string>? set))
            {
                set!.Remove(tokenId);
                _cache.Set($"ur:{userId}", set, TimeSpan.FromHours(1)); // 任意
            }
            return Task.CompletedTask;
        }

        public Task BlacklistAccessAsync(string jti, TimeSpan ttl)
        {
            _cache.Set($"bl:{jti}", true, ttl);
            return Task.CompletedTask;
        }

        public Task<bool> IsAccessBlacklistedAsync(string jti)
        {
            return Task.FromResult(_cache.TryGetValue($"bl:{jti}", out _));
        }
    }
}
