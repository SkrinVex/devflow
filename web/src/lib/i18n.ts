export type Language = 'ru' | 'en';

export interface Translations {
  // Navigation & Header
  searchPlaceholder: string;
  clear: string;
  signInRegister: string;
  enable2FA: string;
  twoFAActive: string;
  settingsTitle: string;
  logOut: string;
  confirmLogoutTitle: string;
  confirmLogoutDesc: string;
  apiDocsBtn: string;

  // Mobile Bottom Navigation
  mobileNavAll: string;
  mobileNavPrompts: string;
  mobileNavCode: string;
  mobileNavSecrets: string;
  mobileNavNotes: string;

  // Sidebar / Views
  vaultViews: string;
  allItems: string;
  pinned: string;
  starred: string;
  categories: string;
  prompts: string;
  codeSnippets: string;
  secrets: string;
  notes: string;
  tags: string;
  clearTag: string;
  noTags: string;

  // Smart Capture
  capturePlaceholder: string;
  titlePlaceholder: string;
  saveToVault: string;
  saving: string;
  clearInput: string;
  saveShortcut: string;
  addTagPlaceholder: string;
  variables: string;
  typePrompt: string;
  typeCode: string;
  typeSecret: string;
  typeNote: string;

  // Feed & Cards
  copy: string;
  copied: string;
  copyAsMarkdown: string;
  markdownCopied: string;
  duplicate: string;
  duplicated: string;
  runTemplate: string;
  reveal: string;
  hide: string;
  unpin: string;
  pin: string;
  removeFromFavorites: string;
  addToFavorites: string;
  edit: string;
  delete: string;
  confirmDeleteTitle: string;
  confirmDeleteDesc: string;
  itemDeleted: string;
  savedToVault: string;
  updatedSuccessfully: string;
  filteredBy: string;
  clearAll: string;
  pinnedOnly: string;
  starredOnly: string;
  loadingSnippets: string;
  vaultEmptyTitle: string;
  vaultEmptySubtitle: string;
  noFilterMatchTitle: string;
  noFilterMatchSubtitle: string;
  resetFilters: string;
  sortBy: string;
  sortNewest: string;
  sortOldest: string;

  // Guest Hero & Global State
  guestWelcomeTitle: string;
  guestWelcomeSubtitle: string;
  loading: string;
  toastSaved: string;
  toastDeleted: string;
  toastDuplicated: string;
  toastCopied: string;
  welcomeBack: string;
  twoFAActivated: string;
  vaultUpdated: string;
  confirmSignOutTitle: string;
  confirmSignOutDesc: string;
  signOut: string;
  signedOut: string;

  // Prompt Runner Modal
  promptRunnerTitle: string;
  promptRunnerSubtitle: string;
  renderedPreview: string;
  copyInterpolated: string;
  cancel: string;
  templateLabel: string;
  fillVariables: string;
  interpolatedPreview: string;

  // Auth Modal
  signInTitle: string;
  signUpTitle: string;
  twoFATitle: string;
  twoFASubtitle: string;
  usernameOrEmail: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  signInButton: string;
  signUpButton: string;
  verifyButton: string;
  verifying: string;
  processing: string;
  passwordsMismatch: string;
  passwordWeak: string;
  strengthLabel: string;
  strengthVeryWeak: string;
  strengthWeak: string;
  strengthFair: string;
  strengthGood: string;
  strengthStrong: string;
  reqMinLength: string;
  reqLower: string;
  reqUpper: string;
  reqNumber: string;

  // 2FA Setup Modal
  twoFASetupTitle: string;
  twoFABackupTitle: string;
  twoFAScanInstructions: string;
  manualEntryKey: string;
  enterCodeToVerify: string;
  activate2FA: string;
  twoFABackupWarning: string;
  copyCodes: string;
  downloadTxt: string;
  savedDone: string;

