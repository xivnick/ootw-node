
class Response extends Object {

	constructor(outputs = [], quickReplies = [], data = {}, useCallback=false) {
		super();

		Object.assign(this, {
	        version: '2.0',
	        template: {
	            outputs,
	            quickReplies,
	        },
	        data,
	        useCallback,
	    })
	}

	addOutput(item) {
		const component = new Component(item);
		this.template.outputs.push(component);

		return item;
	}

	addQuickReply(quickReply) {
		this.template.quickReplies.push(quickReply)
	}

	setCallback(data) {
		this.data = data;
		this.useCallback = true;
	}

	addSimpleText(text) {
		this.addOutput(new SimpleText({}, text));
	}
	addQuickReplyMessage(text, extra) {
		this.addQuickReply(new QuickReplyMessage(text, extra));
	}
}

class Component extends Object {

	constructor(item) {
		super();

		this[item._] = item;
	}
}

class Item extends Object {
	constructor(_, data = {}) {
		super();

		Object.assign(this, data);
		this._ = _;
	}

	setItem(item) {
		this[item._] = item;

		return item;
	}

	setThumbnail(thumbnail) {
		this.thumbnail = thumbnail;
	}

	addButton(button) {
		this.buttons.push(button);

		return button;
	}
	addItem(item) {
		this.items.push(item);

		return item;
	}
	addItemList(itemList) {
		this.itemList.push(itemList);

		return itemList;
	}

	addThumbnail(thumbnail) {
		this.thumbnails.push(thumbnail);

		return thumbnail;
	}
}

class Carousel extends Item {

	constructor(has, type = 'basicCard', header, items = []) {

		if(has && has.header) header = header || new CarouselHeader(has.header);

		super('carousel', {type, header, items})
	}

	setHeader(thumbnail, title, description) {
		this.header = new CarouselHeader(thumbnail, title, description);
	}

}


/* _____ _                 _      
  / ____(_)               | |     
 | (___  _ _ __ ___  _ __ | | ___ 
  \___ \| | '_ ` _ \| '_ \| |/ _ \
  ____) | | | | | | | |_) | |  __/
 |_____/|_|_| |_| |_| .__/|_|\___|
                    | |           
                    |_|           */


class SimpleText extends Item {
	constructor(has, text = '') {
		super('simpleText', {text});
	}
}

class SimpleImage extends Item {
	constructor(has, imageUrl = '', altText='') {
		super('simpleImage', {imageUrl, altText});
	}
}


class TextCard extends Item {
	constructor(has, title, description, buttons = []) {

		super('textCard', {title, description, buttons});
	}
}

class BasicCard extends Item {
	constructor(has, title, description, thumbnail = new Thumbnail(), buttons = []) {

		super('basicCard', {thumbnail, title, description, buttons});
	}
}

class CommerceCard extends Item {
	constructor(has, title, description, price = 0, currency, discount, discountRate, discountPrice, thumbnails = [], profile, buttons = []) {

		if(has && has.profile) profile = {};

		super('commerceCard', {thumbnails, title, price, discount, currency, buttons})
	}
}

class ListCard extends Item {

	constructor(has, header = new ListItem(), items = [], buttons = []) {

		super('listCard', {header, items, buttons});
	}
}

class ListItem extends Item {

	constructor(has, title = '', description, imageUrl, link, action, blockId, messageText, extra) {

		if(has && has.link) link = link || new Link(has.link);
		if(has && has.extra) extra = extra || new Extra(has.extra);

		super('listItem', {title, description, imageUrl, link, action, blockId, messageText, extra})
	}
}

class ItemCard extends Item {

	constructor(has, thumbnail, head, profile, imageTitle, itemList = [], itemListAlignment, itemListSummary, title, description, buttons = [], buttonLayout) {

		if(has && has.thumbnail) thumbnail = thumbnail || new ItemThumbnail(has.thumbnail);
		if(has && has.head) head = head || {};
		if(has && has.profile) profile = profile || {};
		if(has && has.imageTitle) imageTitle = imageTitle || new ImageTitle(has.imageTitle);
		if(has && has.itemListSummary) itemListSummary = itemListSummary || {};

		super('itemCard', {thumbnail, head, profile, imageTitle, itemList, itemListAlignment, itemListSummary, title, description, buttons, buttonLayout})
	}
}

class ItemThumbnail extends Item {

	constructor(has, imageUrl = '', width, height, link) {

		if(has && has.link) link = link || new Link(has.link);

		super('thumbnail', {imageUrl, width, height, link})
	}
}

class Head extends Item {

	constructor(has, title) {

		super('head', {title});
	}
}

class ImageTitle extends Item {

	constructor(has, title = '', description, imageUrl) {

		super('imageTitle', {title, description, imageUrl});
	}
}

class ItemList extends Item {
	constructor(has, title = '', description = '') {

		super('itemList', {title, description})
	}
}

class CarouselHeader extends Item {

	constructor(has, title = '', description = '', thumbnail = new Thumbnail()) {

		super('header', {thumbnail, title, description});
	}
}


class Thumbnail extends Item {

	constructor(has, imageUrl = '', link, fixedRatio = false) {

		if(has && has.link) link = link || new Link(has.link);

		super('thumbnail', {imageUrl, link, fixedRatio});
	}
}

class Link extends Item {

	constructor(has, pc, mobile, web) {

		super('link', {pc, mobile, web});
	}
}

class Button extends Item {
	constructor(has, label = '', action = 'message', messageText, webLinkUrl, phoneNumber, blockId, extra) {

		if(has && has.extra) extra = extra || new Extra(has.extra);
		if(action == 'message' || action == 'block') messageText = messageText || label;

		super('button', { label, action, messageText, webLinkUrl, phoneNumber, blockId, extra });
	}
}

class ButtonMessage extends Button {

	constructor(text, extra) {

		super({}, text, 'message', text, null, null, null, extra);
	}
}

class Extra extends Item {

	constructor(has, context, value) {
		super('extra', {context, value})
	}
}

class QuickReply extends Item {
	constructor(has, label, action = 'message', messageText, blockId, extra) {

		if(has && has.extra) extra = extra || new Extra(has.extra);

		messageText = messageText || label;

		super('quickReply', { label, action, messageText, blockId, extra });
	}
}

class QuickReplyMessage extends QuickReply {

	constructor(text, extra) {

		super({}, text, 'message', text, null, extra);
	}
}



module.exports = {
	Response,
	Carousel,
	CarouselHeader,

	Thumbnail,

	SimpleText,
	SimpleImage,

	TextCard,
	BasicCard,
	CommerceCard,
	ItemCard,
	ListCard,
	ListItem,

	ItemList,

	Link,

	Button,
	ButtonMessage,

	QuickReply,
	QuickReplyMessage,
}