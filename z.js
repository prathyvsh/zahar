((global) => {

    const charMap = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};

    const replaceTag = (tag) => charMap[tag] || tag;

    const escapeHTML = (str) => str.replace(/[&<>]/g, replaceTag);

    const areAttrs = attrs => (typeof attrs == "object" && !Array.isArray(attrs));

    const isContent = content => typeof content == "string" || Array.isArray(contents);

    const isTag = (tree) => {

	if(tree instanceof Array) {
	    
	    let [tag, attrs, _] = normalizeTree(tree);

	    /* There needs to be a better way to express this. Use some kind of grammar may be? */
	    return ((typeof tag == "string") && areAttrs(attrs));

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

    const processTag = (tag) => {

	let attrs = {};

	let idStart = tag.indexOf("#"), id = null;

	if(idStart > 0) {
	    
	let idEnd = tag.indexOf(".", idStart);

	if(idEnd < 0) idEnd = tag.length;

	id = tag.slice(idStart + 1, idEnd);

	tag = tag.slice(0, idStart) + tag.slice(idEnd);

	}

	let [parsed_tag, ...classes] = tag.split(".");

	Object.assign(attrs, id && {id}, (classes.length > 0) && {class: classes.join(" ")});

	return [parsed_tag, attrs];
	
    };

    const normalizeTree = (tree) => {

	let [tag, ...contents] = tree;

	let attrs = {};

	if(areAttrs(contents[0])) {

	    attrs = contents[0];
	    contents = contents.slice(1);
	    
	}

	let [parsed_tag, parsed_attrs] = processTag(tag);

	Object.assign(attrs, parsed_attrs);

	return [parsed_tag, attrs, ...contents];
	
    };

    const node = (tree = "") => {

	if(typeof tree == "string") {

	    return document.createTextNode(tree);

	} else if(isTag(tree)) {

	    let [tag, attrs, ...contents] = normalizeTree(tree);

	    let el = document.createElement(tag);

	    setAttrs(el, attrs);

	    let events = attrs.events || {};

	    if(events) Object.entries(events).forEach(([k,v]) => el.addEventListener(k, v));

	    delete attrs.events;

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

    const htmlText = (tree) => {

	let [tag, attrs, ...contents] = normalizeTree(tree);

	if(!tag) throw Error("Please provide a tag");

	let attrsStr = "";
	
	return `<${el}${(attrsStr) ? " " + attrsStr : ""}>${contents.map(serialize).join("")}</${el}>`;

    };

    const serialize = (tree = "") => {

	if(typeof tree == "string") {

	    return tree;

	} else if(Array.isArray(tree)) {
	    
	    return htmlText(tree);
	    
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
