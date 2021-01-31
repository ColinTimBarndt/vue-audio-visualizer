<template>
	<aside>
		<template v-if="title">
			<h1 class="header">{{ title }}</h1>
			<hr/>
		</template>
		<div class="scroller">
			<sidebar-action
				v-for="(action, name) in actions"
				:key="name"
				:label="action.label"
				:name="name"
				:active="name === active"
				@click="updateActive(name)"
			/>
		</div>
	</aside>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import SidebarAction from "./SidebarAction.vue";

class Action {
	constructor(
		public label: string
	) {}
}

@Options({
	components: {SidebarAction},
	props: {
		title: String,
		actions: {
			// {[id: string]: Action}
			validator(value: any) {
				return typeof value === "object" && Object.values(value).every((action) => action instanceof Action);
			},
			default: {}
		},
		defaultActive: String
	},
	data() {
		return {
			active: null
		}
	},
	emits: {
		action(event: any) {
			return typeof event === "string";
		}
	}
})
export default class Sidebar extends Vue {
	title?: string;
	actions!: {[id: string]: Action};
	active: string|null = null;
	defaultActive?: string;

	public static readonly Action = Action;

	beforeMount() {
		if (this.active === null) {
			this.updateActive(this.defaultActive ?? Object.keys(this.actions)[0] ?? null);
		}
	}

	beforeUpdate() {
		if (!(this.active! in this.actions)) {
			this.active = this.defaultActive && this.defaultActive in this.actions ? this.defaultActive : Object.keys(this.actions)[0] ?? null;
		}
	}

	protected updateActive(newActive: string) {
		this.active = newActive;
		this.$emit("action", newActive);
	}
}
</script>

<style lang="sass" scoped>
@import @/assets/theme

aside
	width: 200px
	height: 100%

aside, hr
	box-shadow: inset -2px 0 0 0 $theme-shadow-color
	background: $theme-middleground

h1
	font-size: 28pt
	height: 1em
	padding: 2pt
	text-overflow: ellipsis
	background: $theme-accent-dark
	border-bottom: 8px solid $theme-accent-dark
	font-family: $theme-font-headers
	color: $theme-foreground
	margin: 0
	color: $theme-foreground

hr
	display: block
	height: 8px
	border: none
	border-top: 2px solid $theme-accent-light
	border-radius: 0 8px 0 0
	margin: 0
	position: relative
	top: -8px

.scroller
	display: flex
	flex-direction: column
	overflow: auto hidden
	margin-right: 2px;
</style>