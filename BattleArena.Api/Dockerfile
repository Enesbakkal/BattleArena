# Build context: BattleArena klasörü (içinde BattleArena.Api vb.)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY BattleArena.Domain/BattleArena.Domain.csproj BattleArena.Domain/
COPY BattleArena.Application/BattleArena.Application.csproj BattleArena.Application/
COPY BattleArena.Infrastructure/BattleArena.Infrastructure.csproj BattleArena.Infrastructure/
COPY BattleArena.Api/BattleArena.Api.csproj BattleArena.Api/

RUN dotnet restore BattleArena.Api/BattleArena.Api.csproj

COPY BattleArena.Domain/ BattleArena.Domain/
COPY BattleArena.Application/ BattleArena.Application/
COPY BattleArena.Infrastructure/ BattleArena.Infrastructure/
COPY BattleArena.Api/ BattleArena.Api/

WORKDIR /src/BattleArena.Api
RUN dotnet publish BattleArena.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "BattleArena.Api.dll"]