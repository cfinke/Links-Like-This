 var LINKSLIKETHIS = {
	strings : null,
	
	init : function () {
		this.strings = document.getElementById("links-like-this-bundle");
		this.enableTheseLinks();
	},
	
	enableTheseLinks : function () {
		var cm = document.getElementById("contentAreaContextMenu");
		cm.addEventListener("popupshowing", function (event) { LINKSLIKETHIS.addMenuItem(event); }, false);
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
			option.setAttribute("label",this.strings.getString("linksLikeThis.menuOption"));
			option.setAttribute("accesskey",this.strings.getString("linksLikeThis.menuKey"));
			option.setAttribute("oncommand","LINKSLIKETHIS.findSimilarLinks();");
		
			menu.insertBefore(option, document.getElementById("context-sep-open"));
		}
	},
	
	linkEventHandler : function (event) {
		return true;
		var theNode = event.target;
		
		while (theNode != document.body && theNode.nodeName != 'A') {
			theNode = theNode.parentNode;
		}
		
		if (theNode && theNode.nodeName == 'A') {
			event.stopPropagation();
			event.preventDefault();
		
			var link = event.target;
		
			LINKSLIKETHIS.toggleLinkToBeOpened(theNode, true);
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
		stylePoints["font-size"] = this.getStyle(m, "font-size");
		
		var shouldBeVisited = this.historyService.isVisitedURL(m.href);
		
		linkLoop : do {
			var link = links.iterateNext();
			
			if (link) {
				if (link.href){
					for (var i in stylePoints) {
						if (this.getStyle(link, i) != stylePoints[i]){
							continue linkLoop;
						}
					}
				
					for (var i = 0; i < content.document.lltDocument.linkSet.length; i++){
						if (content.document.lltDocument.linkSet[i].href == link.href) {
							continue linkLoop;
						}
					}
				
					if (selectAll || this.historyService.isVisitedURL(link.href) == shouldBeVisited){
						content.document.lltDocument.linkSet.push(link);
					}
				}
			}
		} while (link);
		
		for (var i = 0; i < content.document.lltDocument.linkSet.length; i++){
			this.toggleLinkToBeOpened(content.document.lltDocument.linkSet[i]);
		}
		
		content.document.lltDocument.shouldHavePanel = true;
		this.showPopup();
	},
	
	hidePopup : function () {
		// content.document.body.removeEventListener("click", LINKSLIKETHIS.linkEventHandler, true);
		
		document.getElementById("links-like-this-confirmation").hidePopup();
	},
	
	showPopup : function () {
		// content.document.body.addEventListener("click", LINKSLIKETHIS.linkEventHandler, true);
		
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
		this.hidePopup();
		
		if (content.document.lltDocument && content.document.lltDocument.shouldHavePanel) {
			this.showPopup();
		}
	},
	
	cancelOpen : function () {
		content.document.lltDocument.shouldHavePanel = false;
		
		this.hidePopup();
		
		for (var i = 0; i < content.document.lltDocument.linkSet.length; i++){
			this.toggleLinkToBeOpened(content.document.lltDocument.linkSet[i]);
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
	},
	
	historyService : {
		hService : Components.classes["@mozilla.org/browser/global-history;2"].getService(Components.interfaces.nsIGlobalHistory2),
		ioService : Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService),
		
		URI : null,
		
		isVisitedURL : function(url){
			try {
				this.URI = this.ioService.newURI(url, null, null);
				return this.hService.isVisited(this.URI);
			} catch (e) {
				// Malformed URI, probably
				return false;
			}
		}
	},
}