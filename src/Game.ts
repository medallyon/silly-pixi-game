import { Application, Container, Assets } from "pixi.js";
export default abstract class Game
{
	public static app: Application;

	public static async initialize()
	{
		const app = new Application();
		this.app = app;

		await app.init({ background: "#222", resizeTo: window, roundPixels: true });
		document.getElementById("pixi-container")!.appendChild(app.canvas);
	}
}
