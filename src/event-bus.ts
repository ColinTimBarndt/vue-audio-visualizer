import { readonly } from "vue";

type EventHandler<T = any> = (event: T) => void;
type Listeners<T = any> = {
	[p in Priority]?: EventHandlers<T>;
};
type EventHandlers<T> = Set<EventHandler<T>>;
enum Priority {
	High,
	Normal,
	Low,
}

const priorityOrder = [Priority.High, Priority.Normal, Priority.Low];

let listeners: { [type: string]: Listeners } = {};

function lazyGetHandlers<T>(
	type: string,
	priority = Priority.Normal
): EventHandlers<T> {
	let l: Listeners<T>;
	if (type in listeners) {
		l = listeners[type];
	} else {
		l = listeners[type] = {};
	}
	if (priority in l) {
		return l[priority]!;
	} else {
		return (l[priority] = new Set<EventHandler<T>>());
	}
}

const EventBus = readonly({
	emit<T>(type: string, event: T) {
		if (type in listeners) {
			const l: Listeners<T> = listeners[type];
			let priority: Priority;
			// Dispatch in priority order
			for (priority of priorityOrder) {
				if (priority in l) {
					l[priority]!.forEach((handler) => {
						try {
							handler(event);
						} catch (e) {
							console.error(`Error while dispatching event "${type}":`, e);
						}
					});
				}
			}
		}
	},
	on<T>(
		type: string,
		handler: EventHandler<T>,
		priority: Priority = Priority.Normal
	) {
		lazyGetHandlers<T>(type, priority).add(handler);
	},
	once<T>(
		type: string,
		handler: EventHandler<T>,
		priority: Priority = Priority.Normal
	) {
		this.on<T>(
			type,
			(event) => {
				try {
					handler(event);
				} finally {
					this.stopListening(type, handler, priority);
				}
			},
			priority
		);
	},
	stopListening<T>(
		type: string,
		handler: EventHandler<T>,
		priority: Priority = Priority.Normal
	) {
		listeners[type][priority]?.delete(handler);
	},
});

export default EventBus;
