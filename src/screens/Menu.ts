import { Assets, Container, Graphics, Text } from "pixi.js";
import { Screen } from "./Screen";
import Game from "../Game";
import { AceOfShadows } from "./AceOfShadows";
import { MagicWords } from "./MagicWords";
import { PhoenixFlame } from "./PhoenixFlame";
import { Tween, Easing } from "tweedle.js";

export class Menu extends Screen
{
	private buttons: Container[] = [];
	private currentScreen?: Screen;
	private readonly BUTTON_WIDTH = 300;
	private readonly BUTTON_HEIGHT = 60;
	private readonly BUTTON_SPACING = 20;

	constructor()
	{
		super();

		this.loadFontAndCreateUI();
	}

	private async loadFontAndCreateUI(): Promise<void>
	{
		try
		{
			const fontFace = new FontFace('RubikBubbles', 'url(/assets/fonts/RubikBubbles-Regular.ttf)');
			await fontFace.load();
			document.fonts.add(fontFace);
		} catch (error)
		{
			console.error('Failed to load font:', error);
		}

		this.createTitle();
		this.createButtons();
	}

	private createTitle(): void
	{
		const title = new Text({
			text: "SOFTGAMES",
			style: {
				fontFamily: "RubikBubbles, Arial",
				fontSize: 100,
				fill: 0xFFFFFF,
				align: "center"
			}
		});

		title.anchor.set(0.5);
		title.position.set(this.getScreenCenter().x, 200);
		this.addChild(title);
	}

	private createButton(text: string, y: number, onClick: () => void): Container
	{
		const button = new Container();
		button.eventMode = 'static';
		button.cursor = 'pointer';

		const bg = new Graphics()
			.roundRect(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT, 10)
			.fill({ color: 0x666666 });

		const label = new Text({
			text,
			style: {
				fontFamily: "Arial",
				fontSize: 24,
				fill: 0xFFFFFF,
				align: "center"
			}
		});
		label.anchor.set(0.5);
		label.position.set(this.BUTTON_WIDTH / 2, this.BUTTON_HEIGHT / 2);

		button.addChild(bg, label);
		button.position.set(
			this.getScreenCenter().x - this.BUTTON_WIDTH / 2,
			y
		);

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

		button.on('pointertap', onClick);
		this.buttons.push(button);
		this.addChild(button);
		return button;
	}

	private createButtons(): void
	{
		let y = this.getScreenCenter().y - (this.BUTTON_HEIGHT * 2 + this.BUTTON_SPACING * 3) / 2;

		const screens = [
			{ name: "Ace of Shadows", screen: AceOfShadows },
			{ name: "Magic Words", screen: MagicWords },
			{ name: "Phoenix Flame", screen: PhoenixFlame },
			{ name: "Combined Demo", screen: null }
		];

		for (const { name, screen } of screens)
		{
			this.createButton(name, y, () => this.switchToScreen(screen));
			y += this.BUTTON_HEIGHT + this.BUTTON_SPACING;
		}
	}

	private switchToScreen(ScreenClass: (new () => Screen) | null): void
	{
		if (this.currentScreen)
		{
			this.currentScreen.hide();
			Game.app.stage.removeChild(this.currentScreen);
		}

		if (ScreenClass === null)
		{
			// Create all screens for combined demo
			const fire = new PhoenixFlame();
			fire.show();
			Game.app.stage.addChild(fire);

			const cards = new AceOfShadows();
			cards.show();
			Game.app.stage.addChild(cards);

			const dialogue = new MagicWords();
			dialogue.show();
			Game.app.stage.addChild(dialogue);

			// Create a back button for combined view
			const button = this.createButton("Back to Menu", 20, () =>
			{
				fire.hide();
				cards.hide();
				dialogue.hide();
				Game.app.stage.removeChild(fire);
				Game.app.stage.removeChild(cards);
				Game.app.stage.removeChild(dialogue);
				Game.app.stage.removeChild(button);
				this.show();
			});
			this.hide();
			return;
		}

		const screen = new ScreenClass();
		Game.app.stage.addChild(screen);
		screen.show();
		this.currentScreen = screen;
		this.hide();
	}

	public show(): void
	{
		this.visible = true;
		for (const button of this.buttons)
		{
			button.scale.set(0);
			new Tween(button.scale)
				.to({ x: 1, y: 1 }, 300)
				.easing(Easing.Back.Out)
				.delay(this.buttons.indexOf(button) * 100)
				.start();
		}
	}

	public hide(): void
	{
		this.visible = false;
	}
}