/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module paste-from-office/filters/space
 */

/**
 * Replaces last space preceding elements closing tag with `&nbsp;`. Such operation prevents spaces from being removed
 * during further DOM/View processing (see especially {@link module:engine/view/domconverter~DomConverter#_processDataFromDomText}).
 * This method also takes into account Word specific `<o:p></o:p>` empty tags.
 * Additionally multiline sequences of spaces and new lines between tags are removed (see #39 and #40).
 *
 * @param {String} htmlString HTML string in which spacing should be normalized.
 * @returns {String} Input HTML with spaces normalized.
 */
export function normalizeSpacing( htmlString ) {
	// Run normalizeSafariSpaceSpans() two times to cover nested spans.
	return normalizeSafariSpaceSpans( normalizeSafariSpaceSpans( htmlString ) )
		// Remove all \r\n from "spacerun spans" so the last replace line doesn't strip all whitespaces.
		.replace( /(<span\s+style=['"]mso-spacerun:yes['"]>[\s]*?)[\r\n]+(\s*<\/span>)/g, '$1$2' )
		.replace( /<span\s+style=['"]mso-spacerun:yes['"]><\/span>/g, '' )
		.replace( / <\//g, '\u00A0</' )
		.replace( / <o:p><\/o:p>/g, '\u00A0<o:p></o:p>' )
		// Remove <o:p> block filler from empty paragraph. Safari uses \u00A0 instead of &nbsp;.
		.replace( /<o:p>(&nbsp;|\u00A0)<\/o:p>/g, '' )
		// Remove all whitespaces when they contain any \r or \n.
		.replace( />(\s*[\r\n]\s*)</g, '><' );
}

/**
 * Normalizes spacing in special Word `spacerun spans` (`<span style='mso-spacerun:yes'>\s+</span>`) by replacing
 * all spaces with `&nbsp; ` pairs. This prevents spaces from being removed during further DOM/View processing
 * (see especially {@link module:engine/view/domconverter~DomConverter#_processDataFromDomText}).
 *
 * @param {Document} htmlDocument Native `Document` object in which spacing should be normalized.
 */
export function normalizeSpacerunSpans( htmlDocument ) {
	htmlDocument.querySelectorAll( 'span[style*=spacerun]' ).forEach( el => {
		// Use `el.childNodes[ 0 ].data.length` instead of `el.innerText.length`. For `el.innerText.length` which
		// contains spaces mixed with `&nbsp;` Edge browser returns incorrect length.
		const innerTextLength = ( el.childNodes &&
			el.childNodes[ 0 ] &&
			el.childNodes[ 0 ].data &&
			el.childNodes[ 0 ].data.length ) || 0;

		el.innerHTML = Array( innerTextLength + 1 ).join( '\u00A0 ' ).substr( 0, innerTextLength );
	} );
}

// Normalizes specific spacing generated by Safari when content pasted from Word (`<span class="Apple-converted-space"> </span>`)
// by replacing all spaces sequences longer than 1 space with `&nbsp; ` pairs. This prevents spaces from being removed during
// further DOM/View processing (see especially {@link module:engine/view/domconverter~DomConverter#_processDataFromDomText}).
//
// This function is similar to {@link module:clipboard/utils/normalizeclipboarddata normalizeClipboardData util} but uses
// regular spaces / &nbsp; sequence for replacement.
//
// @param {String} htmlString HTML string in which spacing should be normalized
// @returns {String} Input HTML with spaces normalized.
function normalizeSafariSpaceSpans( htmlString ) {
	return htmlString.replace( /<span(?: class="Apple-converted-space"|)>(\s+)<\/span>/g, ( fullMatch, spaces ) => {
		return spaces.length === 1 ? ' ' : Array( spaces.length + 1 ).join( '\u00A0 ' ).substr( 0, spaces.length );
	} );
}
