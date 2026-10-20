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

# Puține straturi, intenționat: builderul platformei (podman rootless) poate copia întreg
# sistemul de fișiere la fiecare COPY/RUN, iar cota de disc a build-ului e mică. De aceea
# sursele se copiază o dată și totul rulează într-un singur RUN care își curăță cache-urile.
# Gol înseamnă „apeluri relative către /api” — exact ce trebuie când API-ul servește SPA-ul.
ENV VITE_API_BASE_URL="" NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
COPY client/ ./
RUN npm ci \
    && npm run build \
    && rm -rf node_modules /root/.npm /tmp/*

# ------------------------------------------------------------------- 2. API ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS api
WORKDIR /src

# Același motiv: un singur COPY și un singur RUN (restore + publish), cu cache-ul NuGet
# șters la final. Soluția nu se copiază — referă și proiectul de teste, care nu intră în imagine.
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1 DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
COPY src/ src/
RUN dotnet publish src/PsihoAdinaGghita.Api/PsihoAdinaGghita.Api.csproj \
        -c Release -o /app/publish /p:UseAppHost=false \
    && rm -rf /root/.nuget /root/.local/share/NuGet /tmp/* src/*/obj src/*/bin

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
