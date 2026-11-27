# Mapen Server

Сервис заметок с привязкой к геопозиции и времени. REST API на Express + TypeScript с JWT-авторизацией, ролевой моделью (USER/ADMIN) и гео-фильтрацией.

## Стек

- **Runtime:** Node.js 22, TS
- **Framework:** Express
- **База данных:** Postgres + Prisma 7
- **Валидация:** Zod
- **Авторизация:** JWT (access в заголовке, refresh в cookie)
- **Документация:** Swagger
- **Тесты:** Jest + Supertest
- **Контейнеризация:** Docker Compose

## Структура проекта

```
server/
├── src/
│   ├── modules/          # Бизнес-логика по доменам
│   │   ├── auth/         # Регистрация, логин, токены
│   │   ├── notes/        # Заметки (CRUD, фильтры, гео)
│   │   └── admin/        # Администрирование
│   ├── middlewares/      # Auth, RBAC, валидация, обработка ошибок
│   ├── utils/            # JWT, пароли, ошибки
│   ├── lib/prisma.ts     # Singleton PrismaClient
│   ├── docs/openapi.ts   # Swagger-спека
│   ├── app.ts            # Сборка Express
│   └── server.ts         # Точка входа
├── prisma/
│   ├── schema.prisma     # Схема БД
│   └── migrations/       # Миграции
├── tests/                # Интеграционные тесты
├── Dockerfile
└── docker-compose.yml
```

## Быстрый старт

### Локальная разработка

```bash
# 1. Зависимости
cd server
npm install

# 2. Заполнение env
cp .env.example .env

# 3. postgres
docker compose up -d db adminer

# 4. миграции и сид
npm run prisma:migrate
npm run prisma:seed

# 5. dev-сервер
npm run dev
```

API доступен на `http://localhost:3000`, Swagger на `/api/v1/docs`.

### Docker (prod-подобный запуск)

```bash
# из корня проекта (mapen/)
docker compose up --build -d
docker compose logs -f api
```

Сервисы:
- **API:** `http://localhost:3000`
- **PostgreSQL:** `localhost:5432`
- **Adminer:** `http://localhost:8080` (system: PostgreSQL, server: db, user: postgres, password: postgres)

## Основные API эндпоинты

### Auth (`/api/v1/auth`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/register` | Регистрация (роль USER) |
| POST | `/login` | Вход |
| POST | `/refresh` | Обновление access-токена (cookie) |
| POST | `/logout` | Выход (отзыв refresh) |
| GET | `/me` | Текущий пользователь |
| POST | `/change-password` | Смена пароля |

### Notes (`/api/v1/notes`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Список с фильтрами (geo, время, статус, теги) |
| POST | `/` | Создать заметку (DRAFT) |
| GET | `/:id` | Получить заметку |
| PATCH | `/:id` | Обновить заметку |
| DELETE | `/:id` | Удалить (soft delete) |
| POST | `/:id/publish` | Опубликовать |
| POST | `/:id/archive` | Архивировать |
| POST | `/:id/restore` | Восстановить |

### Admin (`/api/v1/admin`) - только ADMIN

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/users` | Список пользователей |
| PATCH | `/users/:id` | Обновить пользователя |
| PATCH | `/users/:id/role` | Сменить роль |
| POST | `/users/:id/activate` | Активировать |
| POST | `/users/:id/deactivate` | Деактивировать |

## Тесты

```bash
# тестовая БД (один раз)
docker compose exec db psql -U postgres -c "CREATE DATABASE location_notes_test;"

# запустить тестирование
npm test
```

8 интеграционных тестов покрывают: регистрацию, логин, валидацию, видимость черновиков, гео-фильтры, RBAC.

## Переменные окружения

В `.env.example` ключевые:

- `DATABASE_URL` - строка подключения PostgreSQL
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - секреты подписи токенов
- `ACCESS_TOKEN_TTL` - время жизни access-токена (например, `15m`)
- `REFRESH_TTL_DAYS` - время жизни refresh-токена в днях
- `CLIENT_URL` - origin фронтенда для CORS
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` - учетка админа для сида

## Полезные команды

```bash
npm run dev              # dev
npm run build            # сборка
npm run prisma:generate  # генерация клиента prisma
npm run prisma:migrate   # миграции
npm run prisma:seed      # сид (админ + тестовый пользователь)
npm test                 # тесты
```

## Лицензия

MIT