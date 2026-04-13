# Сборка AAB и публикация в Google Play Console

## Требования для локальной сборки

| Инструмент | Версия | Где скачать |
|---|---|---|
| Android Studio | Ladybug 2024.2+ | developer.android.com/studio |
| JDK | 17 или 21 | Входит в Android Studio |
| Android SDK | API 34 | Через SDK Manager в Android Studio |

---

## Шаг 1: Клонировать репозиторий

```bash
git clone https://github.com/ekazancev553-bit/Point.git
cd Point
```

## Шаг 2: Создать файл keystore.properties

Создайте файл `keystore.properties` в корне проекта (рядом с `app/`):

```properties
storeFile=../point-release.jks
storePassword=pointgame123
keyAlias=point-key
keyPassword=pointgame123
```

> **Важно:** Скопируйте файл `point-release.jks` в корень проекта.  
> Ключ был создан командой:
> ```bash
> keytool -genkey -v \
>   -keystore point-release.jks \
>   -alias point-key -keyalg RSA -keysize 2048 -validity 10000 \
>   -dname "CN=PointGame, OU=Games, O=PointGame, L=Moscow, S=Moscow, C=RU" \
>   -storepass pointgame123 -keypass pointgame123
> ```

## Шаг 3: Собрать подписанный AAB

```bash
./gradlew bundleRelease
```

Файл будет создан по пути:
```
app/build/outputs/bundle/release/app-release.aab
```

Проверить подпись:
```bash
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
```

### Альтернатива — через Android Studio
1. Build → Generate Signed Bundle / APK
2. Выбрать **Android App Bundle**
3. Выбрать keystore `point-release.jks`, ввести пароли
4. Build Variant: **release**
5. Нажать **Finish**

---

## Шаг 4: Создать аккаунт в Google Play Console

1. Зайти на [play.google.com/console](https://play.google.com/console)
2. Оплатить регистрационный взнос **$25** (разово)
3. Заполнить данные разработчика

---

## Шаг 5: Создать новое приложение

1. Play Console → **Все приложения** → **Создать приложение**
2. Язык по умолчанию: **Русский**
3. Тип: **Приложение** → **Игра**
4. Бесплатное/платное: **Бесплатное**

---

## Шаг 6: Заполнить основной листинг

Перейти в **Магазин → Основной листинг** и заполнить (текст в `store_listing_ru.md`):

| Поле | Значение |
|---|---|
| Название | `Point — Точки: Классическая стратегия` |
| Краткое описание | `Классическая стратегия «Точки» — окружай и захватывай точки соперника!` |
| Полное описание | (из файла `store_listing_ru.md`) |

### Загрузить графические материалы:

| Тип | Файл | Формат |
|---|---|---|
| Иконка приложения | `icon/icon_512x512.png` | PNG 512×512 |
| Feature Graphic | `feature_graphic/feature_1024x500.png` | PNG/JPG 1024×500 |
| Скриншот 1 | `screenshots/screenshot_1_menu.png` | PNG 1080×1920 |
| Скриншот 2 | `screenshots/screenshot_2_game.png` | PNG 1080×1920 |
| Скриншот 3 | `screenshots/screenshot_3_gameover.png` | PNG 1080×1920 |
| Скриншот 4 | `screenshots/screenshot_4_howtoplay.png` | PNG 1080×1920 |

---

## Шаг 7: Настроить категорию и рейтинг

1. **Категория:** Настольные игры
2. **Теги:** точки, стратегия, два игрока, классика
3. **Опросник по контенту** → заполнить → получить рейтинг **"Для всех"**

---

## Шаг 8: Политика конфиденциальности

Создайте страницу (GitHub Pages / Notion / Telegra.ph) с текстом:

```
Point не собирает, не хранит и не передаёт никакие персональные данные
пользователей. Приложение работает полностью в автономном режиме.
```

Укажите URL этой страницы в Play Console.

---

## Шаг 9: Загрузить AAB в Production

1. Play Console → **Выпуски** → **Production** → **Создать выпуск**
2. Если Play App Signing ещё не настроен — следовать инструкции
3. Загрузить файл `app-release.aab`
4. Примечания к выпуску:
   ```
   Первый выпуск классической игры «Точки» для двух игроков.
   ```
5. **Просмотреть выпуск** → **Начать выпуск в Production**

---

## Шаг 10: Ожидать проверку

Google обычно проверяет новые приложения **1–3 рабочих дня**.  
После одобрения приложение появится в Play Store.

---

## Структура файлов store_assets/

```
store_assets/
├── icon/
│   ├── icon_512x512.png           ← Загрузить в Play Console
│   ├── ic_launcher_xxxhdpi_192x192.png
│   ├── ic_launcher_xxhdpi_144x144.png
│   ├── ic_launcher_xhdpi_96x96.png
│   ├── ic_launcher_hdpi_72x72.png
│   └── ic_launcher_mdpi_48x48.png
├── feature_graphic/
│   └── feature_1024x500.png       ← Загрузить в Play Console
├── screenshots/
│   ├── screenshot_1_menu.png      ← Загрузить в Play Console
│   ├── screenshot_2_game.png      ← Загрузить в Play Console
│   ├── screenshot_3_gameover.png  ← Загрузить в Play Console
│   └── screenshot_4_howtoplay.png ← Загрузить в Play Console
├── promo/
│   └── promo_180x120.png          ← Опционально
├── store_listing_ru.md            ← Текст листинга
├── BUILD_AND_PUBLISH.md           ← Эта инструкция
└── point_play_store_assets.zip    ← Все ассеты одним архивом
```
