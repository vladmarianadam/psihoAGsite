# syntax=docker/dockerfile:1
#
# Imagine unică: build-ul clientului Vite ajunge în wwwroot-ul API-ului .NET, deci SPA-ul și
# /api sunt servite de același proces, de pe aceeași origine (fără CORS în producție).
#
# Build context: rădăcina repository-ului.
#
#   docker build -t psiho .
#   docker run -p 8080:8080 -v psiho-data:/data -v psiho-uploads:/app/wwwroot/uploads \
#     -e Jwt__SigningKey="<32+ caractere>" -e AdminSeed__Password="<parola>" psiho

# ---------------------------------------------------------------- 1. Client ---
FROM node:22-alpine AS client
WORKDIR /client

# Straturile de dependențe se invalidează doar când se schimbă lockfile-ul.
COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./

# Gol înseamnă „apeluri relative către /api” — exact ce trebuie când API-ul servește SPA-ul.
ENV VITE_API_BASE_URL=""
RUN npm run build

# ------------------------------------------------------------------- 2. API ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS api
WORKDIR /src

# Întâi doar fișierele de proiect: `dotnet restore` se re-rulează numai la schimbarea lor.
# Soluția nu se copiază intenționat — referă și proiectul de teste, care nu intră în imagine.
COPY src/PsihoAdinaGghita.Domain/PsihoAdinaGghita.Domain.csproj src/PsihoAdinaGghita.Domain/
COPY src/PsihoAdinaGghita.Application/PsihoAdinaGghita.Application.csproj src/PsihoAdinaGghita.Application/
COPY src/PsihoAdinaGghita.Infrastructure/PsihoAdinaGghita.Infrastructure.csproj src/PsihoAdinaGghita.Infrastructure/
COPY src/PsihoAdinaGghita.Api/PsihoAdinaGghita.Api.csproj src/PsihoAdinaGghita.Api/
RUN dotnet restore src/PsihoAdinaGghita.Api/PsihoAdinaGghita.Api.csproj

COPY src/ src/
RUN dotnet publish src/PsihoAdinaGghita.Api/PsihoAdinaGghita.Api.csproj \
    -c Release -o /app/publish --no-restore /p:UseAppHost=false

# --------------------------------------------------------------- 3. Runtime ---
# Debian, nu Alpine: biblioteca nativă SQLite (SQLitePCLRaw) și ICU sunt calea cea mai bine
# testată aici, iar diferența de dimensiune nu contează pentru un singur container.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# tzdata: ora României în emailurile de programare. gosu: coborârea privilegiilor din
# entrypoint, după ce volumele montate de platformă primesc proprietarul corect.
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata gosu \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=Europe/Bucharest
ENV ASPNETCORE_ENVIRONMENT=Production

# Platforma termină TLS în fața containerului; fără asta aplicația s-ar crede pe http,
# iar UseHttpsRedirection ar putea intra în buclă de redirect.
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED=true

# Baza de date stă pe volumul persistent /data, nu în release (release-ul se înlocuiește
# la fiecare deploy). Încărcările stau pe volumul /app/wwwroot/uploads.
ENV ConnectionStrings__Default="Data Source=/data/psiho.db"

COPY --from=api /app/publish ./
COPY --from=client /client/dist ./wwwroot/

RUN mkdir -p /data /app/wwwroot/uploads && chown -R app:app /data /app

EXPOSE 8080

# Entrypoint-ul rezolvă două lucruri pe care platformele le tratează diferit:
#  1. portul — se ia din $PORT dacă este injectat, altfel 8080 (valoarea din EXPOSE);
#  2. volumele — dacă sunt montate ca root (uzual pe PaaS), li se dă proprietarul `app`
#     înainte de a coborî privilegiile; altfel EF Core nu poate scrie psiho.db.
# Aplicația rulează în final ca utilizatorul neprivilegiat `app`, nu ca root.
ENTRYPOINT ["/bin/sh", "-c", "if [ \"$(id -u)\" = 0 ]; then chown -R app:app /data /app/wwwroot/uploads 2>/dev/null || true; exec gosu app dotnet PsihoAdinaGghita.Api.dll --urls \"http://+:${PORT:-8080}\"; else exec dotnet PsihoAdinaGghita.Api.dll --urls \"http://+:${PORT:-8080}\"; fi"]
