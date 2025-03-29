import { Button } from "./Button";
import Game from "../Game";
import { Screen } from "../screens/Screen";

export class BackButton extends Button
{
	constructor(onClick?: () => void)
	{
		super({
			width: 50,
			height: 50,
			imageKey: "button-back",
			onClick: () =>
			{
				// Remove the back button itself
				Game.app.stage.removeChild(this);

				// Execute any additional cleanup passed in through onClick
				if (onClick)
					onClick();

				// Show the existing menu instance
				Game.showMenu();
			}
		});
	}
}