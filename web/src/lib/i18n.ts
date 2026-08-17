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

  // Guest Hero
  heroTitle: string;
  heroSubtitle: string;
  getStarted: string;

  // Prompt Runner Modal
  promptRunnerTitle: string;
  promptRunnerSubtitle: string;
  renderedPreview: string;
  copyInterpolated: string;
  cancel: string;

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
  twoFAScanSubtitle: string;
  orManualKey: string;
  copyKey: string;
  keyCopied: string;
  enter6DigitCode: string;
  activate2FA: string;
  activating: string;
  backupCodesTitle: string;
  backupCodesWarning: string;
  copyAllCodes: string;
  codesCopied: string;
  downloadTxt: string;
  codesSavedConfirm: string;

  // Settings Modal
  settingsModalTitle: string;
  tabSecurity: string;
  tabPassword: string;
  tabVault: string;
  tabApi: string;
  twoFAEnabledStatus: string;
  twoFADisabledStatus: string;
  twoFAEnabledDesc: string;
  twoFADisabledDesc: string;
  disable2FAButton: string;
  confirmDisableTitle: string;
  confirmDisableButton: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  updatePasswordButton: string;
  updating: string;
  passwordUpdated: string;
  exportTitle: string;
  exportSubtitle: string;
  exportButton: string;
  importTitle: string;
  importSubtitle: string;
  importButton: string;
  importSuccess: string;

  // Profile Modal
  profileTitle: string;
  userIdLabel: string;
  idCopied: string;
  copyId: string;
  memberSince: string;
  securityStatus: string;
  protectedBy2FA: string;
  unprotected2FA: string;
  setup2FANow: string;
  developerRoleLabel: string;
  customAvatarColor: string;
  vaultSnapshot: string;
  openSettingsBtn: string;

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
  apiGroupUtils: string;
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
    capturePlaceholder: 'Быстрый ввод: вставьте промпт, код, секрет или заметку...',
    titlePlaceholder: 'Название (опционально)...',
    saveToVault: 'Сохранить',
    saving: 'Сохранение...',
    clearInput: 'Очистить',
    saveShortcut: 'Ctrl+Enter для сохранения',
    addTagPlaceholder: '+ тег',
    variables: 'Переменные:',
    typePrompt: 'AI Промпт',
    typeCode: 'Код',
    typeSecret: 'Секрет',
    typeNote: 'Заметка',

    // Feed & Cards
    copy: 'Копировать',
    copied: 'Скопировано!',
    copyAsMarkdown: 'Скопировать как Markdown',
    markdownCopied: 'Markdown скопирован!',
    duplicate: 'Дублировать',
    duplicated: 'Запись продублирована!',
    runTemplate: 'Заполнить шаблон',
    reveal: 'Показать',
    hide: 'Скрыть',
    unpin: 'Открепить',
    pin: 'Закрепить сверху',
    removeFromFavorites: 'Убрать из избранного',
    addToFavorites: 'Добавить в избранное',
    edit: 'Редактировать',
    delete: 'Удалить',
    confirmDeleteTitle: 'Удаление записи',
    confirmDeleteDesc: 'Эта запись будет безвозвратно удалена из хранилища. Продолжить?',
    itemDeleted: 'Запись удалена',
    savedToVault: 'Сохранено в хранилище!',
    updatedSuccessfully: 'Запись обновлена!',
    filteredBy: 'Фильтр:',
    clearAll: 'Сбросить',
    pinnedOnly: 'Закрепленные',
    starredOnly: 'Избранные',
    loadingSnippets: 'Загрузка записей...',
    vaultEmptyTitle: 'Хранилище пусто',
    vaultEmptySubtitle: 'Вставьте промпт, код или заметку в поле выше, чтобы добавить первую запись.',
    noFilterMatchTitle: 'Ничего не найдено',
    noFilterMatchSubtitle: 'Попробуйте изменить поисковый запрос или сбросить фильтры.',
    resetFilters: 'Сбросить фильтры',
    sortBy: 'Сортировка:',
    sortNewest: 'Сначала новые',
    sortOldest: 'Сначала старые',

    // Guest Hero
    heroTitle: 'Персональное хранилище промптов и сниппетов',
    heroSubtitle: 'Забудьте о хаосе в «Избранном» Telegram. DevFlow автоматически определяет язык кода, вытягивает переменные из промптов, создает теги и позволяет копировать любой контент в один клик.',
    getStarted: 'Начать работу',

    // Prompt Runner Modal
    promptRunnerTitle: 'Запуск шаблона промпта',
    promptRunnerSubtitle: 'Заполните параметры ниже, чтобы сгенерировать готовый промпт для ChatGPT, Claude или Midjourney.',
    renderedPreview: 'Предпросмотр результата:',
    copyInterpolated: 'Скопировать готовый промпт',
    cancel: 'Отмена',

    // Auth Modal
    signInTitle: 'Вход в DevFlow',
    signUpTitle: 'Создание аккаунта',
    twoFATitle: 'Двухфакторная проверка',
    twoFASubtitle: 'Введите 6-значный код из Google Authenticator или резервный код.',
    usernameOrEmail: 'Имя пользователя или Email',
    username: 'Имя пользователя',
    email: 'Email адрес',
    password: 'Пароль',
    confirmPassword: 'Подтверждение пароля',
    signInButton: 'Войти',
    signUpButton: 'Создать аккаунт',
    verifyButton: 'Подтвердить',
    verifying: 'Проверка...',
    processing: 'Обработка...',
    passwordsMismatch: 'Пароли не совпадают',
    passwordWeak: 'Пароль не соответствует требованиям безопасности',
    strengthLabel: 'Надёжность пароля:',
    strengthVeryWeak: 'Очень слабый',
    strengthWeak: 'Слабый',
    strengthFair: 'Средний',
    strengthGood: 'Хороший',
    strengthStrong: 'Надёжный',
    reqMinLength: 'Минимум 8 символов',
    reqLower: 'Строчные буквы (a-z)',
    reqUpper: 'Заглавные буквы (A-Z)',
    reqNumber: 'Цифры (0-9)',

    // 2FA Setup Modal
    twoFASetupTitle: 'Настройка двухфакторной аутентификации (2FA)',
    twoFAScanSubtitle: 'Отсканируйте QR-код в приложении Google Authenticator, 1Password или Bitwarden на смартфоне.',
    orManualKey: 'Или введите ключ вручную:',
    copyKey: 'Копировать ключ',
    keyCopied: 'Ключ скопирован',
    enter6DigitCode: 'Введите 6-значный код из приложения:',
    activate2FA: 'Активировать 2FA',
    activating: 'Активация...',
    backupCodesTitle: 'Сохраните резервные коды',
    backupCodesWarning: 'Внимание: если вы потеряете доступ к телефону, эти 8 кодов — единственный способ войти в аккаунт.',
    copyAllCodes: 'Скопировать все коды',
    codesCopied: 'Коды скопированы!',
    downloadTxt: 'Скачать .txt',
    codesSavedConfirm: 'Я сохранил резервные коды',

    // Settings Modal
    settingsModalTitle: 'Настройки и безопасность',
    tabSecurity: '2FA Защита',
    tabPassword: 'Пароль',
    tabVault: 'Бэкап',
    tabApi: 'REST API & MCP',
    twoFAEnabledStatus: 'Двухфакторная аутентификация включена',
    twoFADisabledStatus: 'Двухфакторная аутентификация выключена',
    twoFAEnabledDesc: 'Аккаунт защищен кодами Google Authenticator (TOTP)',
    twoFADisabledDesc: 'Включите 2FA для надежной защиты хранилища от кражи пароля',
    disable2FAButton: 'Отключить 2FA',
    confirmDisableTitle: 'Введите пароль для отключения 2FA:',
    confirmDisableButton: 'Подтвердить отключение',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmNewPassword: 'Подтвердите новый пароль',
    updatePasswordButton: 'Обновить пароль',
    updating: 'Обновление...',
    passwordUpdated: 'Пароль успешно изменён!',
    exportTitle: 'Экспорт хранилища',
    exportSubtitle: 'Скачать полный JSON-архив всех промптов, кода и заметок',
    exportButton: 'Скачать JSON',
    importTitle: 'Импорт из копии',
    importSubtitle: 'Восстановить записи из JSON-файла',
    importButton: 'Выбрать файл',
    importSuccess: 'Успешно импортировано записей:',

    // Profile Modal
    profileTitle: 'Профиль разработчика',
    userIdLabel: 'ID пользователя:',
    idCopied: 'ID скопирован!',
    copyId: 'Копировать ID',
    memberSince: 'В DevFlow с:',
    securityStatus: 'Безопасность аккаунта:',
    protectedBy2FA: 'Защищен 2FA (Google TOTP)',
    unprotected2FA: '2FA не подключена (рекомендуется)',
    setup2FANow: 'Подключить 2FA',
    developerRoleLabel: 'Специализация / Роль:',
    customAvatarColor: 'Цвет аватара:',
    vaultSnapshot: 'Сводка хранилища:',
    openSettingsBtn: 'Открыть настройки',

    // API & MCP Docs Modal
    apiDocsTitle: 'Интеграция: REST API & AI MCP Server',
    apiDocsSubtitle: 'Управляйте своим хранилищем DevFlow через REST API или подключите напрямую к AI Агентам (Claude Desktop, Cursor, Antigravity, VS Code, Roo Code).',
    tabRestApi: 'REST API',
    tabMcp: 'AI Агенты (MCP Server)',
    apiBaseUrl: 'Базовый URL:',
    apiAuthHeader: 'Заголовок авторизации:',
    apiYourToken: 'Ваш активный JWT токен:',
    apiCopyToken: 'Скопировать токен',
    apiTokenCopied: 'Токен скопирован!',
    apiGroupAuth: 'Аутентификация и 2FA',
    apiGroupSnippets: 'Записи и Сниппеты',
    apiGroupPrompts: 'AI Промпты и Шаблонизатор',
    apiGroupVault: 'Экспорт и Импорт',
    apiGroupUtils: 'Служебные эндпоинты',
    apiExampleCurl: 'cURL',
    apiExampleJs: 'JavaScript (Fetch)',
    apiExamplePy: 'Python (Requests)',
    apiResponse: 'Ответ сервера (JSON):',
    apiReqBody: 'Тело запроса (JSON):',

    // MCP Section
    mcpTitle: 'Model Context Protocol (MCP) Сервер',
    mcpSubtitle: 'DevFlow реализует стандартный протокол MCP (JSON-RPC 2.0). Ваши AI-ассистенты смогут автоматически искать нужные промпты, сохранять куски кода, доставать ключи и заполнять шаблоны прямо во время диалога!',
    mcpClaudeConfig: 'Конфигурация для Claude Desktop',
    mcpCursorConfig: 'Конфигурация для Cursor / VS Code / Roo Code',
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
    logOut: 'Log out',
    confirmLogoutTitle: 'Log out',
    confirmLogoutDesc: 'Are you sure you want to sign out of your vault?',
    apiDocsBtn: 'API & MCP Docs',

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
    starred: 'Starred',
    categories: 'Categories',
    prompts: 'AI Prompts',
    codeSnippets: 'Code Snippets',
    secrets: 'Secrets & Keys',
    notes: 'Notes',
    tags: 'Tags',
    clearTag: 'Clear tag',
    noTags: 'No tags yet. Auto-tags are created when pasting content.',

    // Smart Capture
    capturePlaceholder: 'Quick capture: paste a prompt, code snippet, or note...',
    titlePlaceholder: 'Title (optional)...',
    saveToVault: 'Save',
    saving: 'Saving...',
    clearInput: 'Clear',
    saveShortcut: 'Ctrl+Enter to save',
    addTagPlaceholder: '+ tag',
    variables: 'Variables:',
    typePrompt: 'AI Prompt',
    typeCode: 'Code',
    typeSecret: 'Secret',
    typeNote: 'Note',

    // Feed & Cards
    copy: 'Copy',
    copied: 'Copied!',
    copyAsMarkdown: 'Copy as Markdown',
    markdownCopied: 'Markdown copied!',
    duplicate: 'Duplicate',
    duplicated: 'Snippet duplicated!',
    runTemplate: 'Run Template',
    reveal: 'Reveal',
    hide: 'Hide',
    unpin: 'Unpin',
    pin: 'Pin to top',
    removeFromFavorites: 'Remove from favorites',
    addToFavorites: 'Add to favorites',
    edit: 'Edit',
    delete: 'Delete',
    confirmDeleteTitle: 'Delete Item',
    confirmDeleteDesc: 'Are you sure you want to delete this item? This cannot be undone.',
    itemDeleted: 'Item deleted',
    savedToVault: 'Saved to Vault!',
    updatedSuccessfully: 'Updated successfully!',
    filteredBy: 'Filtered by:',
    clearAll: 'Clear',
    pinnedOnly: 'Pinned',
    starredOnly: 'Starred',
    loadingSnippets: 'Loading snippets...',
    vaultEmptyTitle: 'Your vault is empty',
    vaultEmptySubtitle: 'Paste an AI prompt, code snippet, or note above to save your first item.',
    noFilterMatchTitle: 'No items found',
    noFilterMatchSubtitle: 'Try clearing your search query or adjusting your filters.',
    resetFilters: 'Reset filters',
    sortBy: 'Sort by:',
    sortNewest: 'Newest first',
    sortOldest: 'Oldest first',

    // Guest Hero
    heroTitle: 'Personal Knowledge Vault & Prompt Manager',
    heroSubtitle: 'Stop saving AI prompts, code snippets, secrets, and notes in messy Telegram Saved Messages. DevFlow auto-detects code languages, extracts prompt variables, generates hashtags, and enables instant 1-click copying.',
    getStarted: 'Get Started',

    // Prompt Runner Modal
    promptRunnerTitle: 'Run Prompt Template',
    promptRunnerSubtitle: 'Fill in the parameters below to generate and copy your final AI prompt for ChatGPT, Claude, or Midjourney.',
    renderedPreview: 'Rendered Preview:',
    copyInterpolated: 'Copy Rendered Prompt',
    cancel: 'Cancel',

    // Auth Modal
    signInTitle: 'Sign In to DevFlow',
    signUpTitle: 'Create an Account',
    twoFATitle: 'Two-Factor Verification',
    twoFASubtitle: 'Enter the 6-digit code from Google Authenticator or an emergency backup code.',
    usernameOrEmail: 'Username or Email',
    username: 'Username',
    email: 'Email address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    signInButton: 'Sign In',
    signUpButton: 'Create Account',
    verifyButton: 'Verify',
    verifying: 'Verifying...',
    processing: 'Processing...',
    passwordsMismatch: 'Passwords do not match',
    passwordWeak: 'Password does not meet security requirements',
    strengthLabel: 'Password Strength:',
    strengthVeryWeak: 'Very Weak',
    strengthWeak: 'Weak',
    strengthFair: 'Fair',
    strengthGood: 'Good',
    strengthStrong: 'Strong',
    reqMinLength: 'At least 8 characters',
    reqLower: 'Lowercase letter (a-z)',
    reqUpper: 'Uppercase letter (A-Z)',
    reqNumber: 'Number (0-9)',

    // 2FA Setup Modal
    twoFASetupTitle: 'Set Up Two-Factor Authentication (2FA)',
    twoFAScanSubtitle: 'Scan the QR code with Google Authenticator, 1Password, or Bitwarden on your phone.',
    orManualKey: 'Or enter key manually:',
    copyKey: 'Copy Key',
    keyCopied: 'Key Copied',
    enter6DigitCode: 'Enter 6-digit code from app:',
    activate2FA: 'Activate 2FA',
    activating: 'Activating...',
    backupCodesTitle: 'Save Emergency Backup Codes',
    backupCodesWarning: 'Important: If you lose access to your authenticator app, these 8 backup codes are the ONLY way to access your vault.',
    copyAllCodes: 'Copy All Codes',
    codesCopied: 'Codes Copied!',
    downloadTxt: 'Download .txt',
    codesSavedConfirm: 'I have saved these backup codes',

    // Settings Modal
    settingsModalTitle: 'Vault Settings & Security',
    tabSecurity: '2FA Security',
    tabPassword: 'Password',
    tabVault: 'Backup',
    tabApi: 'REST API & MCP',
    twoFAEnabledStatus: 'Two-Factor Authentication is Enabled',
    twoFADisabledStatus: 'Two-Factor Authentication is Disabled',
    twoFAEnabledDesc: 'Protected with Google Authenticator (TOTP)',
    twoFADisabledDesc: 'Enable 2FA to protect your vault from unauthorized access',
    disable2FAButton: 'Disable 2FA',
    confirmDisableTitle: 'Confirm password to disable 2FA:',
    confirmDisableButton: 'Confirm Disable',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    updatePasswordButton: 'Update Password',
    updating: 'Updating...',
    passwordUpdated: 'Password updated successfully!',
    exportTitle: 'Export Vault Backup',
    exportSubtitle: 'Download complete JSON archive of all prompts, code, and notes',
    exportButton: 'Export JSON',
    importTitle: 'Import from Backup',
    importSubtitle: 'Restore snippets from a JSON backup file',
    importButton: 'Select File',
    importSuccess: 'Successfully imported items:',

    // Profile Modal
    profileTitle: 'Developer Profile',
    userIdLabel: 'User ID:',
    idCopied: 'ID Copied!',
    copyId: 'Copy ID',
    memberSince: 'DevFlow Member Since:',
    securityStatus: 'Account Security:',
    protectedBy2FA: 'Protected with 2FA (Google TOTP)',
    unprotected2FA: '2FA is disabled (recommended to enable)',
    setup2FANow: 'Enable 2FA',
    developerRoleLabel: 'Specialization / Role:',
    customAvatarColor: 'Avatar Accent:',
    vaultSnapshot: 'Vault Snapshot:',
    openSettingsBtn: 'Open Settings',

    // API & MCP Docs Modal
    apiDocsTitle: 'Integration: REST API & AI MCP Server',
    apiDocsSubtitle: 'Manage DevFlow via REST API or connect directly to AI Agents (Claude Desktop, Cursor, Antigravity, VS Code, Roo Code).',
    tabRestApi: 'REST API',
    tabMcp: 'AI Agents (MCP Server)',
    apiBaseUrl: 'Base URL:',
    apiAuthHeader: 'Auth Header:',
    apiYourToken: 'Your active JWT token:',
    apiCopyToken: 'Copy Token',
    apiTokenCopied: 'Token Copied!',
    apiGroupAuth: 'Authentication & 2FA',
    apiGroupSnippets: 'Snippets & Vault',
    apiGroupPrompts: 'AI Prompts & Runner',
    apiGroupVault: 'Export & Import',
    apiGroupUtils: 'Utility Endpoints',
    apiExampleCurl: 'cURL',
    apiExampleJs: 'JavaScript (Fetch)',
    apiExamplePy: 'Python (Requests)',
    apiResponse: 'Server Response (JSON):',
    apiReqBody: 'Request Body (JSON):',

    // MCP Section
    mcpTitle: 'Model Context Protocol (MCP) Server',
    mcpSubtitle: 'DevFlow implements standard Model Context Protocol (JSON-RPC 2.0). Connect your AI models to search prompts, save code, retrieve secrets, and run templates in real-time!',
    mcpClaudeConfig: 'Claude Desktop Configuration',
    mcpCursorConfig: 'Cursor / VS Code / Roo Code Configuration',
    mcpToolsList: 'Available AI Tools (MCP Tools):',
    copyConfig: 'Copy JSON Config',
    configCopied: 'Config Copied!',
  },
};
