using Hangfire.Dashboard;

namespace BattleArena.Api.Hangfire;

/// <summary>Demo / compose behind nginx: default local-only Hangfire auth returns 401.</summary>
public sealed class AllowAllDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context) => true;
}
