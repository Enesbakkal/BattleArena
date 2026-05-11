using System;
using System.IO;
using BattleArena.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace BattleArena.Infrastructure.Persistence;

/// <summary>
/// Design-time factory for `dotnet ef` so EF Core can create the DbContext without starting the API host.
/// </summary>
public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var environment =
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";

        // We keep appsettings in the API project.
        // EF tooling design-time sometimes sets the working directory to the Infrastructure project folder,
        // so we try both `<cwd>/BattleArena.Api` and `<cwd>/../BattleArena.Api`.
        var cwd = Directory.GetCurrentDirectory();
        var apiBasePath = Path.Combine(cwd, "BattleArena.Api");
        if (!File.Exists(Path.Combine(apiBasePath, "appsettings.json")))
            apiBasePath = Path.GetFullPath(Path.Combine(cwd, "..", "BattleArena.Api"));

        var configuration = new ConfigurationBuilder()
            .AddJsonFile(Path.Combine(apiBasePath, "appsettings.json"), optional: false, reloadOnChange: false)
            .AddJsonFile(Path.Combine(apiBasePath, $"appsettings.{environment}.json"), optional: true,
                reloadOnChange: false)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("DefaultConnection is missing from configuration.");

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}

