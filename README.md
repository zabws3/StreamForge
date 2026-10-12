# StreamForge

Aplicación web de streaming basada en Node.js y Express, con MySQL para
persistencia de datos y Redis para caché y sesiones en el entorno de
producción. El proyecto utiliza Docker Compose para separar los entornos
de desarrollo (`dev`) y producción (`prod`).

## Índice

-   [Características](#características)
-   [Arquitectura](#arquitectura)
-   [Requisitos previos](#requisitos-previos)
-   [Estructura del proyecto](#estructura-del-proyecto)
-   [Configuración](#configuración)
-   [Instalación y ejecución](#instalación-y-ejecución)
-   [Entornos dev y prod](#entornos-dev-y-prod)
-   [Healthchecks y monitorización](#healthchecks-y-monitorización)
-   [Pruebas y verificaciones
    realizadas](#pruebas-y-verificaciones-realizadas)
-   [Makefile y comandos útiles](#makefile-y-comandos-útiles)
-   [Persistencia de datos](#persistencia-de-datos)
-   [Solución de problemas](#solución-de-problemas)
-   [Seguridad](#seguridad)
-   [Pendiente de verificar](#pendiente-de-verificar)

## Características

-   Aplicación Node.js/Express.
-   Base de datos MySQL 8.
-   Redis 7 en producción para caché y almacenamiento de sesiones.
-   Separación de configuración y despliegue mediante archivos Compose y
    variables de entorno.
-   Volúmenes Docker para persistir la base de datos.
-   Endpoint HTTP `/health` que informa del estado de la aplicación,
    MySQL y Redis.
-   Autenticación con sesiones Express y contraseñas almacenadas
    mediante hash bcrypt.
-   Reproducción de vídeo mediante MPEG-DASH y catálogo de vídeos.
-   Usuarios de demostración creados/actualizados mediante un script de
    inicialización.

## Arquitectura

``` mermaid
flowchart TB
    Browser["Navegador"]
    Web["StreamForge web<br/>Node.js + Express<br/>Puerto interno 3000"]
    DB[("MySQL 8<br/>Datos persistentes")]
    Redis[("Redis 7<br/>Caché y sesiones")]
    Vol[("Volumen Docker<br/>de MySQL")]
    Browser -->|"HTTP publicado"| Web
    Web -->|"Red Docker interna"| DB
    Web -.->|"Solo en producción"| Redis
    DB --- Vol
```

Solo el servicio web publica un puerto en el host. MySQL y Redis se
comunican con la aplicación mediante la red interna de Docker y no
necesitan publicar sus puertos al host.

### Entornos

-   **Dev:** aplicación web + MySQL. Acceso web esperado en
    `http://localhost:8081`.
-   **Prod:** aplicación web + MySQL + Redis. Acceso web esperado en
    `http://localhost:8080`.

## Requisitos previos

-   Docker Engine.
-   Docker Compose v2 (`docker compose`, integrado en las versiones
    actuales de Docker).
-   `make`, si se quiere usar el `Makefile`.
-   Git, si se clona el repositorio.

Comprueba la instalación:

``` bash
docker --version
docker compose version
make --version
```

## Estructura del proyecto

La estructura principal es:

``` text
StreamForge/
├── app/
│   ├── public/                 # HTML, CSS y JavaScript del frontend
│   ├── src/
│   │   ├── app.js              # Servidor Express y endpoint /health
│   │   ├── cache.js            # Cliente Redis
│   │   ├── db.js               # Conexión MySQL
│   │   ├── middleware/         # Autenticación/autorización
│   │   ├── repositories/       # Acceso a datos
│   │   ├── routes/              # Rutas HTTP/API
│   │   └── scripts/             # Scripts auxiliares y usuarios demo
│   ├── Dockerfile
│   └── package.json
├── db/
│   └── init.sql                # Esquema y datos iniciales de MySQL
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.dev                    # Configuración local de desarrollo (no subir)
├── .env.prod                   # Configuración de producción (no subir)
├── Makefile                    # Comandos de automatización, si está presente
└── README.md
```

La estructura exacta puede variar si se han añadido o movido archivos
durante el desarrollo.

## Configuración

Hay dos archivos de variables de entorno, uno por entorno. Los archivos
`.env` contienen credenciales y configuración específica; no deben
incluirse en el repositorio.

### Variables habituales de desarrollo

Ejemplo orientativo basado en la configuración utilizada:

``` dotenv
APP_PORT=8081
MYSQL_HOST=db
MYSQL_PORT=3306
MYSQL_DATABASE=streamforge_dev
MYSQL_USER=streamforge
MYSQL_PASSWORD=<contraseña-local>
MYSQL_ROOT_PASSWORD=<contraseña-root-local>
```

### Variables habituales de producción

``` dotenv
APP_PORT=8080
MYSQL_HOST=db
MYSQL_PORT=3306
MYSQL_DATABASE=streamforge
MYSQL_USER=streamforge
MYSQL_PASSWORD=<contraseña-producción>
MYSQL_ROOT_PASSWORD=<contraseña-root-producción>
REDIS_HOST=cache
REDIS_PORT=6379
NODE_ENV=production
SESSION_SECRET=<secreto-aleatorio-largo>
SEED_DEMO_USERS=false
```

Los valores entre `<...>` son marcadores: sustitúyelos por valores
propios. No copies literalmente los marcadores al archivo de entorno.
Genera un secreto de sesión aleatorio y distinto por entorno. No
reutilices las contraseñas de ejemplo en un despliegue real.

Dentro de Docker, `db` y `cache` son nombres de servicio y se resuelven
mediante DNS interno de Compose. No uses `localhost` como host de MySQL
o Redis desde el contenedor web.

## Instalación y ejecución

### 1. Obtener el proyecto

Si ya tienes el repositorio local, entra en su raíz. Si lo clonas,
utiliza la URL real de tu repositorio:

``` bash
git clone <URL_DEL_REPOSITORIO>
cd StreamForge
```

### 2. Preparar los archivos de entorno

Comprueba que existen `.env.dev` y `.env.prod`. Si no existen, créalos a
partir de los ejemplos anteriores y ajusta los valores a las variables
referenciadas por cada archivo Compose.

No compartas ni subas esos archivos con credenciales reales.

### 3. Arrancar desarrollo

``` bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build
```

Consulta el estado:

``` bash
docker compose --env-file .env.dev -f docker-compose.dev.yml ps
docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f web
```

Abre `http://localhost:8081`.

### 4. Arrancar producción local

``` bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Consulta el estado:

``` bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f web
```

Abre `http://localhost:8080`.

En este proyecto, "prod" es el entorno de producción simulado en local
mediante Compose; no implica por sí mismo que exista un dominio público,
HTTPS o un proxy inverso.

### 5. Comprobar el endpoint de salud

En producción local:

``` bash
curl -i http://localhost:8080/health
```

En desarrollo:

``` bash
curl -i http://localhost:8081/health
```

Cuando todos los servicios configurados estén conectados, se espera una
respuesta similar a:

``` json
{
  "status": "ok",
  "database": "connected",
  "cache": "connected"
}
```

En desarrollo, si Redis no está configurado, el campo `cache` puede ser
`disabled`.

### 6. Detener los servicios

Para detener los contenedores conservando los volúmenes:

``` bash
docker compose --env-file .env.dev -f docker-compose.dev.yml down
docker compose --env-file .env.prod -f docker-compose.prod.yml down
```

`down` elimina los contenedores y redes de Compose, pero normalmente
conserva los volúmenes nombrados. **No añadas `-v` si quieres conservar
los datos.**

## Entornos dev y prod

  ------------------------------------------------------------------------------
  Aspecto                 Dev                        Prod
  ----------------------- -------------------------- ---------------------------
  Compose                 `docker-compose.dev.yml`   `docker-compose.prod.yml`

  Variables               `.env.dev`                 `.env.prod`

  Puerto del host         `8081`                     `8080`

  Aplicación              Node.js + Express          Node.js + Express

  Base de datos           MySQL 8                    MySQL 8

  Caché Redis             No configurada en el       Redis 7
                          entorno descrito           

  Sesiones                Según la configuración de  Redis mediante
                          la aplicación              `connect-redis` cuando
                                                     `REDIS_HOST` está
                                                     configurado

  Datos                   Volumen Docker de          Volumen Docker de
                          desarrollo                 producción
  ------------------------------------------------------------------------------

Los volúmenes y nombres de proyecto de Compose deben mantenerse
separados para evitar mezclar datos de desarrollo y producción.
Comprueba los nombres efectivos con `docker compose ... config` y
`docker volume ls`.

## Healthchecks y monitorización

Hay dos mecanismos distintos:

1.  **Healthchecks de Docker Compose:** indican si cada contenedor está
    saludable según el comando configurado para ese servicio. Consulta
    su estado con `docker compose ... ps`.
2.  **Endpoint de aplicación `/health`:** realiza comprobaciones desde
    Express y devuelve JSON con los campos `status`, `database` y
    `cache`. En la implementación actual, el endpoint devuelve HTTP
    `200` cuando los servicios requeridos están conectados y HTTP `503`
    cuando detecta una dependencia caída.

Ejemplo de estado normal:

``` json
{
  "status": "ok",
  "database": "connected",
  "cache": "connected"
}
```

Ejemplo observado cuando MySQL está desconectado y Redis sigue
funcionando:

``` json
{
  "status": "error",
  "database": "disconnected",
  "cache": "connected"
}
```

La interfaz web consulta `/health` y muestra el estado de cada
componente. Para que Redis no aparezca como caído cuando la respuesta
HTTP es `503` por un problema de MySQL, el frontend debe evaluar cada
campo de forma independiente, sin condicionar todos los estados a
`response.ok`:

``` js
const appHealthy = data.status === "ok";
const dbHealthy = data.database === "connected";
const redisHealthy =
    data.cache === "connected" || data.cache === "disabled";
```

Si `cache: "disabled"` debe mostrarse como "No configurado" en lugar de
"Conectado", conviene representar ese estado por separado en la
interfaz.

### Pruebas manuales de salud

Ver el estado de los contenedores:

``` bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Comprobar Redis directamente:

``` bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec cache redis-cli ping
```

La respuesta esperada es `PONG`.

Consultar el endpoint:

``` bash
curl -i http://localhost:8080/health
```

Para probar una caída de MySQL sin parar el resto del entorno:

``` bash
docker compose --env-file .env.prod -f docker-compose.prod.yml stop db
curl -i http://localhost:8080/health
docker compose --env-file .env.prod -f docker-compose.prod.yml start db
```

Después de arrancar MySQL, espera a que vuelva a estar saludable y
repite `curl`. No utilices `down -v` para esta prueba.

## Pruebas y verificaciones realizadas

Las siguientes pruebas se realizaron durante el desarrollo y se basan en
las salidas observadas en terminal:

  ---------------------------------------------------------------------------------------------------
  Prueba                              Resultado observado
  ----------------------------------- ---------------------------------------------------------------
  Arranque de los servicios de        `web`, `db` y `cache` aparecieron como `Up`; los tres llegaron
  producción                          a mostrar `healthy`.

  Endpoint `/health` con dependencias Devolvió
  disponibles                         `{"status":"ok","database":"connected","cache":"connected"}`.

  Comprobación directa de Redis       `redis-cli ping` devolvió `PONG`.

  Caída de MySQL                      Al ejecutar `stop db`, el endpoint devolvió HTTP `503` y
                                      `database: "disconnected"`.

  Estado de Redis durante la caída de El endpoint devolvió `cache: "connected"` y Redis siguió
  MySQL                               respondiendo `PONG`.

  Caché de catálogo de vídeos         Se observó una respuesta procedente de MySQL en la primera
                                      petición y de Redis en una petición posterior; se había
                                      configurado una expiración de 60 segundos.

  Prueba con MySQL detenido y dato    Se observó que un resultado previamente cacheado podía seguir
  cacheado                            sirviéndose mientras estaba disponible en Redis.

  Frontend del health                 Se detectó y corrigió una referencia incorrecta a `data.redis`;
                                      el backend utiliza `data.cache`. También se retiró una línea
                                      accidental de shell (`cat > ...`) que se había introducido
                                      dentro de `health.js`.
  ---------------------------------------------------------------------------------------------------

Estas son pruebas manuales, no una suite automatizada. Antes de la
entrega, conviene repetirlas en una ejecución limpia y guardar las
salidas finales.

## Makefile y comandos útiles

Si el `Makefile` de la raíz contiene los objetivos previstos, se pueden
utilizar desde el directorio raíz:

``` bash
make up-dev
make up-prod
make down
```

El objetivo `down` puede detener uno o ambos entornos según cómo esté
definido. Revisa siempre el archivo antes de ejecutarlo. Para evitar
ambigüedades, los comandos Docker Compose explícitos de las secciones
anteriores sirven como alternativa.

Lista los objetivos disponibles:

``` bash
make help
```

Si `make help` no existe, inspecciona el archivo:

``` bash
cat Makefile
```

Para construir imágenes sin arrancar servicios:

``` bash
docker compose --env-file .env.dev -f docker-compose.dev.yml build
docker compose --env-file .env.prod -f docker-compose.prod.yml build
```

Para ver la configuración final de Compose (incluidas las variables
interpoladas; no publiques la salida si contiene secretos):

``` bash
docker compose --env-file .env.dev -f docker-compose.dev.yml config
docker compose --env-file .env.prod -f docker-compose.prod.yml config
```

## Persistencia de datos

MySQL utiliza volúmenes nombrados declarados en los archivos Compose.
Para comprobarlos:

``` bash
docker compose --env-file .env.dev -f docker-compose.dev.yml config
docker volume ls
```

La prueba de persistencia consiste en insertar un registro de prueba,
recrear el contenedor de base de datos sin borrar el volumen y verificar
que el registro sigue presente. Usa un registro identificable y
elimínalo al finalizar si no debe permanecer en los datos de la
práctica.

**No uses `docker compose down -v` ni `docker volume rm` durante la
comprobación**, porque esas operaciones pueden borrar los datos
persistidos.

## Solución de problemas

### El servicio web no arranca

``` bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 web
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Comprueba que `SESSION_SECRET` está definido si la aplicación lo
requiere y que los valores de entorno corresponden al Compose elegido.

### Error de conexión con MySQL (`EAI_AGAIN db`)

Este error indica que el contenedor web no pudo resolver el nombre DNS
`db` en ese momento, por ejemplo, durante una parada o recreación del
servicio.

``` bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100 db
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

Espera a que MySQL esté saludable y vuelve a consultar `/health`.

### Redis aparece como error en la interfaz

Comprueba primero el servicio y el endpoint:

``` bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec cache redis-cli ping
curl -s http://localhost:8080/health
```

Si Redis devuelve `PONG` y el endpoint informa `cache: "connected"`,
revisa que `app/public/js/health.js` lea `data.cache` y que los
indicadores se calculen independientemente de `response.ok`.

### Cambios de frontend que no aparecen

El proyecto puede copiar los archivos frontend dentro de la imagen.
Reconstruye el servicio web y fuerza su recreación:

``` bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build --force-recreate web
```

Después recarga el navegador con `Ctrl + Shift + R`.

## Seguridad

-   No subas `.env.dev` ni `.env.prod` con credenciales reales.
-   Usa secretos aleatorios para `SESSION_SECRET`.
-   No publiques los puertos de MySQL o Redis al host si no son
    necesarios.
-   No uses contraseñas de ejemplo en despliegues reales.
-   Mantén separados los datos de desarrollo y producción.
-   Para producción real, utiliza HTTPS y configura adecuadamente las
    cookies de sesión (`Secure`); el acceso local por HTTP puede
    requerir una configuración distinta.
-   Revisa que `.gitignore` excluya los archivos `.env` y que solo se
    versionen plantillas sin secretos, si se utilizan.

## Pendiente de verificar

Antes de entregar, verifica en el repositorio actual:

-   [ ] Que los nombres y objetivos reales del `Makefile` coinciden con
    las instrucciones (`up-dev`, `up-prod`, `down`).
-   [ ] Que todos los servicios tienen un `healthcheck` en Compose o en
    sus Dockerfiles y que `docker compose ps` refleja correctamente su
    estado.
-   [ ] Que los nombres de los volúmenes de dev y prod son distintos.
-   [ ] Que `.env.dev` y `.env.prod` están excluidos de Git y que no
    contienen valores de ejemplo inseguros.
-   [ ] Que la prueba de persistencia se ha ejecutado y documentado.
-   [ ] Que el endpoint y la interfaz muestran estados coherentes cuando
    MySQL cae y Redis sigue operativo.
-   [ ] Que el README refleja el último código después de los cambios
    recientes.

------------------------------------------------------------------------

**Nota:** este README documenta la configuración y las pruebas conocidas
durante el desarrollo. Los nombres exactos de volúmenes, healthchecks y
objetivos del `Makefile` deben contrastarse con los archivos actuales
del repositorio antes de dar por finalizada la entrega.
