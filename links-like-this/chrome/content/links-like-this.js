Components.utils.import( "resource://gre/modules/PlacesUtils.jsm" );
Components.utils.import( "resource:///modules/PlacesUIUtils.jsm" );

var LINKSLIKETHIS = {
	strings : null,
	
	load : function () {
		removeEventListener("load", LINKSLIKETHIS.init, false);
		
		addEventListener("select", LINKSLIKETHIS.checkForPanel, false);
		addEventListener("DOMContentLoaded", LINKSLIKETHIS.checkForPanel, false);
		document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", LINKSLIKETHIS.addMenuItem, false);
		addEventListener("unload", LINKSLIKETHIS.unload, false);
		
		LINKSLIKETHIS.strings = document.getElementById("links-like-this-bundle");
	},
	
	unload : function () {
		removeEventListener("select", LINKSLIKETHIS.checkForPanel, false);
		removeEventListener("DOMContentLoaded", LINKSLIKETHIS.checkForPanel, false);
		document.getElementById("contentAreaContextMenu").removeEventListener("popupshowing", LINKSLIKETHIS.addMenuItem, false);
		removeEventListener("unload", LINKSLIKETHIS.unload, false);
	},
	
	addMenuItem : function (event) {
		var existingOption = document.getElementById('links-like-this-option');
		
		if (existingOption){
			existingOption.parentNode.removeChild(existingOption);
		}
		
		var theNode = gContextMenu.target;
		
		content.document.lltDocument = theNode.ownerDocument;
		
		while (theNode.nodeName != 'BODY' && theNode.nodeName != 'A') {
			theNode = theNode.parentNode;
		}
		
		if (theNode && theNode.nodeName == 'A') {
			if (!theNode.href) {
				return;
			}
			
			content.document.lltDocument.modelNode = theNode;
			
			var menu = document.getElementById("contentAreaContextMenu");
			
			var option = document.createElement('menuitem');
			option.setAttribute("id","links-like-this-option");
			option.setAttribute("label",LINKSLIKETHIS.strings.getString("linksLikeThis.menuOption"));
			option.setAttribute("accesskey",LINKSLIKETHIS.strings.getString("linksLikeThis.menuKey"));
			option.setAttribute("oncommand","LINKSLIKETHIS.findSimilarLinks();");
		
			menu.insertBefore(option, document.getElementById("context-sep-open"));
		}
	},
	
	toggleLinkToBeOpened : function (link, modifyLinkSet) {
		if (link.toBeOpened) {
			link.style.backgroundColor = link.styleHistory.backgroundColor;
			
			if (modifyLinkSet) {
				for (var i = 0; i < content.document.linkSet.length; i++) {
					if (content.document.linkSet[i].href == link.href) {
						content.document.linkSet = content.document.linkSet.splice(i, 1);
						break;
					}
				}
			}
		}
		else {
			link.styleHistory = {};
			
			link.styleHistory.backgroundColor = link.style.backgroundColor;
			link.style.backgroundColor = '#ff6';
			
			if (modifyLinkSet) {
				content.document.lltDocument.linkSet.push(link);
			}
		}
		
		link.toBeOpened = !link.toBeOpened;
	},
	
	findSimilarLinks : function (strictness) {
		if (strictness == null) {
			strictness = 3;
		}
		
		selectAll = false;

		var m = content.document.lltDocument.modelNode;
		
		var contextNode = m;
		
		for (var i = 0; i < strictness; i++){
			contextNode = contextNode.parentNode;
		}
		
		content.document.lltDocument.linkSet = [];
		
		var xpath = "//";
		
		for (var i = strictness; i > 0; i--){
			var theNode = m;
			
			for (var x = 1; x < i; x++){
				theNode = theNode.parentNode;
			}
			
			xpath += theNode.nodeName;
		
			if (theNode == m){
				if (theNode.firstChild){
					for (var x = 0; x < theNode.childNodes.length; x++){
						if (theNode.childNodes[x].nodeName == 'IMG'){
							xpath += '[IMG]';
							break;
						}
					}
				}
			}
			else {
				xpath += '/';
			}
		}
		
		var links = content.document.lltDocument.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		
		var stylePoints = {};
		stylePoints["font-size"] = LINKSLIKETHIS.getStyle(m, "font-size");
		
		PlacesUtils.asyncHistory.isURIVisited(
			PlacesUIUtils.createFixedURI(m.href),
			function (uri, shouldBeVisited) {
				(function checkNextLink() {
					var link = links.iterateNext();
			
					if (link) {
						if (link.href){
							for (var i in stylePoints) {
								if (LINKSLIKETHIS.getStyle(link, i) != stylePoints[i]){
									checkNextLink();
									return;
								}
							}
				
							for (var i = 0; i < content.document.lltDocument.linkSet.length; i++){
								if (content.document.lltDocument.linkSet[i].href == link.href) {
									checkNextLink();
									return;
								}
							}
					
							if ( selectAll ) {
								content.document.lltDocument.linkSet.push(link);
								checkNextLink();
							}
							else {
								PlacesUtils.asyncHistory.isURIVisited(
									PlacesUIUtils.createFixedURI(link.href),
									function (uri, visited) {
										if (visited == shouldBeVisited) {
											content.document.lltDocument.linkSet.push(link);
										}

										checkNextLink();
									}
								);
							}
						}
					}
					else {
						for (var i = 0; i < content.document.lltDocument.linkSet.length; i++){
							LINKSLIKETHIS.toggleLinkToBeOpened(content.document.lltDocument.linkSet[i]);
						}

						content.document.lltDocument.shouldHavePanel = true;
						LINKSLIKETHIS.showPopup();
					}
				})();
			}
		);
	},
	
	hidePopup : function () {
		document.getElementById("links-like-this-confirmation").hidePopup();
	},
	
	showPopup : function () {
		var numLinks = content.document.lltDocument.linkSet.length;
		
		if (numLinks > 1) {
			document.getElementById("llt-num-links").value = "Open the " + numLinks + " highlighted links in tabs?";
		}
		else {
			document.getElementById("llt-num-links").value = "Open the highlighted link in a new tab?";
		}
		
		document.getElementById("links-like-this-confirmation").openPopup(
				document.getElementById("content"), 
				"overlap",
				Math.floor(content.window.innerWidth / 2) - 100,
				25,
				false,
				false);
	},
	
	checkForPanel : function () {
		if (content.document.lltDocument && content.document.lltDocument.shouldHavePanel) {
			LINKSLIKETHIS.showPopup();
		}
		else {
			LINKSLIKETHIS.hidePopup();
		}
	},
	
	cancelOpen : function () {
		content.document.lltDocument.shouldHavePanel = false;
		
		LINKSLIKETHIS.hidePopup();
		
		for (var i = 0; i < content.document.lltDocument.linkSet.length; i++){
			LINKSLIKETHIS.toggleLinkToBeOpened(content.document.lltDocument.linkSet[i]);
		}
	},
	
	confirmOpen : function (limit) {
		var browser = getBrowser();
		
		if (typeof limit != 'undefined') {
			limit = Math.min(limit, content.document.lltDocument.linkSet.length);
		}
		else {
			limit = content.document.lltDocument.linkSet.length;
		}
		
		for (var i = 0; i < limit; i++){
			browser.addTab(content.document.lltDocument.linkSet[i].href);
		}
		
		LINKSLIKETHIS.cancelOpen();
	},
	
	less : function () {
	},
	
	more : function () {
	},
	
	getStyle : function (oElm, strCssRule){
		var strValue = "";
		if(content.document.lltDocument.defaultView && content.document.lltDocument.defaultView.getComputedStyle){
			strValue = content.document.lltDocument.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
		}
		else if(oElm.currentStyle){
			strCssRule = strCssRule.replace(/-(w)/g, function (strMatch, p1){
				return p1.toUpperCase();
			});
			strValue = oElm.currentStyle[strCssRule];
		}
		return strValue;
	}
}