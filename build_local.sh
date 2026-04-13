#!/usr/bin/env bash
# =============================================================================
# build_local.sh — Локальная сборка подписанного AAB для Google Play Store
# Проект: Point (Точки) — com.pointgame.classic
# =============================================================================
set -euo pipefail

# ── Цвета для вывода ─────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERR]${NC}  $*"; exit 1; }
header()  { echo -e "\n${BOLD}════════════════════════════════════════${NC}"; \
            echo -e "${BOLD}  $*${NC}"; \
            echo -e "${BOLD}════════════════════════════════════════${NC}"; }

# ── Конфигурация ──────────────────────────────────────────────────────────────
REPO_URL="${REPO_URL:-https://github.com/ekazancev553-bit/Point.git}"
BRANCH="${BRANCH:-main}"
PROJECT_DIR="${PROJECT_DIR:-Point}"
KEYSTORE_FILE="${KEYSTORE_FILE:-point-release.jks}"
KEY_ALIAS="${KEY_ALIAS:-point-key}"
STORE_PASS="${STORE_PASS:-}"   # если пусто — спросит интерактивно
KEY_PASS="${KEY_PASS:-}"

# ── Функции ───────────────────────────────────────────────────────────────────
check_deps() {
    header "Проверка зависимостей"
    local missing=0

    for cmd in java git; do
        if command -v "$cmd" &>/dev/null; then
            success "$cmd: $(${cmd} --version 2>&1 | head -1)"
        else
            error "$cmd не найден — установите JDK 17+ и Git"
            missing=1
        fi
    done

    # Проверка версии Java (нужна 17+)
    local java_ver
    java_ver=$(java -version 2>&1 | grep -oP '(?<=version ")[^"]+' | cut -d'.' -f1)
    if [[ "$java_ver" -lt 17 ]]; then
        error "Требуется JDK 17+, найдена версия $java_ver"
    fi

    # Android SDK
    if [[ -n "${ANDROID_HOME:-}" ]]; then
        success "ANDROID_HOME: $ANDROID_HOME"
    elif [[ -d "$HOME/Android/Sdk" ]]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        success "ANDROID_HOME автоопределён: $ANDROID_HOME"
    elif [[ -d "$HOME/Library/Android/sdk" ]]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        success "ANDROID_HOME автоопределён: $ANDROID_HOME"
    else
        error "Android SDK не найден. Установите Android Studio или задайте ANDROID_HOME"
    fi

    [[ $missing -eq 0 ]] || exit 1
}

clone_or_update() {
    header "Получение исходного кода"
    if [[ -d "$PROJECT_DIR/.git" ]]; then
        info "Репозиторий уже существует, обновляю..."
        git -C "$PROJECT_DIR" fetch origin
        git -C "$PROJECT_DIR" checkout "$BRANCH"
        git -C "$PROJECT_DIR" pull origin "$BRANCH"
        success "Обновлено до последнего коммита"
    else
        info "Клонирую $REPO_URL (ветка $BRANCH)..."
        git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$PROJECT_DIR"
        success "Репозиторий клонирован в $PROJECT_DIR/"
    fi
}

setup_keystore() {
    header "Настройка подписи"
    local ks_path="$PROJECT_DIR/$KEYSTORE_FILE"

    if [[ ! -f "$ks_path" ]]; then
        warn "Файл $KEYSTORE_FILE не найден в $PROJECT_DIR/"
        echo -e "${YELLOW}Варианты:${NC}"
        echo "  1. Скопируйте существующий keystore: cp /path/to/point-release.jks $PROJECT_DIR/"
        echo "  2. Создайте новый keystore:"
        echo "     keytool -genkey -v -keystore $PROJECT_DIR/$KEYSTORE_FILE \\"
        echo "       -alias $KEY_ALIAS -keyalg RSA -keysize 2048 -validity 10000 \\"
        echo "       -dname 'CN=PointGame, OU=Games, O=PointGame, L=Moscow, S=Moscow, C=RU'"
        echo ""
        read -rp "Создать новый keystore сейчас? [y/N] " create_ks
        if [[ "${create_ks,,}" == "y" ]]; then
            keytool -genkey -v \
                -keystore "$ks_path" \
                -alias "$KEY_ALIAS" \
                -keyalg RSA -keysize 2048 -validity 10000 \
                -dname "CN=PointGame, OU=Games, O=PointGame, L=Moscow, S=Moscow, C=RU"
            success "Keystore создан: $ks_path"
        else
            error "Keystore обязателен для release-сборки"
        fi
    else
        success "Keystore найден: $ks_path"
    fi

    # Запросить пароли если не заданы
    if [[ -z "$STORE_PASS" ]]; then
        read -rsp "  Введите storePassword (пароль хранилища): " STORE_PASS
        echo
    fi
    if [[ -z "$KEY_PASS" ]]; then
        read -rsp "  Введите keyPassword (пароль ключа): " KEY_PASS
        echo
    fi

    # Записать keystore.properties
    cat > "$PROJECT_DIR/keystore.properties" << EOF
storeFile=../$KEYSTORE_FILE
storePassword=$STORE_PASS
keyAlias=$KEY_ALIAS
keyPassword=$KEY_PASS
EOF
    success "keystore.properties создан"
}

build_aab() {
    header "Сборка подписанного AAB"
    cd "$PROJECT_DIR"
    chmod +x gradlew

    info "Очистка предыдущей сборки..."
    ./gradlew clean --quiet

    info "Запуск bundleRelease..."
    ./gradlew bundleRelease --no-daemon

    local aab="app/build/outputs/bundle/release/app-release.aab"
    if [[ -f "$aab" ]]; then
        local size
        size=$(du -h "$aab" | cut -f1)
        success "AAB создан: $aab ($size)"
    else
        error "AAB не найден после сборки"
    fi
    cd ..
}

verify_signature() {
    header "Проверка подписи"
    local aab="$PROJECT_DIR/app/build/outputs/bundle/release/app-release.aab"
    if jarsigner -verify -verbose -certs "$aab" 2>&1 | grep -q "jar verified"; then
        success "Подпись корректна — AAB готов к загрузке в Play Store"
    else
        warn "Не удалось проверить подпись (jarsigner). Проверьте вручную."
    fi
}

print_summary() {
    header "Готово!"
    local aab="$PROJECT_DIR/app/build/outputs/bundle/release/app-release.aab"
    echo -e "${GREEN}  AAB файл:${NC} $(realpath "$aab")"
    echo -e "${GREEN}  Размер:${NC}   $(du -h "$aab" | cut -f1)"
    echo ""
    echo -e "${BOLD}Следующий шаг:${NC}"
    echo "  Загрузите AAB в Google Play Console:"
    echo "  play.google.com/console → com.pointgame.classic → Выпуски → Production"
    echo ""
    echo -e "${YELLOW}  Не забудьте:${NC} никогда не коммитьте keystore.properties и .jks в git!"
}

# ── Точка входа ───────────────────────────────────────────────────────────────
main() {
    echo -e "${BOLD}Point (Точки) — сборка для Google Play Store${NC}"
    echo -e "Package: com.pointgame.classic\n"

    check_deps
    clone_or_update
    setup_keystore
    build_aab
    verify_signature
    print_summary
}

main "$@"
