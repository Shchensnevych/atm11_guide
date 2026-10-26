// @ts-check
// Згорнутий спойлер (боси, ендгейм).
import { h } from '../core/dom.js';
/** @param {any} content @param {string} [label] */
export const spoiler = (content, label = 'Спойлер — показати') => h('details.spoiler', null, h('summary', null, '⚠ ' + label), content);
