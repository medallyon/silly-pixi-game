export interface DialogueEmoji
{
	name: string;
	url: string;
}

export interface DialogueAvatar
{
	name: string;
	url: string;
	position: 'left' | 'right';
}

export interface DialogueLine
{
	name: string;
	text: string;
}

export interface DialogueData
{
	dialogue: DialogueLine[];
	emojies: DialogueEmoji[];
	avatars: DialogueAvatar[];
}
