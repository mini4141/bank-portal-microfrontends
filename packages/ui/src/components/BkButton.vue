<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button', loading: false, disabled: false },
)
</script>

<template>
  <button
    :type="type"
    class="bk-button"
    :class="`bk-button--${variant}`"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
.bk-button {
  min-height: 40px;
  padding: 0 var(--bk-spacing-md);
  border: 1px solid var(--bk-color-primary);
  border-radius: var(--bk-radius-md);
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &--primary {
    background: var(--bk-color-primary);
    color: #fff;
    &:hover:not(:disabled) {
      background: var(--bk-color-primaryDark);
    }
  }
  &--secondary {
    background: var(--bk-color-surface);
    color: var(--bk-color-primary);
  }
  &--ghost {
    background: transparent;
    border-color: transparent;
    color: var(--bk-color-primary);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: 2px solid var(--bk-color-primary);
    outline-offset: 2px;
  }
}
</style>