  // Settings Modal
  tab2FA: string;
  tabPassword: string;
  tabVault: string;
  tabApiMcp: string;
  twoFAEnabledTitle: string;
  twoFADisabledTitle: string;
  twoFAEnabledDesc: string;
  twoFADisabledDesc: string;
  disable2FA: string;
  confirmPasswordToDisable: string;
  confirmDisable: string;
  enable2FAButton: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  updatePassword: string;
  passwordChangedSuccess: string;
  vaultBackupDescription: string;
  exportJsonButton: string;
  importJsonButton: string;
  exporting: string;
  importing: string;
  apiDocsIntro: string;
  openFullApiDocs: string;

  // Profile Modal
  developerProfile: string;
  accentColor: string;
  roleTitle: string;
  vaultStatistics: string;
  code: string;
  pwaInstalledBadge: string;
  installPwaButton: string;
  pwaManualGuide: string;
  quickExportVault: string;
  unprotected2FA: string;

  // Snippet Edit Modal
  editSnippetTitle: string;
  titleLabel: string;
  typeLabel: string;
  languageLabel: string;
  contentLabel: string;
  tagsLabel: string;
  addTagInputPlaceholder: string;
  saveChanges: string;

  // API & MCP Docs Modal
  apiDocsTitle: string;
  apiDocsSubtitle: string;
  tabRestApi: string;
  tabMcp: string;
  apiBaseUrl: string;
  apiAuthHeader: string;
  apiYourToken: string;
  apiCopyToken: string;
  apiTokenCopied: string;
  apiGroupAuth: string;
  apiGroupSnippets: string;
  apiGroupPrompts: string;
  apiGroupVault: string;
  apiExampleCurl: string;
  apiExampleJs: string;
  apiExamplePy: string;
  apiResponse: string;
  apiReqBody: string;

  // MCP Section
  mcpTitle: string;
  mcpSubtitle: string;
  mcpClaudeConfig: string;
  mcpCursorConfig: string;
  mcpToolsList: string;
  copyConfig: string;
  configCopied: string;
}

