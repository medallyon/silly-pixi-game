import { Container } from "pixi.js";
import Game from "../Game";

export abstract class Screen extends Container
{
	constructor()
	{
		super();
	}

	public abstract show(): void;
	public abstract hide(): void;

	protected getScreenCenter(): { x: number, y: number }
	{
		return {
			x: Game.app.screen.width / 2,
			y: Game.app.screen.height / 2
		};
	}
}