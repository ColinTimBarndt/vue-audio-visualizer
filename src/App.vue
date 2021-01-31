<template>
  <div class="layout">
    <sidebar
      class="sidebar"
      title="Equalizer"
      ref="sidebar"
      defaultActive="visuals"
      :actions="actions"
      @action="tab = $event"
    />
    <main>
      <keep-alive>
        <tab-visuals v-if="tab === 'visuals'" />
        <tab-settings v-else-if="tab === 'settings'" />
      </keep-alive>
    </main>
  </div>
</template>

<script lang="ts">
import { provide, readonly, ref } from "vue";
import { Options, Vue } from "vue-class-component";
import TabVisuals from "./components/TabVisuals.vue";
import TabSettings from "./components/TabSettings.vue";
import Sidebar from "./components/Sidebar.vue";
import EventBus from "./event-bus";

@Options({
  components: {
    Sidebar,
    TabVisuals,
    TabSettings,
  },
  data() {
    const actx = new AudioContext({ latencyHint: "interactive" });
    const inputNode = actx.createAnalyser();
    inputNode.fftSize = 2048;
    inputNode.maxDecibels = -10;
    let source: AudioNode | null = null;

    const frequencyBuffer = new Uint8Array(inputNode.frequencyBinCount);
    const timeDomainBuffer = new Uint8Array(inputNode.frequencyBinCount * 2);

    provide("audioContext", actx);
    provide("audioInput", readonly(inputNode));
    provide(
      "audioData",
      readonly({
        frequency: ref(frequencyBuffer),
        timeDomain: ref(timeDomainBuffer),
      })
    );
    provide("setAudioSourceNode", (v: AudioNode | null) => {
      if (source) {
        source.disconnect();
        source = null;
      }
      if (v) {
        v.connect(inputNode);
      }
    });

    EventBus.on<number>("animation-frame", (_time) => {
      inputNode.getByteFrequencyData(frequencyBuffer);
      inputNode.getByteTimeDomainData(timeDomainBuffer);
    });

    return {
      tab: "visuals",
      audioInput: readonly(inputNode),
    };
  },
})
export default class App extends Vue {
  public tab!: string;
  public readonly actions = {
    visuals: new Sidebar.Action("Visuals"),
    settings: new Sidebar.Action("Settings"),
    about: new Sidebar.Action("About"),
  };
  public readonly audioInput!: AudioNode;
}
</script>

<style lang="sass" scoped>
.layout
  display: flex
  flex-direction: row
  height: 100%
  align-items: center

main
  overflow: hidden auto
  max-height: 100%
  flex: 1
</style>

<style lang="sass">
@import @/assets/theme

#app
  position: absolute
  inset: 0
  font: $theme-font-text
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
  background: $theme-background

#app ::selection
  color: $theme-accent-light
  background: $theme-foreground
</style>