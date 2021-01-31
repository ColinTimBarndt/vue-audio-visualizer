<template>
	<button
		:disabled="active"
		:class="active?['active']:[]"
		@click="$emit('click')"
	>{{ label }}</button>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

@Options({
	props: {
		name: String,
		label: String,
		active: Boolean
	},
	emits: {
		click: null
	}
})
export default class SidebarAction extends Vue {
	name!: string;
	label: string = this.name;
	active: boolean = false;
}
</script>

<style lang="sass" scoped>
@import @/assets/theme

button
	font: 25pt $theme-font-buttons
	display: block
	border: none
	background: transparent
	color: $theme-foreground
	margin: 0
	padding: 0
	opacity: 0.5
	cursor: pointer

	&:hover
		color: $theme-accent-light
		opacity: 1
	&.active
		background: $theme-shadow-color
		opacity: 1

</style>