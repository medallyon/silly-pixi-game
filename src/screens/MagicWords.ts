import { Screen } from "./Screen";
import { Dialogue } from "../components/Dialogue";
import Game from "../Game";
import { BackButton } from "../components/BackButton";

const DIALOGUE_DATA_URL = "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords";

export class MagicWords extends Screen
{
	private dialogue?: Dialogue;

	constructor()
	{
		super();
		const backButton = new BackButton(this.hide.bind(this));
		backButton.position.set(30, 70); // Position under FPS counter
		this.addChild(backButton);
	}

	public async show(): Promise<void>
	{
		this.visible = true;

		this.dialogue = new Dialogue();
		this.dialogue.position.set(
			Game.app.screen.width / 2,
			Game.app.screen.height * 0.8
		);
		this.addChild(this.dialogue);

		// Fetch dialogue data
		try
		{
			const response = await fetch(DIALOGUE_DATA_URL);
			const dialogueData = await response.json();
			await this.dialogue.loadDialogue(dialogueData);
		} catch (error)
		{
			console.error('Failed to load dialogue:', error);
		}

		Game.registerUpdateMethod(this.update.bind(this));
	}

	public hide(): void
	{
		this.visible = false;
		if (this.dialogue)
		{
			this.removeChild(this.dialogue);
			this.dialogue = undefined;
		}
	}

	public update(deltaTime: number): void
	{
		this.dialogue?.update(deltaTime);
	}
}