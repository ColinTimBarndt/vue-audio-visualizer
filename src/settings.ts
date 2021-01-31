import PanelSettingsAudio from "./components/PanelSettingsAudio.vue";
import IPanel from "@/panel-type";
import uid from "./uid";

export class AudioSettings implements IPanel {
	readonly title = "Audio Settings";
	readonly component = PanelSettingsAudio.name;
	readonly componentAttributes = { settings: this };
	readonly componentPersistent = true;
	readonly uid = uid();
}
