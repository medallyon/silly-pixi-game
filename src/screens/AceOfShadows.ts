import { Screen } from "./Screen";
import { CardDeck } from "../components/CardDeck";
import { DiscardPile } from "../components/DiscardPile";
import Game from "../Game";
import { BackButton } from "../components/BackButton";

export class AceOfShadows extends Screen
{
	private discardPile?: DiscardPile;
	private cardDeck?: CardDeck;

	constructor()
	{
		super();
		const backButton = new BackButton(this.hide.bind(this));
		backButton.position.set(30, 70); // Position under FPS counter
		this.addChild(backButton);
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