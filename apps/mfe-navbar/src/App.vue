<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BkButton } from '@bank/ui'
import {
  getUser,
  login,
  logout,
  navigate,
  onAuthChange,
  setLocale,
  track,
  type Locale,
  type User,
} from '@bank/utility'

const { t, locale } = useI18n()
const user = ref<User | null>(getUser())
const path = ref(window.location.pathname)
const username = ref('taro')
const password = ref('')
const failed = ref(false)
const busy = ref(false)

const links = [
  { to: '/accounts', key: 'nav.accounts' },
  { to: '/transactions', key: 'nav.transactions' },
  { to: '/transfer', key: 'nav.transfer' },
  { to: '/statements', key: 'nav.statements' },
]
const displayName = computed(() => (locale.value === 'ja' ? user.value?.nameJa : user.value?.name))
const onLogin = computed(() => path.value.startsWith('/login'))

const syncPath = () => (path.value = window.location.pathname)
let off: () => void
onMounted(() => {
  off = onAuthChange((u) => (user.value = u))
  window.addEventListener('single-spa:routing-event', syncPath)
})
onBeforeUnmount(() => {
  off?.()
  window.removeEventListener('single-spa:routing-event', syncPath)
})

function go(to: string) {
  navigate(to)
}

function switchLocale(l: Locale) {
  setLocale(l)
  track('locale_changed', { locale: l })
}

async function submit() {
  busy.value = true
  failed.value = false
  try {
    await login(username.value, password.value)
    go('/accounts')
  } catch {
    failed.value = true
  } finally {
    busy.value = false
  }
}

async function onLogout() {
  await logout()
  go('/login')
}
</script>

<template>
  <header class="nav">
    <a class="nav__brand" href="/accounts" @click.prevent="go('/accounts')"
      >🏦 {{ t('common.appName') }}</a
    >
    <nav v-if="user" class="nav__links">
      <a
        v-for="l in links"
        :key="l.to"
        :href="l.to"
        :class="{ active: path.startsWith(l.to) }"
        @click.prevent="go(l.to)"
        >{{ t(l.key) }}</a
      >
    </nav>
    <div class="nav__right">
      <span v-if="user" class="nav__user" data-testid="user-name">{{
        t('nav.hello', { name: displayName })
      }}</span>
      <div class="nav__lang" role="group" :aria-label="t('nav.language')">
        <button :aria-pressed="locale === 'en'" @click="switchLocale('en')">EN</button>
        <button :aria-pressed="locale === 'ja'" @click="switchLocale('ja')">日本語</button>
      </div>
      <BkButton v-if="user" variant="secondary" @click="onLogout">{{ t('nav.logout') }}</BkButton>
    </div>
  </header>

  <main v-if="onLogin && !user" class="login">
    <form class="login__card" @submit.prevent="submit">
      <h1>{{ t('login.title') }}</h1>
      <label>
        {{ t('login.username') }}
        <input v-model="username" autocomplete="username" required />
      </label>
      <label>
        {{ t('login.password') }}
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="failed" class="login__error" role="alert">{{ t('login.error') }}</p>
      <BkButton type="submit" :loading="busy">{{ t('login.submit') }}</BkButton>
      <p class="login__hint">{{ t('login.hint') }}</p>
    </form>
  </main>
</template>

<style scoped lang="scss">
.nav {
  display: flex;
  align-items: center;
  gap: var(--bk-spacing-lg);
  padding: var(--bk-spacing-sm) var(--bk-spacing-lg);
  background: var(--bk-color-surface);
  border-bottom: 3px solid var(--bk-color-primary);
  flex-wrap: wrap;

  &__brand {
    font-weight: 700;
    font-size: 18px;
    color: var(--bk-color-primary);
    text-decoration: none;
  }
  &__links {
    display: flex;
    gap: var(--bk-spacing-md);
    a {
      color: var(--bk-color-text);
      text-decoration: none;
      padding: var(--bk-spacing-xs) 0;
      border-bottom: 2px solid transparent;
      &.active {
        border-color: var(--bk-color-primary);
        font-weight: 600;
      }
    }
  }
  &__right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: var(--bk-spacing-md);
  }
  &__lang button {
    border: 1px solid var(--bk-color-border);
    background: var(--bk-color-surface);
    padding: 6px 10px;
    cursor: pointer;
    &[aria-pressed='true'] {
      background: var(--bk-color-primary);
      color: #fff;
      border-color: var(--bk-color-primary);
    }
  }
}
.login {
  display: flex;
  justify-content: center;
  padding: var(--bk-spacing-lg);

  &__card {
    display: grid;
    gap: var(--bk-spacing-md);
    width: min(420px, 100%);
    padding: var(--bk-spacing-lg);
    background: var(--bk-color-surface);
    border: 1px solid var(--bk-color-border);
    border-radius: var(--bk-radius-md);

    label {
      display: grid;
      gap: var(--bk-spacing-xs);
    }
    input {
      height: 40px;
      padding: 0 var(--bk-spacing-sm);
    }
  }
  &__error {
    color: var(--bk-color-negative);
  }
  &__hint {
    color: var(--bk-color-textMuted);
    font-size: 13px;
  }
}
</style>
