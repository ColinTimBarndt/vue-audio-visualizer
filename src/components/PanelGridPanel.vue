<template>
  <div class="panel">
    <div class="header">
      <h1>{{ title }}</h1>
      <button
        class="close"
        v-if="!persistent"
        title="Close"
        @click="$emit('close')"
      ></button>
    </div>
    <div class="body">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({
  props: {
    title: {
      type: String,
      default: "Panel",
    },
    panelX: {
      type: Number,
      default: 0,
    },
    panelY: {
      type: Number,
      default: 0,
    },
    persistent: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    close: null,
  },
})
export default class PanelGridPanel extends Vue {
  public title!: String;
  public panelX!: number;
  public panelY!: number;
  public persistent!: boolean;
}
</script>

<style scoped lang="sass">
@import @/assets/theme

.panel
	overflow: hidden
	border-radius: 5px
	box-shadow: 0 2px 5px 2px $theme-shadow-color
	display: flex
	flex-direction: column
	background-color: $theme-accent-dark

.header
	font-size: 30px
	height: 1em
	padding: 2.5px
	background: $theme-accent-dark
	display: flex
	flex-direction: row

	h1
		height: 100%
		margin: 0
		font-weight: normal
		overflow: hidden
		font-family: $theme-font-headers
		font-size: 1em
		color: $theme-foreground
		flex: 1

	button
		$size: 20px
		display: block
		width: $size
		height: $size
		border-radius: 0.5 * $size
		margin: 5px
		border: none
		cursor: pointer
		transition: background 0.1s linear

		&.close
			background: $theme-symbolic-negative
			&:hover
				background: scale-color($theme-symbolic-negative, $lightness: -20%, $saturation: -20%)

.body
	flex: 1
	background-color: $theme-middleground
	border-top: 2px solid $theme-accent-light
	border-radius: 5px 5px 0 0
	overflow: hidden
</style>