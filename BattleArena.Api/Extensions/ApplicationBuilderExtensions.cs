using BattleArena.Api.Middleware;

namespace BattleArena.Api.Extensions;

// Pipeline registration helpers kept out of Program.cs for readability.
public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseFluentValidationExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<FluentValidationExceptionMiddleware>();
    }
}
