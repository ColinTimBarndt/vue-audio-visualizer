<template>
  <div class="options">
    <label
      >Show labels: <input type="checkbox" v-model="visualsOptions.labels"
    /></label>
  </div>
</template>

<script lang="ts">
import { VisualSettings } from "@/settings";
import { inject } from "vue";
import { Options, Vue } from "vue-class-component";

@Options({
  props: {
    settings: {
      type: VisualSettings,
      required: true,
    },
  },
  inject: ["visualsOptions"],
})
export default class PanelSettingsVisual extends Vue {
  settings!: VisualSettings;
  visualsOptions!: { labels: boolean };
}
</script>

<style lang="sass" scoped>
@import @/assets/theme

.options
	color: $theme-foreground
	font: 18pt $theme-font-text
	padding: 6px 4px
	display: flex
	flex-direction: column
</style>