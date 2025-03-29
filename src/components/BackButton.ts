import { Button } from "./Button";
import Game from "../Game";
import { Container, Assets, Sprite } from "pixi.js";

export class BackButton extends Container
{
	constructor(onBack?: () => void)
	{
		super();

		const button = new Button({
			width: 120,
			height: 120,
			fontSize: 20,
			onClick: () =>
			{
				if (onBack)
					onBack();

				Game.showMenu();
			}
		});

		// Get the first container and its first child (the sprite)
		const container = button.children[0] as Container;
		const buttonSprite = container.children[0] as Sprite;
		buttonSprite.texture = Assets.get("button-back");

		this.addChild(button);
		this.position.set(20, 20);
	}
}