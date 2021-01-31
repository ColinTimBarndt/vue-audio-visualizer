<template>
  <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import EventBus from "@/event-bus";
import { Visualizer } from "@/visualizer";
import { Options, Vue } from "vue-class-component";

@Options({
  props: {
    visualizer: {
      // Visualizer
      validator(value: any) {
        return value && value.render && value.init;
      },
      required: true,
    },
  },
})
export default class PanelVisualizer extends Vue {
  public visualizer!: Visualizer;

  private ctx: CanvasRenderingContext2D | null = null;
  private isMounted: boolean = false;

  private readonly onAnimationFrame = this.renderCanvas.bind(this);

  mounted() {
    this.isMounted = true;

    let maybeCtx = (this.$refs.canvas as HTMLCanvasElement).getContext("2d");
    if (!(maybeCtx instanceof CanvasRenderingContext2D)) {
      console.warn("This browser does not support Canvas 2D rendering");
      return;
    }
    this.ctx = maybeCtx;
    this.visualizer.init(maybeCtx);
    EventBus.on("animation-frame", this.onAnimationFrame);
  }
  beforeUnmount() {
    this.isMounted = false;
    EventBus.stopListening("animation-frame", this.onAnimationFrame);
  }

  private renderCanvas() {
    if (this.isMounted) {
      this.visualizer.render(this.ctx!);
    }
  }
}
</script>

<style lang="sass" scoped>
@import @/assets/theme

canvas
	width: 100%
	text-align: center
	font-size: 40px
	--canvas-background: #{$theme-background}
	--canvas-foreground: #{$theme-foreground}
	--canvas-middleground: #{$theme-middleground}
	--canvas-color: #{$theme-accent-light}
</style>