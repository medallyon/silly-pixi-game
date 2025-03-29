import { Text, Assets, Sprite } from "pixi.js";
import { Screen } from "./Screen";
import Game from "../Game";
import { AceOfShadows } from "./AceOfShadows";
import { MagicWords } from "./MagicWords";
import { PhoenixFlame } from "./PhoenixFlame";
import { BackButton } from "../components/BackButton";
import { MenuCard } from "../components/MenuCard";
import { Tween, Easing } from "tweedle.js";

export class Menu extends Screen
{
	private cards: MenuCard[] = [];
	private currentScreen?: Screen;
	private readonly RADIUS = 450;
	private readonly START_ANGLE = -Math.PI * 0.65;
	private readonly END_ANGLE = -Math.PI * 0.35;
	private readonly CARD_ANGLE_OFFSET = Math.PI / 2; // Rotate cards 90 degrees to point outwards
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
		this.createCards();
	}

	private createTitle(): void
	{
		const title = new Text({
			text: "SOFTGAMES",
			style: {
				fontFamily: "RubikBubbles, Arial",
				fontSize: 150,
				fill: 0xFFFFFF,
				align: "center"
			}
		});

		title.anchor.set(0.5);
		title.position.set(this.getScreenCenter().x, this.getScreenCenter().y - 100);
		this.addChild(title);
	}

	private createCards(): void
	{
		const screens = [
			{ name: "Ace of Shadows", screen: AceOfShadows },
			{ name: "Magic Words", screen: MagicWords },
			{ name: "Phoenix Flame", screen: PhoenixFlame },
			{ name: "Combined Demo", screen: null }
		];

		// Calculate angle step between each card
		const angleStep = (this.END_ANGLE - this.START_ANGLE) / (screens.length - 1);
		const centerX = this.getScreenCenter().x;
		const centerY = this.height + 250;

		screens.forEach((screen, index) =>
		{
			const angle = this.START_ANGLE + (angleStep * index);
			const x = centerX + Math.cos(angle) * this.RADIUS;
			const y = centerY + Math.sin(angle) * this.RADIUS;

			const card = new MenuCard(screen.name, () => this.switchToScreen(screen.screen));
			card.position.set(x, y);
			card.rotation = angle + this.CARD_ANGLE_OFFSET; // Add offset to make cards point outwards

			this.cards.push(card);
			this.addChild(card);
		});
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

			const center = this.getScreenCenter();
			const dialogue = new MagicWords({ x: center.x, y: center.y + 200 });
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
		for (const card of this.cards)
		{
			card.scale.set(0);
			card.alpha = 0;

			// Animate both scale and alpha for a nice fade-in effect
			new Tween(card)
				.to({
					alpha: 1,
					scale: { x: 1, y: 1 }
				}, 500)
				.easing(Easing.Back.Out)
				.delay(this.cards.indexOf(card) * 100)
				.start();
		}
	}

	public hide(): void
	{
		this.visible = false;
	}
}