export const translations: Record<Language, Translations> = {
  ru: {
    // Navigation & Header
    searchPlaceholder: 'Поиск промптов, кода, заметок...',
    clear: 'Очистить',
    signInRegister: 'Войти / Регистрация',
    enable2FA: 'Включить 2FA',
    twoFAActive: '2FA активна',
    settingsTitle: 'Настройки и безопасность',
    logOut: 'Выйти',
    confirmLogoutTitle: 'Выход из аккаунта',
    confirmLogoutDesc: 'Вы уверены, что хотите выйти из хранилища?',
    apiDocsBtn: 'API & MCP Документация',

    // Mobile Bottom Navigation
    mobileNavAll: 'Все',
    mobileNavPrompts: 'Промпты',
    mobileNavCode: 'Код',
    mobileNavSecrets: 'Ключи',
    mobileNavNotes: 'Заметки',

    // Sidebar / Views
    vaultViews: 'Разделы',
    allItems: 'Все записи',
    pinned: 'Закреплённые',
    starred: 'Избранное',
    categories: 'Категории',
    prompts: 'AI Промпты',
    codeSnippets: 'Сниппеты кода',
    secrets: 'Секреты и ключи',
    notes: 'Заметки',
    tags: 'Теги',
    clearTag: 'Сбросить тег',
    noTags: 'Тегов пока нет. Они создаются автоматически при вставке.',

    // Smart Capture
    capturePlaceholder: 'Вставьте код, prompt, секрет или заметку (автоопределение типа)...',
    titlePlaceholder: 'Название (опционально, создаётся автоматически)...',
    saveToVault: 'Сохранить',
    saving: 'Сохранение...',
    clearInput: 'Очистить',
    saveShortcut: 'Ctrl+Enter для сохранения',
    addTagPlaceholder: 'тег...',
    variables: 'Переменные',
    typePrompt: 'Промпт',
    typeCode: 'Код',
    typeSecret: 'Секрет (AES-256)',
    typeNote: 'Заметка',

    // Feed & Cards
    copy: 'Копировать',
    copied: 'Скопировано!',
    copyAsMarkdown: 'Скопировать как Markdown код',
    markdownCopied: 'Markdown скопирован!',
    duplicate: 'Дублировать',
    duplicated: 'Дубликат создан',
    runTemplate: 'Запустить шаблон',
    reveal: 'Показать',
    hide: 'Скрыть',
    unpin: 'Открепить',
    pin: 'Закрепить',
    removeFromFavorites: 'Убрать из избранного',
    addToFavorites: 'В избранное',
    edit: 'Редактировать',
    delete: 'Удалить',
    confirmDeleteTitle: 'Удалить запись?',
    confirmDeleteDesc: 'Это действие удалит запись из вашего персонального хранилища безвозвратно.',
    itemDeleted: 'Запись удалена',
    savedToVault: 'Сохранено в хранилище',
    updatedSuccessfully: 'Запись успешно обновлена',
    filteredBy: 'Фильтр:',
    clearAll: 'Сбросить всё',
    pinnedOnly: 'Закреплённые',
    starredOnly: 'Избранные',
    loadingSnippets: 'Загрузка записей из хранилища...',
    vaultEmptyTitle: 'Хранилище пока пусто',
    vaultEmptySubtitle: 'Вставьте любой фрагмент кода, AI-промпт или секрет в поле выше — DevFlow автоматически определит тип и теги!',
    noFilterMatchTitle: 'Ничего не найдено',
    noFilterMatchSubtitle: 'Попробуйте изменить поисковый запрос или сбросить активные фильтры.',
    resetFilters: 'Сбросить фильтры',
    sortBy: 'Сортировка:',
    sortNewest: 'Сначала новые',
    sortOldest: 'Сначала старые',

    // Guest Hero & Global State
    guestWelcomeTitle: 'Умное персональное хранилище разработчика',
    guestWelcomeSubtitle: 'Сохраняйте AI-промпты, сниппеты кода, зашифрованные API-ключи и заметки с автоопределением типа и синхронизацией в реальном времени.',
    loading: 'Загрузка...',
    toastSaved: 'Запись сохранена',
    toastDeleted: 'Запись удалена',
    toastDuplicated: 'Запись продублирована',
    toastCopied: 'Скопировано в буфер обмена',
    welcomeBack: 'С возвращением!',
    twoFAActivated: '2FA успешно включена!',
    vaultUpdated: 'Хранилище обновлено!',
    confirmSignOutTitle: 'Выход из аккаунта',
    confirmSignOutDesc: 'Вы уверены, что хотите выйти из аккаунта?',
    signOut: 'Выйти',
    signedOut: 'Вы вышли из системы',

    // Prompt Runner Modal
    promptRunnerTitle: 'Запуск AI шаблона',
    promptRunnerSubtitle: 'Заполните параметры промпта для генерации готового текста',
    renderedPreview: 'Итоговый промпт:',
    copyInterpolated: 'Скопировать готовый промпт',
    cancel: 'Отмена',
    templateLabel: 'Шаблон',
    fillVariables: 'Параметры шаблона',
    interpolatedPreview: 'Готовый результат',

    // Auth Modal
    signInTitle: 'Вход в хранилище',
    signUpTitle: 'Создание аккаунта',
    twoFATitle: 'Двухфакторная аутентификация',
    twoFASubtitle: 'Введите 6-значный код из вашего приложения аутентификатора',
    usernameOrEmail: 'Имя пользователя или Email',
    username: 'Имя пользователя',
    email: 'Email адрес',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    signInButton: 'Войти',
    signUpButton: 'Создать аккаунт',
    verifyButton: 'Подтвердить вход',
    verifying: 'Проверка...',
    processing: 'Обработка...',
    passwordsMismatch: 'Пароли не совпадают',
    passwordWeak: 'Пароль слишком слабый',
    strengthLabel: 'Надёжность пароля:',
    strengthVeryWeak: 'Очень слабый',
    strengthWeak: 'Слабый',
    strengthFair: 'Средний',
    strengthGood: 'Надёжный',
    strengthStrong: 'Отличный',
    reqMinLength: 'Минимум 8 символов',
    reqLower: 'Строчные буквы (a-z)',
    reqUpper: 'Заглавные буквы (A-Z)',
    reqNumber: 'Цифры (0-9)',

    // 2FA Setup Modal
    twoFASetupTitle: 'Настройка 2FA защиты',
    twoFABackupTitle: 'Резервные коды 2FA',
    twoFAScanInstructions: 'Отсканируйте этот QR-код в приложении аутентификатора (Google Authenticator, 1Password, 2FAS) или введите ключ вручную.',
    manualEntryKey: 'Ключ для ручного ввода',
    enterCodeToVerify: 'Введите 6-значный код из приложения',
    activate2FA: 'Активировать 2FA',
    twoFABackupWarning: 'ВНИМАНИЕ: Сохраните эти одноразовые резервные коды в надёжном месте. Если вы потеряете доступ к телефону, они помогут восстановить вход.',
    copyCodes: 'Скопировать коды',
    downloadTxt: 'Скачать .txt',
    savedDone: 'Коды сохранены, готово',

    // Settings Modal
    tab2FA: '2FA Защита',
    tabPassword: 'Смена пароля',
    tabVault: 'Резервные копии',
    tabApiMcp: 'API & MCP',
    twoFAEnabledTitle: 'Двухфакторная защита активна',
    twoFADisabledTitle: 'Двухфакторная защита отключена',
    twoFAEnabledDesc: 'Ваш аккаунт защищён одноразовыми TOTP-кодами.',
    twoFADisabledDesc: 'Включите 2FA для максимальной защиты ваших секретов и ключей.',
    disable2FA: 'Отключить 2FA',
    confirmPasswordToDisable: 'Введите текущий пароль для отключения',
    confirmDisable: 'Подтвердить отключение',
    enable2FAButton: 'Настроить и включить 2FA',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmNewPassword: 'Подтвердите новый пароль',
    updatePassword: 'Обновить пароль',
    passwordChangedSuccess: 'Пароль успешно изменён!',
    vaultBackupDescription: 'Резервное копирование всех ваших сниппетов, промптов и тегов в JSON файл, а также восстановление из резервной копии.',
    exportJsonButton: 'Экспорт в JSON',
    importJsonButton: 'Импорт из JSON',
    exporting: 'Экспорт...',
    importing: 'Импорт...',
    apiDocsIntro: 'DevFlow предоставляет полноценный REST API и сервер Model Context Protocol (MCP) для управления хранилищем напрямую из AI-ассистентов (Claude Desktop, Cursor, VS Code).',
    openFullApiDocs: 'Открыть полную документацию REST API & MCP',

    // Profile Modal
    developerProfile: 'Профиль разработчика',
    accentColor: 'Цвет аватара',
    roleTitle: 'Специализация',
    vaultStatistics: 'Статистика хранилища',
    code: 'Код',
    pwaInstalledBadge: 'Приложение PWA установлено',
    installPwaButton: 'Установить как PWA приложение',
    pwaManualGuide: 'Чтобы установить PWA: откройте меню браузера (три точки или поделиться) и выберите «Добавить на главный экран».',
    quickExportVault: 'Быстрый экспорт хранилища (JSON)',
    unprotected2FA: '2FA отключена',

    // Snippet Edit Modal
    editSnippetTitle: 'Редактирование записи',
    titleLabel: 'Название',
    typeLabel: 'Тип записи',
    languageLabel: 'Язык программирования',
    contentLabel: 'Содержимое',
    tagsLabel: 'Теги',
    addTagInputPlaceholder: 'Добавить тег и нажать Enter...',
    saveChanges: 'Сохранить изменения',

    // API & MCP Docs Modal
    apiDocsTitle: 'REST API & Model Context Protocol (MCP)',
    apiDocsSubtitle: 'Интеграция персонального хранилища DevFlow со сторонними сервисами и AI-ассистентами.',
    tabRestApi: 'REST API',
    tabMcp: 'AI Агенты (MCP Server)',
    apiBaseUrl: 'Базовый URL:',
    apiAuthHeader: 'Заголовок авторизации:',
    apiYourToken: 'Ваш JWT токен:',
    apiCopyToken: 'Скопировать токен',
    apiTokenCopied: 'Токен скопирован!',
    apiGroupAuth: 'Аутентификация',
    apiGroupSnippets: 'Сниппеты & Поиск',
    apiGroupPrompts: 'AI Промпты',
    apiGroupVault: 'Экспорт & Синхронизация',
    apiExampleCurl: 'cURL',
    apiExampleJs: 'JavaScript (Fetch)',
    apiExamplePy: 'Python (Requests)',
    apiResponse: 'Пример ответа:',
    apiReqBody: 'Тело запроса (JSON):',

    // MCP Section
    mcpTitle: 'Интеграция с Claude Desktop, Cursor и AI-агентами',
    mcpSubtitle: 'Подключите DevFlow как MCP сервер к вашему любимому AI ассистенту, чтобы нейросеть могла искать промпты, запускать шаблоны и сохранять код напрямую в ваше хранилище.',
    mcpClaudeConfig: 'Конфигурация для Claude Desktop',
    mcpCursorConfig: 'Конфигурация для Cursor / VS Code (Roo Code)',
    mcpToolsList: 'Доступные инструменты (MCP Tools):',
    copyConfig: 'Скопировать JSON конфиг',
    configCopied: 'Конфиг скопирован!',
  },

  en: {
    // Navigation & Header
    searchPlaceholder: 'Search prompts, code, notes...',
    clear: 'Clear',
    signInRegister: 'Sign In / Register',
    enable2FA: 'Enable 2FA',
    twoFAActive: '2FA Active',
    settingsTitle: 'Settings & Security',
    logOut: 'Sign Out',
    confirmLogoutTitle: 'Sign Out',
    confirmLogoutDesc: 'Are you sure you want to sign out from your vault?',
    apiDocsBtn: 'API & MCP Documentation',

    // Mobile Bottom Navigation
    mobileNavAll: 'All',
    mobileNavPrompts: 'Prompts',
    mobileNavCode: 'Code',
    mobileNavSecrets: 'Keys',
    mobileNavNotes: 'Notes',

    // Sidebar / Views
    vaultViews: 'Views',
    allItems: 'All Items',
    pinned: 'Pinned',
    starred: 'Favorites',
    categories: 'Categories',
    prompts: 'AI Prompts',
    codeSnippets: 'Code Snippets',
    secrets: 'Secrets & Keys',
    notes: 'Notes',
    tags: 'Tags',
    clearTag: 'Clear tag filter',
    noTags: 'No tags yet. Created automatically on capture.',

    // Smart Capture
    capturePlaceholder: 'Paste code, prompt, secret or note (auto-detected)...',
    titlePlaceholder: 'Title (optional, auto-generated)...',
    saveToVault: 'Save',
    saving: 'Saving...',
    clearInput: 'Clear',
    saveShortcut: 'Ctrl+Enter to save',
    addTagPlaceholder: 'tag...',
    variables: 'Variables',
    typePrompt: 'Prompt',
    typeCode: 'Code',
    typeSecret: 'Secret (AES-256)',
    typeNote: 'Note',

    // Feed & Cards
    copy: 'Copy',
    copied: 'Copied!',
    copyAsMarkdown: 'Copy as Markdown',
    markdownCopied: 'Markdown copied!',
    duplicate: 'Duplicate',
    duplicated: 'Duplicated',
    runTemplate: 'Run Template',
    reveal: 'Reveal',
    hide: 'Hide',
    unpin: 'Unpin',
    pin: 'Pin',
    removeFromFavorites: 'Remove favorite',
    addToFavorites: 'Add to favorites',
    edit: 'Edit',
    delete: 'Delete',
    confirmDeleteTitle: 'Delete snippet?',
    confirmDeleteDesc: 'This action will permanently delete this item from your vault.',
    itemDeleted: 'Item deleted',
    savedToVault: 'Saved to vault',
    updatedSuccessfully: 'Snippet updated successfully',
    filteredBy: 'Filter:',
    clearAll: 'Clear all',
    pinnedOnly: 'Pinned',
    starredOnly: 'Favorites',
    loadingSnippets: 'Loading vault snippets...',
    vaultEmptyTitle: 'Vault is empty',
    vaultEmptySubtitle: 'Paste any snippet, prompt or secret in the box above — DevFlow will automatically classify type and tags!',
    noFilterMatchTitle: 'No matches found',
    noFilterMatchSubtitle: 'Try adjusting your search query or clearing active filters.',
    resetFilters: 'Reset filters',
    sortBy: 'Sort by:',
    sortNewest: 'Newest first',
    sortOldest: 'Oldest first',

    // Guest Hero & Global State
    guestWelcomeTitle: 'Smart Personal Developer Vault',
    guestWelcomeSubtitle: 'Store AI prompts, code snippets, encrypted API keys, and notes with auto-detection and real-time multi-device sync.',
    loading: 'Loading...',
    toastSaved: 'Saved to vault',
    toastDeleted: 'Item deleted',
    toastDuplicated: 'Snippet duplicated',
    toastCopied: 'Copied to clipboard',
    welcomeBack: 'Welcome back!',
    twoFAActivated: '2FA successfully activated!',
    vaultUpdated: 'Vault updated!',
    confirmSignOutTitle: 'Sign Out',
    confirmSignOutDesc: 'Are you sure you want to sign out?',
    signOut: 'Sign Out',
    signedOut: 'You have signed out',

    // Prompt Runner Modal
    promptRunnerTitle: 'Run AI Prompt Template',
    promptRunnerSubtitle: 'Fill prompt parameters to generate ready-to-use prompt',
    renderedPreview: 'Rendered Prompt:',
    copyInterpolated: 'Copy Rendered Prompt',
    cancel: 'Cancel',
    templateLabel: 'Template',
    fillVariables: 'Template Parameters',
    interpolatedPreview: 'Rendered Preview',

    // Auth Modal
    signInTitle: 'Sign in to Vault',
    signUpTitle: 'Create Account',
    twoFATitle: 'Two-Factor Authentication',
    twoFASubtitle: 'Enter the 6-digit code from your authenticator app',
    usernameOrEmail: 'Username or Email',
    username: 'Username',
    email: 'Email address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    signInButton: 'Sign In',
    signUpButton: 'Create Account',
    verifyButton: 'Verify & Login',
    verifying: 'Verifying...',
    processing: 'Processing...',
    passwordsMismatch: 'Passwords do not match',
    passwordWeak: 'Password is too weak',
    strengthLabel: 'Password Strength:',
    strengthVeryWeak: 'Very Weak',
    strengthWeak: 'Weak',
    strengthFair: 'Fair',
    strengthGood: 'Good',
    strengthStrong: 'Strong',
    reqMinLength: 'Min 8 characters',
    reqLower: 'Lowercase letter (a-z)',
    reqUpper: 'Uppercase letter (A-Z)',
    reqNumber: 'Number (0-9)',

    // 2FA Setup Modal
    twoFASetupTitle: 'Setup 2FA Protection',
    twoFABackupTitle: '2FA Emergency Backup Codes',
    twoFAScanInstructions: 'Scan this QR code in your authenticator app (Google Authenticator, 1Password, 2FAS) or enter the key manually.',
    manualEntryKey: 'Manual Secret Key',
    enterCodeToVerify: 'Enter 6-digit code from app',
    activate2FA: 'Activate 2FA',
    twoFABackupWarning: 'WARNING: Save these one-time backup codes securely. If you lose access to your authenticator device, they will allow you to regain access.',
    copyCodes: 'Copy Codes',
    downloadTxt: 'Download .txt',
    savedDone: 'Codes Saved, Done',

    // Settings Modal
    tab2FA: '2FA Security',
    tabPassword: 'Password',
    tabVault: 'Backup & Restore',
    tabApiMcp: 'API & MCP',
    twoFAEnabledTitle: 'Two-Factor Authentication Active',
    twoFADisabledTitle: 'Two-Factor Authentication Disabled',
    twoFAEnabledDesc: 'Your account is protected with TOTP one-time codes.',
    twoFADisabledDesc: 'Enable 2FA for maximum security of your secrets and keys.',
    disable2FA: 'Disable 2FA',
    confirmPasswordToDisable: 'Enter current password to disable',
    confirmDisable: 'Confirm Disable',
    enable2FAButton: 'Setup & Enable 2FA',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    updatePassword: 'Update Password',
    passwordChangedSuccess: 'Password changed successfully!',
    vaultBackupDescription: 'Full backup and restore of all your snippets, prompts, and tags to/from a JSON file.',
    exportJsonButton: 'Export to JSON',
    importJsonButton: 'Import from JSON',
    exporting: 'Exporting...',
    importing: 'Importing...',
    apiDocsIntro: 'DevFlow provides a REST API and Model Context Protocol (MCP) server for managing your vault directly from AI assistants (Claude Desktop, Cursor, VS Code).',
    openFullApiDocs: 'Open Full REST API & MCP Documentation',

    // Profile Modal
    developerProfile: 'Developer Profile',
    accentColor: 'Avatar Color',
    roleTitle: 'Developer Role',
    vaultStatistics: 'Vault Statistics',
    code: 'Code',
    pwaInstalledBadge: 'PWA App Installed',
    installPwaButton: 'Install as PWA App',
    pwaManualGuide: 'To install PWA: open browser menu (three dots or share) and select "Add to Home Screen".',
    quickExportVault: 'Quick Export Vault (JSON)',
    unprotected2FA: '2FA Disabled',

    // Snippet Edit Modal
    editSnippetTitle: 'Edit Snippet',
    titleLabel: 'Title',
    typeLabel: 'Snippet Type',
    languageLabel: 'Language',
    contentLabel: 'Content',
    tagsLabel: 'Tags',
    addTagInputPlaceholder: 'Add tag and press Enter...',
    saveChanges: 'Save Changes',

    // API & MCP Docs Modal
    apiDocsTitle: 'REST API & Model Context Protocol (MCP)',
    apiDocsSubtitle: 'Integrate your DevFlow vault with external tools and AI assistants.',
    tabRestApi: 'REST API',
    tabMcp: 'AI Agents (MCP Server)',
    apiBaseUrl: 'Base URL:',
    apiAuthHeader: 'Authorization Header:',
    apiYourToken: 'Your JWT Token:',
    apiCopyToken: 'Copy Token',
    apiTokenCopied: 'Token Copied!',
    apiGroupAuth: 'Authentication',
    apiGroupSnippets: 'Snippets & Search',
    apiGroupPrompts: 'AI Prompts',
    apiGroupVault: 'Export & Sync',
    apiExampleCurl: 'cURL',
    apiExampleJs: 'JavaScript (Fetch)',
    apiExamplePy: 'Python (Requests)',
    apiResponse: 'Example Response:',
    apiReqBody: 'Request Body (JSON):',

    // MCP Section
    mcpTitle: 'Integrate with Claude Desktop, Cursor, and AI Agents',
    mcpSubtitle: 'Connect DevFlow as an MCP server to your favorite AI assistant to search prompts, execute templates, and save code directly to your vault.',
    mcpClaudeConfig: 'Configuration for Claude Desktop',
    mcpCursorConfig: 'Configuration for Cursor / VS Code (Roo Code)',
    mcpToolsList: 'Available MCP Tools:',
    copyConfig: 'Copy JSON Config',
    configCopied: 'Config Copied!',
  },
};
