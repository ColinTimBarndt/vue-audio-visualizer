<template>
  <div class="content">
    <canvas ref="canvas"></canvas>
    <canvas ref="labels"></canvas>
  </div>
</template>

<script lang="ts">
import EventBus from "@/event-bus";
import { Visualizer } from "@/visualizer";
import { inject, toRefs } from "vue";
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
  data() {
    return {
      visualsOptions: inject<any>("visualsOptions")!,
      drawLabels: false,
    };
  },
})
export default class PanelVisualizer extends Vue {
  public visualizer!: Visualizer;

  // Injected
  visualsOptions!: { labels: boolean };

  private ctx: CanvasRenderingContext2D | null = null;
  private labelCtx: CanvasRenderingContext2D | null = null;
  private isMounted: boolean = false;
  private drawLabels: boolean = false;

  private readonly onAnimationFrame = () => this.renderCanvas();

  mounted() {
    this.isMounted = true;
    // For some reason, this.visualOptions is only accessible in this function.
    this.drawLabels = toRefs(this.visualsOptions).labels as any;

    // Init canvas
    let maybeCtx = (this.$refs.canvas as HTMLCanvasElement).getContext(
      "2d",
      this.visualizer.canvasOptions.canvas
    );
    if (!(maybeCtx instanceof CanvasRenderingContext2D)) {
      console.warn("This browser does not support Canvas 2D rendering");
      return;
    }
    this.ctx = maybeCtx;
    this.visualizer.init(maybeCtx);

    // Init labels
    maybeCtx = (this.$refs.labels as HTMLCanvasElement).getContext(
      "2d",
      this.visualizer.canvasOptions.labels
    )!;
    this.labelCtx = maybeCtx;
    this.visualizer.initLabels(maybeCtx);

    // Render
    EventBus.on("animation-frame", this.onAnimationFrame);
  }
  beforeUnmount() {
    this.isMounted = false;
    EventBus.stopListening("animation-frame", this.onAnimationFrame);
  }

  private renderCanvas() {
    if (this.isMounted) {
      this.visualizer.render(this.ctx!);
      if (this.drawLabels) this.visualizer.drawLabels(this.labelCtx!);
      this.labelCtx!.canvas.style.visibility = this.drawLabels ? "" : "hidden";
    }
  }
}
</script>

<style lang="sass" scoped>
@import @/assets/theme

.content
  position: relative

canvas
  width: 100%
  text-align: center
  font-size: 40px
  --canvas-background: #{$theme-background}
  --canvas-foreground: #{$theme-foreground}
  --canvas-middleground: #{$theme-middleground}
  --canvas-color: #{$theme-accent-light}
  --canvas-fontText: #{$theme-font-text}
  --canvas-fontButtons: #{$theme-font-buttons}
  --canvas-fontHeaders: #{$theme-font-headers}

  &:not(:first-of-type)
    position: absolute
    inset: 0
</style>