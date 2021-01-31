<template>
  <panel-grid
    ref="grid"
    :rows="3"
    :columns="2"
    class="panels"
    :panels="panels"
    :add="true"
    @add-panel="addPanel"
    @close-panel="closePanel"
  />
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import PanelGrid from "./PanelGrid.vue";
import { VisualizerSelectPanel } from "@/visualizer";
import IPanel from "@/panel-type";
import { DeepReadonly, inject } from "vue";

@Options({
  components: {
    PanelGrid,
  },
  data() {
    const audioContext = inject<AudioContext>("audioContext")!;
    const audioInput = inject<AnalyserNode>("audioInput")!;
    const audioData = inject<{ frequency: any; timeDomain: any }>("audioData")!;

    return {
      audioContext,
      audioInput,
      audioData,
    };
  },
})
export default class App extends Vue {
  readonly audioContext!: AudioContext;
  readonly audioInput!: AnalyserNode;
  readonly audioData!: DeepReadonly<{
    frequency: Uint8Array;
    timeDomain: Uint8Array;
  }>;

  public panels: IPanel[] = [];

  addPanel() {
    const panel = new VisualizerSelectPanel((V: any) => {
      const idx = this.panels.indexOf(panel);
      if (idx >= 0) {
        this.panels.splice(
          idx,
          1,
          new V(
            V.visualizerName,
            this.audioInput,
            this.audioData,
            this.audioContext
          )
        );
      }
    });
    this.panels.push(panel);
  }

  closePanel(i: number) {
    this.panels.splice(i, 1);
  }
}
</script>