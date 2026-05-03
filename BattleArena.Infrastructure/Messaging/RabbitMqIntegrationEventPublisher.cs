using System.Text;
using System.Text.Json;
using BattleArena.Application.Abstractions;
using BattleArena.Application.IntegrationEvents;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace BattleArena.Infrastructure.Messaging;

public sealed class RabbitMqIntegrationEventPublisher : IIntegrationEventPublisher
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly RabbitMqConnectionHolder _holder;
    private readonly RabbitMqOptions _options;

    public RabbitMqIntegrationEventPublisher(RabbitMqConnectionHolder holder, IOptions<RabbitMqOptions> options)
    {
        _holder = holder;
        _options = options.Value;
    }

    public async Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
        where TEvent : class
    {
        var routingKey = integrationEvent switch
        {
            CharacterCreatedIntegrationEvent => "character.created",
            _ => throw new NotSupportedException($"No routing mapping for {typeof(TEvent).Name}."),
        };

        var payload = JsonSerializer.Serialize(integrationEvent, SerializerOptions);
        var body = Encoding.UTF8.GetBytes(payload);

        var connection = await _holder.GetConnectionAsync().ConfigureAwait(false);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        await channel.ExchangeDeclareAsync(
                exchange: _options.ExchangeName,
                type: ExchangeType.Topic,
                durable: true,
                autoDelete: false,
                arguments: null,
                passive: false,
                cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        var props = new BasicProperties
        {
            ContentType = "application/json",
            DeliveryMode = DeliveryModes.Persistent,
        };

        await channel.BasicPublishAsync(
                exchange: _options.ExchangeName,
                routingKey: routingKey,
                mandatory: false,
                basicProperties: props,
                body: body,
                cancellationToken: cancellationToken)
            .ConfigureAwait(false);
    }
}