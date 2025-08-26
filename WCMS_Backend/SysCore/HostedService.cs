using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using WCMS.SysCore.AppSettingsOptions;

namespace WCMS.SysCore
{
    public sealed class EnsureStorageFoldersHostedService(IOptions<FilePathOptions> opt, IWebHostEnvironment env) : IHostedService
    {
        public Task StartAsync(CancellationToken cancellationToken)
        {
            var o = opt.Value;

            // 以 wwwroot 為基準（若你希望在站外，改成自訂根路徑即可）
            var webroot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var root = Path.Combine(webroot, o.Root);

            Ensure(root);
            Ensure(Path.Combine(root, o.Pending));
            Ensure(Path.Combine(root, o.Permanent));
            Ensure(Path.Combine(root, o.Import));
            Ensure(Path.Combine(root, "logs")); // 可能用於暫存上傳檔案

            return Task.CompletedTask;

            static void Ensure(string p) => Directory.CreateDirectory(p); // idempotent
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
