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

	protected static readonly CARD_SPACING = 20;

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

		this.sortableChildren = true;
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
	 * Add a card to the deck.
	 * @param card - The card to add to the deck. If not provided, a new card is created.
	 */
	public addCard(card?: Card): void
	{
		if (card)
		{
			if (this.topCard)
				this.removeTopCard();

			this.topCard = card;
			this.addChild(card);
		}
		else
		{
			this.cardCount++;
			this.updateCardDisplay();
		}
	}

	/**
	 * Add a new top card to the deck.
	 */
	protected addNewTopCard(): void
	{
		if (this.topCard)
			this.removeChild(this.topCard);

		this.topCard = new Card();
		this.topCard.position.y = -Deck.CARD_SPACING;
		this.topCard.rotation = (Math.random() - 0.5) * 0.1;
		this.topCard.zIndex = 1;
		this.addChild(this.topCard);

		if (!this.bottomCard && this.cardCount > 1)
		{
			this.bottomCard = new Card();
			this.bottomCard.position.y = 0;
			this.bottomCard.zIndex = 0;
			this.addChild(this.bottomCard);
		}
	}

	/**
	 * Remove the top card from the deck.
	 * If there is a bottom card, it is moved to the top position.
	 */
	protected removeTopCard(): void
	{
		if (!this.topCard)
			return;

		this.removeChild(this.topCard);
		this.topCard = null;

		if (this.bottomCard)
		{
			if (this.cardCount <= 1)
			{
				// If only one card left, remove bottom card
				this.removeChild(this.bottomCard);
				this.bottomCard = null;
			} else
			{
				// Make bottom card the new top card with offset and rotation
				this.topCard = this.bottomCard;
				this.bottomCard = null;
				this.topCard.position.y = -Deck.CARD_SPACING;
				this.topCard.rotation = (Math.random() - 0.5) * 0.1;
				this.topCard.zIndex = 1;
			}
		}
	}
}
