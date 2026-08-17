<div align="center">

# ⚡ DevFlow

**Self-Hosted Developer Knowledge Vault & Smart Prompt Manager**  
*Перестаньте хранить промпты для нейросетей, куски кода, секреты и заметки в Избранном Telegram.*

[![Go Version](https://img.shields.io/badge/Go-1.24%2B-00ADD8?style=flat&logo=go)](https://golang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=flat&logo=sqlite)](https://sqlite.org)
[![Port](https://img.shields.io/badge/Port-1451-6366F1?style=flat)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://docker.com)
[![Coolify](https://img.shields.io/badge/Coolify-Compatible-9333EA?style=flat)](https://coolify.io)

</div>

---

## 📖 О проекте (About DevFlow)

**DevFlow** — это приватное, быстрое и защищенное персональное хранилище для разработчиков в духе *Bitwarden meets Raycast/Scratchpad*. 

### Почему DevFlow?
Многие разработчики используют **"Избранное" (Saved Messages)** в Telegram, чтобы быстро скидывать промпты для ChatGPT/Claude, SQL-запросы, конфигурации Docker, токены и заметки. Но со временем там образуется хаос: невозможно быстро найти нужный промпт, нет автоопределения языка, нет шаблонизации параметров, а хранить секреты в чатах небезопасно.

**DevFlow решает это раз и навсегда:**
- ⚡ **Smart Quick-Drop / Instant Capture**: Просто вставьте любой текст в поле на главной — система мгновенно определит, что это (AI Промпт, код на Go/Python/SQL/TS, секрет или заметка).
- 🎨 **Подсветка синтаксиса (Prism.js)**: Реальная подсветка кода для Go, Python, SQL, TypeScript/JavaScript, Bash, Dockerfile, YAML, JSON и Markdown.
- 🏷️ **Автоматические хештеги и теги**: Авто-генерация тегов (`#prompt`, `#sql`, `#golang`, `#docker`, `#jwt`) и ручные теги.
- 📋 **Мгновенное копирование в 1 клик + Markdown**: Быстрое копирование чистого текста или готового Markdown блока (` ```lang ... ``` `).
- 🧩 **Интерактивный запуск промптов (Prompt Runner)**: Если в промпте есть переменные вида `{{technology}}` или `{{task}}`, вы можете заполнить их в модальном окне и скопировать готовый промпт в 1 клик.
- 🌐 **Автоопределение языка + Переключатель (RU / EN)**: Локализация всех экранов и диалогов с мгновенным переключением в шапке.
- 🔐 **Безопасность уровня Bitwarden**:
  - Хеширование паролей **Argon2id** с проверкой энтропии и сложности пароля в реальном времени.
  - Двухфакторная аутентификация **Google Authenticator / TOTP (RFC 6238)** с QR-кодами и 8 аварийными кодами восстановления.
  - Защита от брутфорса и Rate Limiting (Token Bucket).
  - Скрытие/маскирование секретов и токенов.
- 📊 **Статистика и бэкапы хранилища**: Сводка по промптам, коду, строкам и экспорт/импорт всей базы в JSON.
- 💬 **Стилизованные диалоговые окна**: Все подтверждения (удаление, выход из аккаунта) выполнены в едином UI без нативных `alert`/`confirm`.
- 📱 **Полная оптимизация под Android и мобильные устройства**: Нижняя навигационная панель, удобные тач-таргеты и адаптивная верстка.
- 🚀 **Работает на порту `1451`** в едином легковесном Docker-контейнере.

---

## 🏗 Архитектура (Clean Architecture)

Проект построен по принципам **Чистой Архитектуры (Clean Architecture)**:

```
devflow/
├── cmd/
│   └── server/main.go            # Точка входа, Graceful Shutdown, инициализация
├── internal/
│   ├── config/                   # Конфигурация из переменных окружения (Port :1451, /data)
│   ├── domain/                   # Сущности, модели и интерфейсы репозиториев
│   ├── repository/sqlite/        # Чистый SQLite (WAL-режим, Foreign Keys, миграции)
│   ├── security/                 # Хешер Argon2id, JWT, Google 2FA (TOTP), Smart Content Detector
│   ├── service/                  # Бизнес-логика (Auth, Snippets, Prompt Runner, Vault)
│   ├── api/                      # HTTP роутинг, Middleware (Auth, RateLimit, CORS, CSP) и Handlers
│   └── assets/                   # Встроенный статический фронтенд (embed.FS)
├── web/                          # React 19 + TypeScript + Vite SPA веб-клиент
├── Dockerfile                    # Оптимизированный Multi-Stage билд
├── docker-compose.yml            # Compose файл с Volume
└── README.md
```

---

## 🚀 Развертывание в Coolify (Coolify Deployment Guide)

DevFlow идеально подходит для развертывания через **Coolify** в пару кликов:

### Шаг 1: Добавление проекта в Coolify
1. В панели Coolify перейдите в **Projects** → выберите ваше окружение → **+ New Resource**.
2. Выберите **Public/Private Git Repository** и укажите ссылку на ваш репозиторий GitHub с DevFlow.
3. Coolify автоматически обнаружит `Dockerfile`.

### Шаг 2: Настройка портов и Volumes (КРИТИЧНО)
В настройках приложения в Coolify задайте:

1. **Ports Configuration**:
   - **Exposed Port**: `1451` *(DevFlow слушает порт 1451)*.
2. **Persistent Storage (Volumes)**:
   - Чтобы база данных SQLite и секреты не удалялись при повторных деплоях, добавьте Volume:
   - **Destination Path**: `/data`
   - *(Coolify создаст постоянный volume, например `devflow_data:/data`)*.

### Шаг 3: Переменные окружения (Environment Variables)
В разделе **Environment Variables** в Coolify можно указать:

```env
PORT=1451
HOST=0.0.0.0
DATA_DIR=/data
APP_ENV=production
JWT_SECRET=your_super_secret_random_key_here_min_32_chars
ENABLE_REGISTRATION=true
```

> **Примечание:** Если `JWT_SECRET` не указан, DevFlow автоматически сгенерирует криптографически стойкий 256-битный ключ и сохранит его в `/data/.jwt_secret`, поэтому он не сбросится при перезапуске!

### Шаг 4: Деплой
Нажмите **Deploy**. После завершения сборки ваш персональный DevFlow будет доступен по вашему домену с автоматическим SSL от Coolify!

---

## 🐳 Запуск через Docker & Docker Compose

### С использованием Docker Compose:
```bash
# 1. Клонируйте репозиторий
git clone https://github.com/your-username/devflow.git
cd devflow

# 2. Запустите в фоне
docker compose up -d --build

# 3. Откройте в браузере
# http://localhost:1451
```

### С использованием Docker CLI:
```bash
# Сборка образа
docker build -t devflow:latest .

# Запуск с сохранением данных в volume
docker run -d \
  --name devflow \
  -p 1451:1451 \
  -v devflow_data:/data \
  --restart unless-stopped \
  devflow:latest
```

---

## 💻 Локальное тестирование и разработка на Windows (Local Development)

### Требования:
- **Go** 1.22+ ([скачать с golang.org](https://golang.org/dl/))
- **Node.js** 20+ и npm ([скачать с nodejs.org](https://nodejs.org/))

### Быстрый запуск бэкенда и фронтенда:

#### Вариант А: Единый собранный бинарник (Как в проде)
В PowerShell выполните:

```powershell
# 1. Сборка веб-клиента
cd web
npm install
npm run build
cd ..

# 2. Копирование собранных файлов для embed в Go
Copy-Item -Recurse -Force web\dist\* internal\assets\dist\

# 3. Запуск Go сервера
go run cmd\server\main.go
```
Откройте: **`http://localhost:1451`**

---

#### Вариант Б: Режим активной разработки (Hot-Reload)
Для разработки с мгновенным обновлением UI:

**Терминал 1 (Go Backend):**
```powershell
go run cmd\server\main.go
# Сервер запустится на http://localhost:1451
```

**Терминал 2 (Vite Dev Server):**
```powershell
cd web
npm install
npm run dev
# Vite запустится на http://localhost:5173 и будет автоматически проксировать /api на порт 1451
```

---

## 🧪 Запуск автоматических тестов

```bash
# Запуск всех модульных тестов бэкенда (Security, Argon2id, TOTP 2FA, SQLite CRUD, Detector)
go test -v ./...
```

---

## 🔐 Безопасность и Резервное копирование (Backups)

1. **База данных SQLite**:
   - База данных хранится в одном файле `devflow.db` (с WAL-журналом `devflow.db-wal` и `devflow.db-shm`) в директории `/data`.
   - Для создания резервной копии достаточно скопировать файл `devflow.db` или воспользоваться встроенной функцией **"Export Vault"** в настройках приложения (выгрузит все сниппеты и промпты в JSON-формат).

2. **Двухфакторная аутентификация (2FA)**:
   - Поддерживает стандартные приложения (Google Authenticator, Apple Passwords, 1Password, Bitwarden, 2FAS, Authy).
   - При активации генерируются **8 резервных кодов**, которые можно скопировать или скачать в `.txt`.

3. **Ограничение регистрации**:
   - После создания первого аккаунта вы можете отключить регистрацию новых пользователей, установив переменную окружения:
   ```env
   ENABLE_REGISTRATION=false
   ```

---

## ⌨️ Горячие клавиши (Keyboard Shortcuts)

- `Ctrl + Enter` (или `Cmd + Enter` на Mac) — Мгновенно сохранить заметку / сниппет из поля быстрого ввода.
- `Ctrl + K` — Фокус в строку глобального поиска.
- Клик по `#хештегу` — Мгновенная фильтрация ленты по выбранному тегу.
- Кнопка **"Run Template"** на карточке промпта — Заполнение переменных `{{variable}}` и копирование готового промпта.

---

## 📄 Лицензия

Распространяется под лицензией **MIT License**. Свободно для личного и коммерческого использования.
