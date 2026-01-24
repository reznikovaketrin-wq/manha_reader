# Решение проблем с кэшем и закрытием VS Code

## 🔴 Проблема 1: Ошибка кэша webpack
```
[webpack.cache.PackFileCacheStrategy] Caching failed for pack: RangeError: Array buffer allocation failed
```

**Причина:** Нехватка памяти для кэша Next.js

### ✅ Решение:

**1. Запустите скрипт очистки кэша:**
```bash
# Запустите файл
clear-all-cache.bat
```

**2. Или вручную:**
```bash
# Остановите dev сервер (Ctrl+C)
# Удалите кэш
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
npm cache clean --force
```

**3. Увеличьте лимит памяти для Node.js:**

Создайте файл `.env.local` (если его нет) и добавьте:
```env
NODE_OPTIONS=--max-old-space-size=4096
```

**4. Отключите кэш в development (временно):**

В `next.config.js` добавьте:
```javascript
module.exports = {
  // ... существующая конфигурация
  
  // Отключить кэш в dev режиме
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  }
}
```

---

## 🔴 Проблема 2: VS Code часто закрывается

**Причины:**
- Нехватка оперативной памяти
- Конфликт расширений
- Проблемы с автосохранением

### ✅ Решения:

**1. Увеличьте лимит памяти VS Code:**

Откройте настройки VS Code (Ctrl+,) и добавьте в `settings.json`:
```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/.cache/**": true,
    "**/dist/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  },
  "typescript.tsserver.maxTsServerMemory": 4096,
  "files.autoSave": "onFocusChange"
}
```

**2. Отключите ненужные расширения:**

Откройте Extensions (Ctrl+Shift+X) и отключите:
- Расширения для языков, которые не используете
- Темы, которые не используете
- Dupликаты (например, несколько линтеров)

**3. Перезапустите TypeScript сервер:**
```
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

**4. Очистите кэш VS Code:**
```bash
# Закройте VS Code
# Удалите папки кэша
Remove-Item -Recurse -Force "$env:APPDATA\Code\Cache"
Remove-Item -Recurse -Force "$env:APPDATA\Code\CachedData"
```

**5. Проверьте память системы:**
```bash
# В PowerShell
Get-WmiObject Win32_OperatingSystem | Select-Object FreePhysicalMemory, TotalVisibleMemorySize
```

Если свободной памяти < 2GB:
- Закройте другие приложения
- Перезагрузите компьютер
- Увеличьте виртуальную память Windows

---

## 🚀 Оптимизация для работы

**1. Создайте `.gitignore` исключения:**
```gitignore
# Already in .gitignore, but double-check
.next/
node_modules/
.cache/
dist/
*.log
```

**2. Используйте turbopack (экспериментально):**
```bash
# В package.json
"scripts": {
  "dev": "next dev --turbo"
}
```

**3. Ограничьте файловый watcher:**

Создайте `.vscode/settings.json`:
```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.next/**": true
  }
}
```

---

## 📊 Мониторинг

**Проверьте использование памяти Node.js:**
```bash
# Во время работы dev сервера
node --expose-gc -e "console.log(process.memoryUsage())"
```

**Проверьте процессы:**
```bash
Get-Process node | Select-Object Id, PM, WorkingSet, CPU
```

---

## ⚡ Быстрое решение прямо сейчас:

1. **Остановите dev сервер** (Ctrl+C в терминале)
2. **Запустите:** `clear-all-cache.bat`
3. **Перезапустите VS Code**
4. **Запустите:** `npm run dev`

Если проблемы продолжаются - перезагрузите компьютер.
