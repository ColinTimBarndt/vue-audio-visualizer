import PanelSettingsAudio from "./components/PanelSettingsAudio.vue";
import PanelSettingsVisual from "./components/PanelSettingsVisual.vue";
import IPanel from "@/panel-type";
import uid from "./uid";

export class AudioSettings implements IPanel {
	readonly title = "Audio Settings";
	readonly component = PanelSettingsAudio.name;
	readonly componentAttributes = { settings: this };
	readonly componentPersistent = true;
	readonly uid = uid();
}

export class VisualSettings implements IPanel {
	readonly title = "Visual Settings";
	readonly component = PanelSettingsVisual.name;
	readonly componentAttributes = { settings: this };
	readonly componentPersistent = true;
	readonly uid = uid();
}
