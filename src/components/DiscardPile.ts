import { Deck } from "./Deck";
import { Card } from "./Card";

export class DiscardPile extends Deck
{
	private displayAtMost: number = 5; // Maximum number of cards to display at once
	private cards: Card[] = [];

	constructor()
	{
		super("Discard Pile");
	}

	public addCard(card?: Card): void
	{
		if (!card)
			return this.updateCardDisplay();

		card.position.set(0, 0);
		card.alpha = 1;

		this.addChild(card);
		this.cards.push(card);

		if (this.cards.length > this.displayAtMost)
		{
			const removedCard = this.cards.shift();
			if (removedCard)
				this.removeChild(removedCard);
		}

		this.cardCount++;
		this.countText.text = `${this.title}\n${this.cardCount} cards`;
	}
}
