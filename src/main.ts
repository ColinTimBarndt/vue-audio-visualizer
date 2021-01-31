import { createApp } from "vue";
import App from "./App.vue";
import "./polyfills";
import EventBus from "./event-bus";

createApp(App).mount("#app");

function render(time: number) {
	requestAnimationFrame(render);
	EventBus.emit("animation-frame", time);
}
requestAnimationFrame(render);
