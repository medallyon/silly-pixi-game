import { Container, Text } from "pixi.js";
import { Card } from "./Card";

/**
 * Base class for a deck of cards.
 * This class manages the display of the top and bottom card, as well as the card count.
 */
export abstract class Deck extends Container
{
	public title: string;

	protected topCard: Card | null = null;
	protected bottomCard: Card | null = null;
	protected cardCount: number = 0;
	protected countText: Text;

	protected static readonly CARD_SPACING = 2;

	/**
	 * Create a new Deck instance.
	 * @param title - The title of the deck (e.g., "Draw Pile", "Discard Pile").
	 */
	constructor(title: string = "")
	{
		super();

		this.title = title;

		this.countText = new Text({
			text: `${title}\n${this.cardCount} cards`,
			style: {
				fontFamily: "Arial",
				fontSize: 24,
				fill: 0xFFFFFF,
				stroke: 0x000000,
				align: "center"
			}
		});
		this.countText.anchor.set(0.5);
		this.countText.y = 130;
		this.addChild(this.countText);
	}

	/**
	 * Update the card display to reflect the current card count and top card.
	 * If the card count is greater than 0, a new top card is added.
	 */
	protected updateCardDisplay(): void
	{
		if (this.cardCount > 0 && !this.topCard)
			this.addNewTopCard();

		this.countText.text = `${this.title}\n${this.cardCount} cards`;
	}

	/**
	 * Add a new top card to the deck.
	 * If there is already a top card, it is removed first.
	 * If the card count is greater than 1, a bottom card is also added.
	 */
	protected addNewTopCard(): void
	{
		if (this.topCard)
			this.removeChild(this.topCard);

		this.topCard = new Card();
		this.addChild(this.topCard);

		if (!this.bottomCard && this.cardCount > 1)
		{
			this.bottomCard = new Card();
			this.bottomCard.position.y = Deck.CARD_SPACING;
			this.addChild(this.bottomCard);
		}
	}

	/**
	 * Remove the top card from the deck.
	 * If there is a bottom card, it is moved to the top position.
	 */
	public addCard(): void
	{
		this.cardCount++;
		this.updateCardDisplay();
	}

	public update(deltaTime: number): void
	{ }
}
