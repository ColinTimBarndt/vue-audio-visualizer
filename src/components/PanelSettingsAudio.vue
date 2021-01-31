<template>
  <div class="options">
    <label
      >Input:
      <select v-model="selectedInput" @change="updateInput">
        <option value="none" selected>None</option>
        <option value="capture">Screen Capture</option>
        <optgroup label="Devices">
          <option
            v-for="device in inputDevices"
            :key="device.id"
            :value="'device:' + device.id"
          >
            {{ device.name || "Microphone" }}
          </option>
        </optgroup>
      </select></label
    >
    <span class="warning">{{ warning ?? "" }}</span>
    <div>Noise filter quality: {{ displayFQ }}</div>
    <input
      type="range"
      min="0"
      max="100"
      v-model="audioFilter.Q.value"
      @input="displayFQ = audioFilter.Q.value"
    />
    <div>Volume gain: {{ displayGain * 100 }}%</div>
    <input
      type="range"
      min="1"
      max="10"
      v-model="audioAmplifier.gain.value"
      @input="displayGain = audioAmplifier.gain.value"
    />
  </div>
</template>

<script lang="ts">
import { AudioSettings } from "@/settings";
import { inject } from "vue";
import { Options, Vue } from "vue-class-component";

/**
 * This component is allows the user to select an audio
 * input, which is then routed through a filter and
 * amplifier into the Audio Source of this app.
 *
 * `Stream -> Filter -> Amplifier -> Audio Source [-> Visualizers]`
 */
@Options({
  props: {
    settings: {
      type: AudioSettings,
      required: true,
    },
  },
  data() {
    const audioContext = inject<AudioContext>("audioContext")!;
    const setAudioSourceNode = inject<(v: AudioNode | null) => void>(
      "setAudioSourceNode"
    )!;

    const audioFilter = audioContext.createBiquadFilter();
    const audioAmplifier = audioContext.createGain();

    audioFilter.type = "bandpass";
    audioFilter.frequency.value = 900;
    audioFilter.Q.value = 20;

    audioAmplifier.gain.value = 5;

    // Stream -> Filter -> Amplifier -> Audio Source [-> Visualizers]
    audioFilter.connect(audioAmplifier);
    setAudioSourceNode(audioAmplifier);

    return {
      selectedInput: "none",
      warning: null,
      audioContext,
      audioFilter,
      audioAmplifier,
      displayGain: 5,
      displayFQ: 20,
    };
  },
})
export default class PanelSettingsAudio extends Vue {
  settings!: AudioSettings;
  warning!: string | null;
  protected selectedInput!: string;
  public audioFilter!: BiquadFilterNode;
  public audioAmplifier!: GainNode;
  // Injections
  protected audioContext!: AudioContext;

  public inputDevices: { name: string | null; id: string }[] = [];
  public inputStream: MediaStream | null = null;
  public inputNode: MediaStreamAudioSourceNode | null = null;

  private onDeviceChange: () => void = () => {
    this.updateDeviceList();
  };

  mounted() {
    // Add event listeners
    navigator.mediaDevices.addEventListener(
      "devicechange",
      this.onDeviceChange
    );
    this.updateDeviceList();
  }

  beforeUnmount() {
    // Remove event listeners
    navigator.mediaDevices.removeEventListener(
      "devicechange",
      this.onDeviceChange
    );
    // Close stream
    this.closeStream();
  }

  async updateDeviceList() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.inputDevices.splice(0, this.inputDevices.length);
    this.inputDevices.push(
      ...devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          name: device.label.length ? device.label : null,
          id: device.deviceId || "group:" + device.groupId,
        }))
    );
  }

  async updateInput() {
    this.warning = null;
    switch (this.selectedInput) {
      case "none":
        if (this.inputStream || this.inputNode) this.closeStream();
        break;
      case "capture":
        try {
          this.closeStream();
          // @ts-ignore (TypeScript does not know of this feature yet)
          this.inputStream = (await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true,
          })) as MediaStream;
          if (this.inputStream.getAudioTracks().length == 0) {
            this.warning = "Display Media input does not support audio.";
            this.closeStream();
            this.selectedInput = "none";
          } else {
            this.inputNode = this.audioContext.createMediaStreamSource(
              this.inputStream
            );
            this.inputNode.connect(this.audioFilter);
          }

          // Got access to device names
          this.updateDeviceList();
        } catch (e) {
          if (e instanceof TypeError) {
            console.warn("Unable to access media device.", e);
          } else {
            // Other error
            console.log(e);
          }
          this.closeStream();
          this.selectedInput = "none";
        }
        break;
      default:
        if (this.selectedInput.startsWith("device:")) {
          let id = this.selectedInput.substring(7);
          let constrainedId: "deviceId" | "groupId" = "deviceId";
          if (id.startsWith("group:")) {
            constrainedId = "groupId";
            id = id.substring(6);
          }
          try {
            this.closeStream();
            this.inputStream = await navigator.mediaDevices.getUserMedia({
              audio: { [constrainedId]: { exact: id } },
            });
            this.inputNode = this.audioContext.createMediaStreamSource(
              this.inputStream
            );
            this.inputNode.connect(this.audioFilter);

            // Got access to device names
            this.updateDeviceList();
          } catch (e) {
            console.warn("Unable to access media device.", e);
            this.closeStream();
            this.selectedInput = "none";
          }
        } else {
          // Unreachable
        }
    }
  }

  closeStream() {
    this.inputStream?.getTracks().forEach((track) => track.stop());
    this.inputStream = null;
    this.inputNode?.disconnect();
    this.inputNode = null;
  }
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

select
  background: transparent
  border: none
  border-bottom: 2px solid $theme-foreground
  font: 16pt $theme-font-text
  color: $theme-accent-light
  background: $theme-background
  max-width: 250px

.warning
  display: block
  color: $theme-accent-light
  min-height: 1em
</style>