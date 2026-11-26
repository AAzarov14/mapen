export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Location-based Notes API',
    version: '1.0.0',
    description:
      'API сервиса заметок с привязкой к геопозиции и времени. ' +
      'Авторизация: JWT access-токен в заголовке Authorization, ' +
      'refresh-токен — в httpOnly cookie (для /auth/refresh и /auth/logout). ' +
      'Роли: USER, ADMIN.',
  },
  servers: [{ url: 'http://localhost:3000/api/v1', description: 'Локальный сервер' }],
  tags: [
    { name: 'Auth', description: 'Регистрация, вход, токены, профиль' },
    { name: 'Notes', description: 'Заметки: CRUD, публикация, гео- и время-фильтры' },
    { name: 'Tags', description: 'Теги заметок' },
    { name: 'Admin', description: 'Администрирование пользователей и заметок' },
  ],

  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'refreshToken' },
    },

    parameters: {
      PageParam: {
        name: 'page', in: 'query', description: 'Номер страницы',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      LimitParam: {
        name: 'limit', in: 'query', description: 'Размер страницы (1..100)',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
      NoteIdParam: {
        name: 'id', in: 'path', required: true, description: 'ID заметки',
        schema: { type: 'string' },
      },
      TagIdParam: {
        name: 'id', in: 'path', required: true, description: 'ID тега',
        schema: { type: 'string' },
      },
      UserIdParam: {
        name: 'id', in: 'path', required: true, description: 'ID пользователя',
        schema: { type: 'string' },
      },
    },

    schemas: {
      Role: { type: 'string', enum: ['USER', 'ADMIN'] },
      NoteStatus: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },

      PublicUser: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string', nullable: true },
          role: { $ref: '#/components/schemas/Role' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      AdminUser: {
        allOf: [
          { $ref: '#/components/schemas/PublicUser' },
          {
            type: 'object',
            properties: {
              isActive: { type: 'boolean' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },

      Tag: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      Note: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          status: { $ref: '#/components/schemas/NoteStatus' },
          latitude: { type: 'number', format: 'double', minimum: -90, maximum: 90 },
          longitude: { type: 'number', format: 'double', minimum: -180, maximum: 180 },
          locationName: { type: 'string', nullable: true },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time', nullable: true },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          author: { $ref: '#/components/schemas/PublicUser' },
          tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
          distanceMeters: {
            type: 'integer',
            description: 'Присутствует, если в запросе были lat и lng',
          },
        },
      },

      NoteCreate: {
        type: 'object',
        required: ['title', 'content', 'latitude', 'longitude', 'startsAt'],
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 120 },
          content: { type: 'string', minLength: 3, maxLength: 5000 },
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
          locationName: { type: 'string', maxLength: 255 },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time', description: 'Должно быть >= startsAt' },
          tagIds: { type: 'array', items: { type: 'string' } },
        },
        example: {
          title: 'Встреча у метро',
          content: 'Встречаемся у выхода №3',
          latitude: 55.751236,
          longitude: 37.618423,
          locationName: 'Метро Охотный Ряд',
          startsAt: '2026-11-26T18:00:00Z',
          endsAt: '2026-11-26T19:30:00Z',
          tagIds: [],
        },
      },

      NoteUpdate: {
        type: 'object',
        description: 'Любое подмножество полей заметки',
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 120 },
          content: { type: 'string', minLength: 3, maxLength: 5000 },
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
          locationName: { type: 'string', maxLength: 255 },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          tagIds: { type: 'array', items: { type: 'string' }, description: 'Полная замена набора тегов' },
        },
      },

      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 72 },
          displayName: { type: 'string', minLength: 2, maxLength: 50 },
        },
        example: { email: 'user@example.com', password: 'strongPassword123', displayName: 'Ivan' },
      },

      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },

      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },

      RoleRequest: {
        type: 'object',
        required: ['role'],
        properties: { role: { $ref: '#/components/schemas/Role' } },
      },

      UserUpdateRequest: {
        type: 'object',
        properties: {
          role: { $ref: '#/components/schemas/Role' },
          isActive: { type: 'boolean' },
          displayName: { type: 'string' },
        },
      },

      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'array', nullable: true, items: { type: 'object' } },
            },
          },
        },
      },

      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' },
        },
      },

      AuthSuccess: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/PublicUser' },
              accessToken: { type: 'string' },
            },
          },
        },
      },

      NoteResponse: {
        type: 'object',
        properties: { data: { $ref: '#/components/schemas/Note' } },
      },

      NoteListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
          meta: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },

      UserListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/AdminUser' } },
          meta: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },

      TagListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
        },
      },
    },

    responses: {
      ValidationError: {
        description: 'Ошибка валидации входных данных',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Unauthorized: {
        description: 'Нет access-токена или он невалиден',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Недостаточно прав',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Сущность не найдена',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'Конфликт (например, email уже занят)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },

  paths: {
    // ================= AUTH =================
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Регистрация пользователя (всегда роль USER)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          '201': {
            description: 'Пользователь создан, refresh-токен установлен в httpOnly cookie',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthSuccess' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Вход',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': {
            description: 'Успешный вход',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthSuccess' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Обновление access-токена (ротация refresh)',
        security: [{ refreshCookie: [] }],
        responses: {
          '200': {
            description: 'Новая пара токенов',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { type: 'object', properties: { accessToken: { type: 'string' } } } },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Выход (отзыв refresh-токена)',
        security: [{ refreshCookie: [] }],
        responses: { '204': { description: 'Сессия завершена' } },
      },
    },

    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Текущий пользователь',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Профиль',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/PublicUser' } } },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Смена пароля (все сессии отзываются)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } },
        },
        responses: {
          '204': { description: 'Пароль изменён' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ================= NOTES =================
    '/notes': {
      get: {
        tags: ['Notes'],
        summary: 'Список заметок с фильтрацией и пагинацией',
        description:
          'По умолчанию возвращает опубликованные заметки. ' +
          'Черновики/архив — только свои (или все для ADMIN). ' +
          'authorId=me — свои заметки, status=all — все свои статусы.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Поиск по title, content, locationName' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'archived', 'all'] } },
          { name: 'authorId', in: 'query', schema: { type: 'string' }, description: 'ID автора или "me"' },
          { name: 'tagIds', in: 'query', schema: { type: 'string' }, description: 'ID тегов через запятую' },
          { name: 'timeFrom', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Начало временного окна (пересечение с startsAt/endsAt)' },
          { name: 'timeTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'activeNow', in: 'query', schema: { type: 'boolean' }, description: 'Только активные в текущий момент' },
          { name: 'lat', in: 'query', schema: { type: 'number', minimum: -90, maximum: 90 } },
          { name: 'lng', in: 'query', schema: { type: 'number', minimum: -180, maximum: 180 } },
          { name: 'radius', in: 'query', schema: { type: 'number' }, description: 'Радиус в метрах (требует lat и lng)' },
          { name: 'minLat', in: 'query', schema: { type: 'number' }, description: 'Bounding box для карты' },
          { name: 'maxLat', in: 'query', schema: { type: 'number' } },
          { name: 'minLng', in: 'query', schema: { type: 'number' } },
          { name: 'maxLng', in: 'query', schema: { type: 'number' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['createdAt', '-createdAt', 'startsAt', '-startsAt', 'distance'], default: '-createdAt' } },
        ],
        responses: {
          '200': {
            description: 'Страница заметок',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteListResponse' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Notes'],
        summary: 'Создать заметку (статус DRAFT)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteCreate' } } },
        },
        responses: {
          '201': {
            description: 'Заметка создана',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteResponse' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/notes/{id}': {
      get: {
        tags: ['Notes'],
        summary: 'Заметка по ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/NoteIdParam' }],
        responses: {
          '200': { description: 'Заметка', content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Notes'],
        summary: 'Обновить заметку (автор или ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/NoteIdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteUpdate' } } },
        },
        responses: {
          '200': { description: 'Обновлённая заметка', content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteResponse' } } } },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Notes'],
        summary: 'Удалить заметку (soft delete)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/NoteIdParam' }],
        responses: {
          '204': { description: 'Удалена' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/notes/{id}/publish': {
      post: {
        tags: ['Notes'],
        summary: 'Опубликовать заметку',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/NoteIdParam' }],
        responses: {
          '200': { description: 'Заметка опубликована', content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteResponse' } } } },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/notes/{id}/archive': {
      post: {
        tags: ['Notes'],
        summary: 'Архивировать заметку',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/NoteIdParam' }],
        responses: {
          '200': { description: 'Заметка в архиве', content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteResponse' } } } },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/notes/{id}/restore': {
      post: {
        tags: ['Notes'],
        summary: 'Восстановить удалённую заметку',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/NoteIdParam' }],
        responses: {
          '200': { description: 'Заметка восстановлена', content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteResponse' } } } },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ================= TAGS =================
    '/tags': {
      get: {
        tags: ['Tags'],
        summary: 'Список тегов',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Теги', content: { 'application/json': { schema: { $ref: '#/components/schemas/TagListResponse' } } } },
        },
      },
      post: {
        tags: ['Tags'],
        summary: 'Создать тег (только ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
            },
          },
        },
        responses: {
          '201': { description: 'Тег создан', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Tag' } } } } } },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },

    '/tags/{id}': {
      patch: {
        tags: ['Tags'],
        summary: 'Переименовать тег (только ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TagIdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
        },
        responses: {
          '200': { description: 'Тег обновлён' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Tags'],
        summary: 'Удалить тег (только ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TagIdParam' }],
        responses: {
          '204': { description: 'Тег удалён' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ================= ADMIN =================
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Список пользователей (только ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { $ref: '#/components/schemas/Role' } },
        ],
        responses: {
          '200': { description: 'Страница пользователей', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserListResponse' } } } },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/admin/users/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Пользователь по ID (только ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/UserIdParam' }],
        responses: {
          '200': { description: 'Пользователь', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/AdminUser' } } } } } },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Обновить пользователя (только ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/UserIdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserUpdateRequest' } } },
        },
        responses: {
          '200': { description: 'Обновлённый пользователь' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/admin/users/{id}/role': {
      patch: {
        tags: ['Admin'],
        summary: 'Сменить роль пользователя (только ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/UserIdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RoleRequest' } } },
        },
        responses: {
          '200': { description: 'Роль изменена' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/admin/users/{id}/activate': {
      post: {
        tags: ['Admin'],
        summary: 'Активировать пользователя',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/UserIdParam' }],
        responses: { '200': { description: 'Пользователь активен' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },

    '/admin/users/{id}/deactivate': {
      post: {
        tags: ['Admin'],
        summary: 'Деактивировать пользователя',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/UserIdParam' }],
        responses: { '200': { description: 'Пользователь деактивирован' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },

    '/admin/notes': {
      get: {
        tags: ['Admin'],
        summary: 'Все заметки, включая чужие черновики (только ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'archived', 'all'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Страница заметок', content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteListResponse' } } } },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/admin/notes/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Удалить заметку (soft; hard=true — физически)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/NoteIdParam' },
          { name: 'hard', in: 'query', schema: { type: 'boolean', default: false } },
        ],
        responses: { '204': { description: 'Удалена' }, '403': { $ref: '#/components/responses/Forbidden' }, '404': { $ref: '#/components/responses/NotFound' } },
      },
    },

    '/admin/notes/{id}/restore': {
      post: {
        tags: ['Admin'],
        summary: 'Восстановить заметку (только ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/NoteIdParam' }],
        responses: { '200': { description: 'Восстановлена' }, '403': { $ref: '#/components/responses/Forbidden' }, '404': { $ref: '#/components/responses/NotFound' } },
      },
    },

    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Сводная статистика (только ADMIN)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Статистика',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        users: { type: 'object', properties: { total: { type: 'integer' }, active: { type: 'integer' }, inactive: { type: 'integer' } } },
                        notes: { type: 'object', properties: { total: { type: 'integer' }, published: { type: 'integer' }, draft: { type: 'integer' }, archived: { type: 'integer' }, deleted: { type: 'integer' } } },
                      },
                    },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
};