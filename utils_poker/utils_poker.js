/**
 * 1-13：A-K 14：王
 * 
 */

var CARD_TYPE = {
    CARD_WILD: 0X0100,  // 癞子掩码(百搭牌)
    CARD_MUSK: 0XFF,  // 掩码

    TILE_SPADE: 0X10,  // 黑
    TILE_HEART: 0X20,  // 红
    TILE_CLUB: 0X30,  // 梅
    TILE_DIAMOND: 0X40,  // 方

    CARD_ACE: 0X01,    // A 
    CARD_JACK: 0X0B,   // J
    CARD_QUEEN: 0X0C,  // Q
    CARD_KING: 0X0D,   // K
    CARD_JOKER_S: 0X0E, // 小王
    CARD_JOKER_B: 0X0F, // 大王
}

exports.print_card = function print_card(card) {
    if ((card & CARD_TYPE.CARD_MUSK) == CARD_TYPE.CARD_MUSK) return "掩码"
    let str = "";
    if ((card & 0XF) == CARD_TYPE.CARD_JOKER_S) {
        str = "小王";
    }
    else if ((card & 0XF) == CARD_TYPE.CARD_JOKER_B) {
        str = "大王";
    }
    else {
        if ((card & 0XF0) == CARD_TYPE.TILE_SPADE) {
            str = "黑";
        }
        else if ((card & 0XF0) == CARD_TYPE.TILE_HEART) {
            str = "红";
        }
        else if ((card & 0XF0) == CARD_TYPE.TILE_CLUB) {
            str = "梅";
        }
        else if ((card & 0XF0) == CARD_TYPE.TILE_DIAMOND) {
            str = "方";
        }

        if ((card & 0XF) == CARD_TYPE.CARD_ACE) {
            str += "A";
        }
        else if ((card & 0XF) == CARD_TYPE.CARD_JACK) {
            str += "J";
        }
        else if ((card & 0XF) == CARD_TYPE.CARD_QUEEN) {
            str += "Q";
        }
        else if ((card & 0XF) == CARD_TYPE.CARD_KING) {
            str += "K";
        }
        else {
            str += (card & 0XF) % 10
        }
    }

    if ((card & 0XF00) == CARD_TYPE.CARD_WILD) {
        str += "(癞子)";
    }
    return str;
}

exports.print_cards = function print_cards(cards) {
    return cards.map(card => this.print_card(card))
}

/**
 * 初始化牌
 */
exports.cards_init = function cards_init(card_num = 52) {
    cards = [];

    cards.push(CARD_TYPE.CARD_JOKER_B);
    cards.push(CARD_TYPE.CARD_JOKER_S);
    for (let i = CARD_TYPE.CARD_ACE; i <= CARD_TYPE.CARD_KING; i++) {
        for (let j = CARD_TYPE.TILE_SPADE; j <= CARD_TYPE.TILE_DIAMOND; j += CARD_TYPE.TILE_SPADE) {
            cards.push(j | i);
        }
    }

    return cards;
}
