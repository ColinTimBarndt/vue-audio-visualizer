<template>
  <div
    class="panel-grid"
    :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }"
  >
    <template v-for="(panel, index) in panels">
      <panel-grid-panel
        v-if="index < columns * rows"
        :key="panel.uid"
        :title="panel.title"
        :panelX="index % columns"
        :panelY="Math.floor(index / columns)"
        :persistent="panel.componentPersistent"
        @close="$emit('close-panel', index)"
      >
        <component :is="panel.component" v-bind="panel.componentAttributes" />
      </panel-grid-panel>
    </template>
    <div
      class="add"
      v-if="add && panels.length < columns * rows"
      title="Add a panel"
      @click="$emit('add-panel')"
    >
      <i></i>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import IPanel from "@/panel-type";
import PanelGridPanel from "./PanelGridPanel.vue";
import PanelVisualizer from "./PanelVisualizer.vue";
import PanelSelectVisualizer from "./PanelSelectVisualizer.vue";
import PanelSettingsAudio from "./PanelSettingsAudio.vue";
import PanelSettingsVisual from "./PanelSettingsVisual.vue";

@Options({
  components: {
    PanelGridPanel,
    PanelVisualizer,
    PanelSelectVisualizer,
    PanelSettingsAudio,
    PanelSettingsVisual,
  },
  props: {
    columns: {
      type: Number,
      default: 2,
    },
    rows: {
      type: Number,
      default: 3,
    },
    add: {
      type: Boolean,
      default: false,
    },
    panels: {
      // Array<IPanel>
      validator(value: any) {
        return (
          Array.isArray(value) &&
          value.every(
            (panel: IPanel) =>
              typeof panel.component === "string" &&
              panel.componentAttributes instanceof Object
          )
        );
      },
      default: [],
    },
  },
  emits: {
    "close-panel"(event: any) {
      return typeof event === "number" && event >= 0;
    },
    "add-panel": null,
  },
})
export default class PanelGrid extends Vue {
  public columns!: number;
  public rows!: number;
  public panels!: IPanel[];
  public add!: boolean;
}
</script>

<style scoped lang="sass">
@import @/assets/_mixins
@import @/assets/theme

.panel-grid
  $inset: 10px
  display: grid
  grid-auto-rows: minmax(100px, auto)
  gap: $inset * 1.5
  padding: $inset

.add
  $border: 2px
  border: $border solid $theme-shadow-color
  border-radius: 5px
  opacity: 0.5
  transition: opacity 0.2s linear
  position: relative
  cursor: pointer
  min-height: 150px

  &:hover
    opacity: 1

  i
    display: block
    width: 50%
    height: 50%
    margin: auto
    position: relative
    top: 25%
    // Image template with placeholder for theme color ($color)
    $image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.1' width='128' height='128'%3E%3Cdefs%3E%3Cmask id='m'%3E%3Crect width='128' height='128' fill='%23fff'/%3E%3Cpath d='M16 54H54V16h20V54H112v20H74V112h-20V74H16Z' stroke='%23000' stroke-linejoin='round' stroke-width='5' fill='black'/%3E%3C/mask%3E%3C/defs%3E%3Ccircle cx='50%25' cy='50%25' r='50%25' fill='$color' mask='url(%23m)'/%3E%3C/svg%3E"
    $image-color-string: str-replace(#{$theme-shadow-color}, "#", "%23")
    background-image: url(str-replace($image, "$color", $image-color-string))
    background-repeat: no-repeat
    background-size: contain
    background-position: center
</style>