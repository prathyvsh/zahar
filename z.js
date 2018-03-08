((global) => {

    const charMap = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};

    const replaceTag = (tag) => charMap[tag] || tag;

    const escapeHTML = (str) => str.replace(/[&<>]/g, replaceTag);

    const areAttrs = attrs => (typeof attrs == "object" && !(attrs instanceof Array));

    const isContent = content => typeof content == "string" || content instanceof Array;

    const isTag = (tree) => {

	if(tree instanceof Array) {
	    
	    let [tag, maybeAttrs = {}, ...content] = tree;

	    /* There needs to be a better way to express this. Use some kind of grammar may be? */
	    return ((typeof tag == "string") && areAttrs(maybeAttrs) && isContent(content)) || ((typeof tag == "string") && isContent(maybeAttrs));

	} else return false;

    };

    const $ = x => document.querySelector(x);

    const $all = (x) => document.querySelectorAll(x);

    const node$ = (node,x) => node.querySelector(x);

    const node$all = (node,x) => node.querySelectorAll(x);

    const clearChildren = el => {

	while(el.hasChildNodes())
	    el.removeChild(el.lastChild);

    };

    const node = (tree = "") => {

	if(typeof tree == "string") {

	    return document.createTextNode(tree);

	} else if(isTag(tree)) {

	    let [tag, ...contents] = tree;

	    let el = document.createElement(tag);

	    let maybeAttrs = contents[0], events = null;

	    if(areAttrs(maybeAttrs)) {
		
		events = maybeAttrs.events;

		delete maybeAttrs.events;

		setAttrs(el, maybeAttrs);

		contents = contents.slice(1);

	    };

	    if(events) Object.entries(events).forEach(([k,v]) => el.addEventListener(k, v));

	    contents.forEach(x => el.appendChild(node(x)));

	    return el;

	} else throw Error("Unknown tag passed in");

    };

    /* nodes: tree or trees */
    const nodes = (trees) => {

	let container = document.createDocumentFragment();

	trees.map(x => container.appendChild(node(x)));

	return container;

    };

    const nodesToFrag = (nodes) => document.createRange().createContextualFragment(nodes);
    
    const joinKV = (joiner, transform = (x => x)) => ([k, v]) => k + joiner + transform(v);

    const serializeStyle = s => Object.entries(s).map(joinKV(":")).join(";");

    const setAttrs = (el,attrs = {}) => Object.entries(attrs).map(([k,v]) => {

	if(k == "style") el.setAttribute(k, serializeStyle(v));

	else if(k == "data") Object.entries(v).map(([dataKey, dataVal]) => el.setAttribute(k + "-" + dataKey, dataVal));

	else el.setAttribute(k,v);

    });

    const attrsToStr = attrs => {

	const escapeStr = (st, c) => (typeof st == "string") ? `"${st}"` : st;

	const parseAttrs = ([k, v]) => 
	      (k == "style") ? `${k}='${serializeStyle(v)}'` : joinKV("=", escapeStr)([k, v]);

	return Object.entries(attrs).map(parseAttrs).join(" ");

    };

    const htmlText = (el, ...contents) => {

	if(!el) throw Error("Please provide a tag");
	let maybeAttrs = contents[0];
	let attrsStr = "";
	
	if(areAttrs(maybeAttrs)) {

	    attrsStr = attrsToStr(maybeAttrs);
	    contents = contents.slice(1);

	}

	return `<${el}${(attrsStr) ? " " + attrsStr : ""}>${contents.map(serialize).join("")}</${el}>`;

    };

    const serialize = (tree = "") => {

	if(typeof tree == "string") {

	    return tree;

	} else if(tree instanceof Array) {
	    
	    let [tag, attrs, ...contents] = tree;

	    return htmlText(tag, attrs, ...contents);
	    
	} else {
	    
	    throw Error("Unknown item", tree);
	    
	};

    };

    /* A tree is either: 
       string
       [tag: string]
       [tag: string, attrs: object]
       [tag: string, tree+]
       [tag: string, attrs: object, tree+] */
    let append = (parentNode, tree) => {

	parentNode.appendChild(node(tree));

	return parentNode;

    };

    // Creates HTML DOM from the provided text, clears the parentNode and then appends it on the given parentNode
    let render = (parentNode, treeOrArr) => {

	clearChildren(parentNode);

	//Append directly if it's a tree, otherwise it's an array and append each of them
	return isTag(treeOrArr) ? append(parentNode, treeOrArr) : treeOrArr.forEach(tree => append(parentNode, tree));

    };


    const doc = (head = "",body = "") => {

	if(!body) {
	    body = head;
	    head = "";
	}

	return "<!doctype html>" + serialize(["html", ["head", ...head], ["body", ...body]]);

    };

    const css = link => serialize(["link", {rel: "stylesheet", type: "text/css", href: link}]);

    const z = {$, $all, node$, node$all, doc, clearChildren, setAttrs, node, serialize, append, render, css};

    const nodejsZ = {serialize, doc, css, isTag};

    global.z = z;

    if(typeof module !== "undefined" && module.exports)
	module.exports = nodejsZ;

})(this);
