using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace BattleArena.Infrastructure.Messaging;

public sealed class RabbitMqConnectionHolder : IAsyncDisposable
{
    private readonly Lazy<Task<IConnection>> _lazy;

    public RabbitMqConnectionHolder(IOptions<RabbitMqOptions> options)
    {
        var value = options.Value;
        _lazy = new Lazy<Task<IConnection>>(() => CreateConnectionAsync(value));
    }

    private static async Task<IConnection> CreateConnectionAsync(RabbitMqOptions o)
    {
        var factory = new ConnectionFactory
        {
            HostName = o.HostName,
            UserName = o.UserName,
            Password = o.Password,
            VirtualHost = o.VirtualHost,
        };

        return await factory.CreateConnectionAsync().ConfigureAwait(false);
    }

    public Task<IConnection> GetConnectionAsync() => _lazy.Value;

    public async ValueTask DisposeAsync()
    {
        if (!_lazy.IsValueCreated)
            return;

        var connection = await _lazy.Value.ConfigureAwait(false);
        await connection.DisposeAsync().ConfigureAwait(false);
    }
}