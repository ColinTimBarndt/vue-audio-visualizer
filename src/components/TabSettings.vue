<template>
  <panel-grid
    ref="grid"
    :rows="3"
    :columns="2"
    class="panels"
    :panels="panels"
  />
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import PanelGrid from "./PanelGrid.vue";
import { AudioSettings } from "@/settings.ts";

@Options({
  components: {
    PanelGrid,
  },
})
export default class App extends Vue {
  public panels = [new AudioSettings()];
}
</script>