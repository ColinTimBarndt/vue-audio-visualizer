import IPanel from "@/panel-type";
import uid from "./uid";

export class AudioSettings implements IPanel {
	readonly title = "Audio Settings";
	readonly component = "panel-settings-audio";
	readonly componentAttributes = { settings: this };
	readonly componentPersistent = true;
	readonly uid = uid();
}

export class VisualSettings implements IPanel {
	readonly title = "Visual Settings";
	readonly component = "panel-settings-visual";
	readonly componentAttributes = { settings: this };
	readonly componentPersistent = true;
	readonly uid = uid();
}
