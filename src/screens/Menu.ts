import { Text, Assets, Sprite } from "pixi.js";
import { Screen } from "./Screen";
import Game from "../Game";
import { AceOfShadows } from "./AceOfShadows";
import { MagicWords } from "./MagicWords";
import { PhoenixFlame } from "./PhoenixFlame";
import { Button } from "../components/Button";
import { BackButton } from "../components/BackButton";
import { Tween, Easing } from "tweedle.js";

export class Menu extends Screen
{
	private buttons: Button[] = [];
	private currentScreen?: Screen;
	private readonly BUTTON_WIDTH = 300;
	private readonly BUTTON_HEIGHT = 60;
	private readonly BUTTON_SPACING = 20;
	private static combinedScreens?: {
		fire: PhoenixFlame;
		cards: AceOfShadows;
		dialogue: MagicWords;
	};

	constructor()
	{
		super();

		const background = Sprite.from(Assets.get("bg-green"));
		background.width = Game.app.screen.width;
		background.height = Game.app.screen.height;
		background.alpha = 0.8;
		this.addChild(background);

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
			const button = new Button({
				text: name,
				width: this.BUTTON_WIDTH,
				height: this.BUTTON_HEIGHT,
				fontSize: 24,
				onClick: () => this.switchToScreen(screen)
			});

			button.position.set(
				this.getScreenCenter().x,
				y
			);

			this.buttons.push(button);
			this.addChild(button);
			y += this.BUTTON_HEIGHT + this.BUTTON_SPACING;
		}
	}

	private switchToScreen(ScreenClass: (new () => Screen) | null): void
	{
		if (this.currentScreen)
		{
			this.currentScreen.hide();
			Game.app.stage.removeChild(this.currentScreen);
			this.currentScreen = undefined;
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

			// Store references to combined screens
			Menu.combinedScreens = { fire, cards, dialogue };

			// Create a back button for combined view
			const backButton = new BackButton(() =>
			{
				// Clean up combined screens on back button click
				if (Menu.combinedScreens)
				{
					Object.values(Menu.combinedScreens).forEach(screen =>
					{
						screen.hide();
						Game.app.stage.removeChild(screen);
					});
					Menu.combinedScreens = undefined;
				}
			});
			backButton.position.set(30, 70);
			Game.app.stage.addChild(backButton);
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