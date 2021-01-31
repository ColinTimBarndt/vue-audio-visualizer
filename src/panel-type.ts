export default interface IPanel {
	readonly title?: String;
	readonly component: String;
	readonly componentAttributes: { [prop: string]: any };
	readonly componentPersistent: boolean;
	readonly uid: number;
}
