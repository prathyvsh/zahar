((global) => {

    const charMap = {'&': '&amp;', '<': '&lt;', '>': '&gt;'};

    const replaceTag = (tag) => charMap[tag] || tag;

    const escapeHTML = (str) => str.replace(/[&<>]/g, replaceTag);

    const $ = x => document.querySelector(x);

    const $all = x => document.querySelectorAll(x);

    const clearChildren = el => {

        while(el.hasChildNodes()) {
            el.removeChild(el.lastChild);
        }

    }

    const node = (nodes) => document.createRange().createContextualFragment(nodes);
    
    setAttrs = (el,attrs = {}) => Object.entries(attrs).map(([k,v]) => el.setAttribute(k,v));

    const attrsToStr = attrs => {

        const escapeStr = (st, c) => (typeof st == "string") ? `"${st}"` : st;

        const joinKV = (joiner, transform = (x => x)) => ([k, v]) => k + joiner + transform(v);
        
        const serializeStyle = s => Object.entries(s).map(joinKV(":")).join(";");

        const parseAttrs = ([k, v]) => 
              (k == "style") ? `${k}='${serializeStyle(v)}'` : joinKV("=", escapeStr)([k, v]);

        return Object.entries(attrs).map(parseAttrs).join(" ");

    };

    const htmlNode = (el, ...contents) => {

        if(!el) throw Error("Please provide a tag");
        let maybeAttrs = contents[0];
        let attrsStr = "";
        
        if(typeof maybeAttrs == "object" && !(maybeAttrs instanceof Array)) {

            attrsStr = attrsToStr(maybeAttrs);
            contents = contents.slice(1);

        }

        return `<${el}${(attrsStr) ? " " + attrsStr : ""}>${contents.map(serialize).join("")}</${el}>`

    };

    const serialize = (tree = "") => {

        if(typeof tree == "string") {

            return tree;

        } else if(tree instanceof Array) {
            
            let [tag, attrs, ...contents] = tree;

            return htmlNode(tag, attrs, ...contents);
            
        } else {
            
            console.log("Unknown item", tree)
            
        }

    };


    let append = (parentNode, tree) => {
	
        let content = node(serialize(tree));

        let result = parentNode.appendChild(content);

        return result;

    };

    // Creates HTML DOM from the provided text, clears the parentNode and then appends it on the given parentNode
    let render = (parentNode, tree) => {

        clearChildren(parentNode);

	return append(parentNode, tree)

    };


    const doc = (head = "",body = "") => {

        if(!body) {
            body = head;
            head = "";
        }

        return "<!doctype html>" + serialize(["html", ["head", ...head], ["body", ...body]]);

    };

    const css = link => serialize(["link", {rel: "stylesheet", type: "text/css", href: link}]);

    const z = {$, $all, clearChildren, setAttrs, node, serialize, append, render, css};

    const nodejsZ = {serialize, doc, css};

    global.z = z;

    if(typeof module !== "undefined" && module.exports)
        module.exports = nodejsZ;

})(this);
