#!/usr/bin/env bash
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────

RESET='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'
RED='\033[31m'
GREEN='\033[32m'
AMBER='\033[33m'
CYAN='\033[36m'

ok()   { printf "   ${GREEN}✓${RESET} %s\n" "$1"; }
fail() { printf "   ${RED}✗${RESET} %s\n" "$1"; }
info() { printf "   ${AMBER}→${RESET} %s\n" "$1"; }

# ── Banner ──────────────────────────────────────────────────────────────────

printf "\n"
printf "   ╭───────────────────────────────────────╮\n"
printf "   │                                       │\n"
printf "   │            ${AMBER}${BOLD}◉  O R B I T${RESET}               │\n"
printf "   │                                       │\n"
printf "   │   ${DIM}Google Workspace AI Assistant${RESET}       │\n"
printf "   │                                       │\n"
printf "   ╰───────────────────────────────────────╯\n"
printf "\n"
printf "   Checking requirements...\n\n"

# ── Check Node.js ───────────────────────────────────────────────────────────

if ! command -v node &> /dev/null; then
  fail "Node.js not found"
  printf "\n"
  printf "   Install Node.js 18+ via one of:\n"
  printf "   ${CYAN}curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash${RESET}\n"
  printf "   ${CYAN}brew install node${RESET}\n"
  printf "\n"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/^v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js v${NODE_VERSION} is too old (need >= 18)"
  printf "   Update Node.js: ${CYAN}nvm install 18${RESET}\n"
  exit 1
fi

ok "Node.js v${NODE_VERSION}"

# ── Check npm ───────────────────────────────────────────────────────────────

if ! command -v npm &> /dev/null; then
  fail "npm not found"
  printf "   npm should come with Node.js. Reinstall Node.\n"
  exit 1
fi

NPM_VERSION=$(npm -v)
ok "npm v${NPM_VERSION}"

# ── Check git ───────────────────────────────────────────────────────────────

if ! command -v git &> /dev/null; then
  fail "git not found"
  printf "\n"
  printf "   Install git:\n"
  printf "   ${CYAN}brew install git${RESET}  (macOS)\n"
  printf "   ${CYAN}sudo apt install git${RESET}  (Linux)\n"
  printf "\n"
  exit 1
fi

ok "git $(git --version | sed 's/git version //')"

# ── Install gws CLI ────────────────────────────────────────────────────────

if command -v gws &> /dev/null; then
  ok "gws CLI already installed"
else
  info "Installing gws CLI..."
  npm install -g @anthropic-ai/gws > /dev/null 2>&1 || npm install -g @googleworkspace/cli > /dev/null 2>&1 || {
    fail "Could not install gws CLI"
    printf "   Try manually: ${CYAN}npm install -g @googleworkspace/cli${RESET}\n"
    exit 1
  }
  ok "gws CLI installed"
fi

# ── Install Orbit CLI ──────────────────────────────────────────────────────

ORBIT_HOME="${HOME}/.orbit/source"

if orbit --version &> /dev/null; then
  ok "orbit CLI already installed ($(orbit --version))"
else
  # Clean up any broken symlinks from previous installs
  npm unlink -g orbit-cli > /dev/null 2>&1
  info "Installing Orbit CLI..."

  # Clone to persistent location
  rm -rf "$ORBIT_HOME"
  mkdir -p "$ORBIT_HOME"

  git clone --depth 1 https://github.com/byzkhan/orbit.git "$ORBIT_HOME" 2>/dev/null || {
    fail "Could not clone Orbit repository"
    printf "   Make sure you have access to the Orbit repo.\n"
    exit 1
  }

  cd "$ORBIT_HOME"
  npm install --ignore-scripts > /dev/null 2>&1
  cd packages/orbit-cli
  npm install > /dev/null 2>&1
  npx tsup > /dev/null 2>&1
  npm link > /dev/null 2>&1 || {
    fail "Could not link orbit CLI"
    printf "   Try: ${CYAN}cd ~/.orbit/source/packages/orbit-cli && npm link${RESET}\n"
    exit 1
  }

  ok "orbit CLI installed"
fi

# ── Verify orbit in PATH ───────────────────────────────────────────────────

if command -v orbit &> /dev/null; then
  ok "orbit is in PATH"
else
  printf "\n"
  printf "   ${AMBER}⚠${RESET}  orbit was installed but isn't in your PATH.\n"
  printf "   You may need to restart your shell or add npm's global bin to PATH:\n"
  printf "   ${CYAN}export PATH=\"\$(npm prefix -g)/bin:\$PATH\"${RESET}\n"
  printf "\n"
fi

# ── Done ────────────────────────────────────────────────────────────────────

printf "\n"
printf "   ${GREEN}${BOLD}Installation complete!${RESET}\n"
printf "\n"
printf "   Run ${CYAN}${BOLD}orbit${RESET} to get started.\n"
printf "\n"
