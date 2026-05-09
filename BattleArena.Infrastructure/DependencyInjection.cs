using BattleArena.Application.Abstractions;
using BattleArena.Infrastructure.Messaging;
using BattleArena.Infrastructure.Persistence;
using BattleArena.Infrastructure.Search;
using Elastic.Clients.Elasticsearch;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BattleArena.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

        services.AddMemoryCache();

        var redisConnection = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddStackExchangeRedisCache(options => options.Configuration = redisConnection);
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        services.Configure<RabbitMqOptions>(configuration.GetSection(RabbitMqOptions.SectionName));

        var rabbitEnabled = configuration.GetValue($"{RabbitMqOptions.SectionName}:Enabled", false);
        if (rabbitEnabled)
        {
            services.AddSingleton<RabbitMqConnectionHolder>();
            services.AddSingleton<IIntegrationEventPublisher, RabbitMqIntegrationEventPublisher>();
        }
        else
        {
            services.AddSingleton<IIntegrationEventPublisher, NullIntegrationEventPublisher>();
        }

        services.Configure<ElasticsearchOptions>(
            configuration.GetSection(ElasticsearchOptions.SectionName));

        var elasticOptions = configuration
            .GetSection(ElasticsearchOptions.SectionName)
            .Get<ElasticsearchOptions>();

        if (elasticOptions?.Enabled == true)
        {
            var settings = new ElasticsearchClientSettings(new Uri(elasticOptions.Url));
            var client = new ElasticsearchClient(settings);
            services.AddSingleton(client);
        }
        else
        {
            services.AddSingleton<ElasticsearchClient?>(_ => null);
        }

        services.AddScoped<ICharacterSearchReadModel, ElasticsearchCharacterSearchReadModel>();
        services.AddScoped<ICharacterSearchIndexer, ElasticsearchCharacterIndexer>();

        return services;
    }
}