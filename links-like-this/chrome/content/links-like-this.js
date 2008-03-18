 var LINKSLIKETHIS = {
	strings : null,
	currentModel : null,
	styleHistory : [],
	
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
		
		if ((gContextMenu.target.nodeName == 'A') || (gContextMenu.target.parentNode.nodeName == 'A')){
			if (gContextMenu.target.nodeName == 'A'){
				this.currentModel = gContextMenu.target;
			}
			else {
				this.currentModel = gContextMenu.target.parentNode;
			}
			
			if (!this.currentModel.href) {
				return;
			}
			
			var sstring = this.currentModel.parentNode.parentNode.parentNode.nodeName;
			sstring += '/';
			sstring += this.currentModel.parentNode.parentNode.nodeName;
			sstring += '/';
			sstring += this.currentModel.parentNode.nodeName;
			
			var menu = document.getElementById("contentAreaContextMenu");

			var option = document.createElement('menuitem');
			option.setAttribute("id","links-like-this-option");
			option.setAttribute("label",this.strings.getString("linksLikeThis.menuOption"));
			option.setAttribute("accesskey",this.strings.getString("linksLikeThis.menuKey"));
			option.setAttribute("oncommand","LINKSLIKETHIS.findSimilarLinks();");
		
			menu.insertBefore(option, document.getElementById("context-sep-open"));
		}
	},
	
	findSimilarLinks : function (strictness){
		if (strictness == null) {
			strictness = 3;
		}

		var m = this.currentModel;
		
		var contextNode = m;
		
		for (var i = 0; i < strictness; i++){
			contextNode = contextNode.parentNode;
		}
		
		var linkSet = [];
		
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
		
		var links = content.document.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		
		var stylePoints = { "font-size" : LINKSLIKETHIS.getStyle(m, "font-size") };
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
				
					for (var i = 0; i < linkSet.length; i++){
						if (linkSet[i].href == link.href) {
							continue linkLoop;
						}
					}
				
					if (this.historyService.isVisitedURL(link.href) == shouldBeVisited){
						linkSet.push(link);
					}
				}
			}
		} while (link);
		
		for (var i = 0; i < linkSet.length; i++){
			link = linkSet[i];
			
			link.styleHistory = {};
			
			link.styleHistory.borderColor = link.style.borderColor;
			link.styleHistory.borderStyle = link.style.borderStyle;
			link.styleHistory.borderWidth = link.style.borderWidth;
			link.styleHistory.padding = link.style.padding;
			
			link.style.borderColor = '#f00';
			link.style.borderStyle = 'dotted';
			link.style.borderWidth = '3px';
			link.style.padding = '3px';
		}
		
		var confirmString = (linkSet.length == 1) ? this.strings.getString("linksLikeThis.confirmOpenSingle") : this.strings.getFormattedString("linksLikeThis.confirmOpenMultiple", [ linkSet.length ]); 
		
		if (confirm(confirmString)) {
			for (var i = 0; i < linkSet.length; i++){
				gBrowser.addTab(linkSet[i].href);
			}
		}
		else {
			for (var i = 0; i < linkSet.length; i++){
				link = linkSet[i];
				
				link.style.borderColor = link.styleHistory.borderColor;
				link.style.borderStyle = link.styleHistory.borderStyle;
				link.style.borderWidth = link.styleHistory.borderWidth;
				link.style.padding = link.styleHistory.padding;
			}
		}
	},
	
	getStyle : function (oElm, strCssRule){
		var strValue = "";
		if(content.document.defaultView && content.document.defaultView.getComputedStyle){
			strValue = content.document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
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