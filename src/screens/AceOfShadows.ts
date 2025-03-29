import { Container, Graphics, Text } from "pixi.js";
import { Screen } from "./Screen";
import { CardDeck } from "../components/CardDeck";
import { DiscardPile } from "../components/DiscardPile";
import { Tween, Easing } from "tweedle.js";
import Game from "../Game";

export class AceOfShadows extends Screen
{
	private discardPile?: DiscardPile;
	private cardDeck?: CardDeck;
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

	public show(): void
	{
		this.visible = true;

		// Create discard pile first since card deck needs it
		this.discardPile = new DiscardPile();
		this.discardPile.position.set(
			Game.app.screen.width * 0.7,
			Game.app.screen.height / 2
		);
		this.addChild(this.discardPile);

		// Create card deck
		this.cardDeck = new CardDeck(144, this.discardPile);
		this.cardDeck.position.set(
			Game.app.screen.width * 0.3,
			Game.app.screen.height / 2
		);
		this.addChild(this.cardDeck);

		// Add to update loop
		Game.registerUpdateMethod(this.update.bind(this));
	}

	public hide(): void
	{
		this.visible = false;
		this.removeChild(this.discardPile!);
		this.removeChild(this.cardDeck!);
		this.discardPile = undefined;
		this.cardDeck = undefined;
	}

	public update(deltaTime: number): void
	{
		this.cardDeck?.update(deltaTime);
	}
}