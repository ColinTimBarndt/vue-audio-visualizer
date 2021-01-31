<template>
  <div class="container">
    <div class="scroller">
      <button
        class="option"
        v-for="v in options"
        :key="v.visualizerName"
        @click="callback(v)"
      >
        {{ v.visualizerName }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({
  props: {
    options: {
      type: Array,
      default: [],
    },
    callback: {
      // (v: typeof Object) => void
      type: Function,
      default() {},
    },
  },
})
export default class PanelSelectVisualizer extends Vue {
  readonly options!: typeof Object[];
  readonly callback!: (v: typeof Object) => void;
}
</script>

<style lang="sass" scoped>
@import @/assets/theme

.container
  height: 100%
  overflow: hidden auto
  display: flex

.scroller
  display: flex
  flex-direction: row
  gap: 10px
  flex-wrap: wrap
  justify-content: center
  padding: 6px

  button
    border: none
    cursor: pointer
    color: $theme-foreground
    background: $theme-accent-light
    font: 30px $theme-font-text
    padding: 12px 6px
    border-radius: 5px
    font-weight: bold
</style>