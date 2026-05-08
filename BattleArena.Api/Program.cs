using BattleArena.Api.Extensions;
using BattleArena.Application;
using BattleArena.Infrastructure;
using Hangfire;
using Hangfire.SqlServer;
using Serilog;

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) =>
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext());

    builder.Services.AddControllers();
    builder.Services.AddOpenApi();

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173",
                    "https://localhost:5173",
                    "http://127.0.0.1:5173",
                    "https://127.0.0.1:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddHangfire(config =>
    {
        config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180);
        config.UseSimpleAssemblyNameTypeSerializer();
        config.UseRecommendedSerializerSettings();
        config.UseSqlServerStorage(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            new SqlServerStorageOptions
            {
                PrepareSchemaIfNecessary = true
            });
    });

    builder.Services.AddHangfireServer();

    var app = builder.Build();

    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseFluentValidationExceptionHandler();

    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    app.UseCors();
    app.UseAuthorization();

    var hangfireDashboardPath =
        builder.Configuration["Hangfire:DashboardPath"] ?? "/hangfire";
    app.MapHangfireDashboard(hangfireDashboardPath);

    app.MapControllers();

    var cleanupCron = builder.Configuration["Hangfire:RecurringCleanupCron"] ?? "0 */6 * * *";
    RecurringJob.AddOrUpdate(
        "characters-cleanup-placeholder",
        () => Console.WriteLine($"[Hangfire] Cleanup tick at {DateTime.UtcNow:O}"),
        cleanupCron);

    Log.Information("BattleArena API listening");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "BattleArena API host terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}