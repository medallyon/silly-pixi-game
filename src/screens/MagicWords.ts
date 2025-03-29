import { Container, Graphics, Text } from "pixi.js";
import { Screen } from "./Screen";
import { Dialogue } from "../components/Dialogue";
import { Tween, Easing } from "tweedle.js";
import Game from "../Game";

const DIALOGUE_DATA_URL = "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords";

export class MagicWords extends Screen
{
	private dialogue?: Dialogue;
	private backButton?: Container;

	constructor()
	{
		super();
		this.createBackButton();
	}

	private createBackButton(): void
	{
		const button = new Container();
		button.eventMode = 'static';
		button.cursor = 'pointer';

		const bg = new Graphics()
			.roundRect(0, 0, 120, 40, 8)
			.fill({ color: 0x666666 });

		const label = new Text({
			text: "Back",
			style: {
				fontFamily: "Arial",
				fontSize: 20,
				fill: 0xFFFFFF,
			}
		});
		label.anchor.set(0.5);
		label.position.set(60, 20);

		button.addChild(bg, label);
		button.position.set(20, 20);

		button.on('pointerover', () =>
		{
			new Tween(button.scale)
				.to({ x: 1.1, y: 1.1 }, 100)
				.easing(Easing.Back.Out)
				.start();
		});

		button.on('pointerout', () =>
		{
			new Tween(button.scale)
				.to({ x: 1, y: 1 }, 100)
				.easing(Easing.Back.Out)
				.start();
		});

		button.on('pointertap', () =>
		{
			this.hide();
			Game.showMenu();
		});

		this.backButton = button;
		this.addChild(button);
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