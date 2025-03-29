import { Button } from "./Button";
import Game from "../Game";

export class BackButton extends Button
{
	constructor(onBack?: () => void)
	{
		super({
			text: "Back",
			width: 120,
			height: 40,
			fontSize: 20,
			onClick: () =>
			{
				if (onBack)
				{
					onBack();
				}
				Game.showMenu();
			}
		});

		this.position.set(20, 20);
	}
}