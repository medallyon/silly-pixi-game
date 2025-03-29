import { Screen } from "./Screen";
import { Dialogue } from "../components/Dialogue";
import Game from "../Game";
import { BackButton } from "../components/BackButton";
import { ProgressBar } from "../components/ProgressBar";

const DIALOGUE_DATA_URL = "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords";

export class MagicWords extends Screen
{
	private dialogue?: Dialogue;
	private dialoguePosition: { x: number, y: number };
	private loadingBar?: ProgressBar;

	constructor(dialoguePosition: { x: number | undefined, y: number | undefined })
	{
		super();

		this.dialoguePosition = {
			x: dialoguePosition?.x || Game.app.screen.width / 2,
			y: dialoguePosition?.y || Game.app.screen.height / 2
		};;

		const backButton = new BackButton(this.hide.bind(this));
		backButton.position.set(30, 70); // Position under FPS counter
		this.addChild(backButton);
	}

	public async show(): Promise<void>
	{
		this.visible = true;

		// Add loading indicator
		this.loadingBar = new ProgressBar({
			width: 300,
			height: 40,
			text: "Loading dialogue..."
		});
		this.loadingBar.position.set(
			this.dialoguePosition.x - 150,
			this.dialoguePosition.y - 20
		);
		this.addChild(this.loadingBar);
		this.loadingBar.progress = 0;

		this.dialogue = new Dialogue();
		this.dialogue.position.set(
			this.dialoguePosition.x,
			this.dialoguePosition.y
		);
		this.addChild(this.dialogue);
		this.dialogue.visible = false;

		// Fetch dialogue data
		try
		{
			this.loadingBar.progress = 0.3;
			const response = await fetch(DIALOGUE_DATA_URL);
			this.loadingBar.progress = 0.6;
			const dialogueData = await response.json();
			this.loadingBar.progress = 0.8;
			await this.dialogue.loadDialogue(dialogueData);
			this.loadingBar.progress = 1;

			// Remove loading bar and show dialogue
			setTimeout(() =>
			{
				if (this.loadingBar)
				{
					this.removeChild(this.loadingBar);
					this.loadingBar = undefined;
				}
				if (this.dialogue)
				{
					this.dialogue.visible = true;
				}
			}, 500); // Short delay to show 100% completion
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
		if (this.loadingBar)
		{
			this.removeChild(this.loadingBar);
			this.loadingBar = undefined;
		}
	}

	public update(deltaTime: number): void
	{
		this.dialogue?.update(deltaTime);
		this.loadingBar?.update();
	}
}