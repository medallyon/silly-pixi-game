import { Application, BitmapText, Container } from "pixi.js";
import Game from "../Game";

interface FpsCounterOptions
{
	x: number;
	y: number;
}

/**
 * FPS Counter component.
 * Displays the current frames per second (FPS) of the application.
 */
export class FpsCounter extends Container
{
	private _app: Application;
	private _fpsText: BitmapText;

	constructor({ x, y }: FpsCounterOptions = { x: 10, y: 10 })
	{
		super();

		this._app = Game.app;

		// @ts-expect-error PIXI Docs Parser struggles to understand the constructor signature
		this._fpsText = new BitmapText({
			text: "FPS: 0",
			style: {
				fontFamily: "Arial",
				fontSize: 100,
				tint: 0xffffff,
			},
		});
		this._fpsText.scale.set(0.2);
		this._fpsText.position.set(x, y);

		this.addChild(this._fpsText);
	}

	public update(): void
	{
		this._fpsText.text = `FPS: ${Math.round(this._app.ticker.FPS)}`;
	}
}
