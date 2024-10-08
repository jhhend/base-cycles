
class Node {
    constructor(value, base, done=false) {
        this.value = value;
        this.base = base;
        this.done = done;
    }
    
    next() {
        const newBase = this.value.split('').reduce((acc, cur) => {
            if (cur === "0") { return acc; }
            return acc + parseInt(convertBase(cur, this.base, 10))
        }, 0);
        
        if (newBase == 1) {
            return new Node(1, 1, true);
        }
        
        if (this.base == newBase) {
            return new Node(this.value, this.base, true);
        }
        
        let n = convertBase(this.value, this.base, newBase);
        return new Node(n, newBase);
    }

    toString() {
        return `${this.value}(b${this.base})`;
    }

    print() {
        console.log(`${this.value}(b${this.base})`)
    }
}

function generateGraph(N) {
    let nodes = [ ];
    let edges = [ ];
    let existingNodes = { };
    let existingEdges = { };
    for (let i = 2; i < N; i++) {
        if (!existingNodes[i]) {
            nodes.push({ id: i, label: i.toString() });
            existingNodes[i] = true;
        }
        let node = new Node(convertBase(N.toString(), 10, i), i);
        node.print();
        node = node.next();
        if (!existingEdges[`${i}->${node.base}`]) {
            edges.push({
                from: i,
                to: node.base,
                arrows: 'to',
            });
            existingEdges[`${i}->${node.base}`] = true;
            console.log(existingEdges);
        }
        if (!existingNodes[node.base]) {
            nodes.push({ id: node.base, label: node.base.toString(), });
            existingNodes[node.base] = true;
        }
        node.print();
    }
    return { nodes, edges };
}

var nodes = [ ];
var edges = [ ];
var network = null;

var data = generateGraph(12);
var seed = 2;

function destroy() {
  if (network !== null) {
    network.destroy();
    network = null;
  }
}

function draw() {
  destroy();
  nodes = [];
  edges = [];

  // create a network
  var container = document.getElementById("network");
  var options = {
    layout: { randomSeed: seed }, // just to make sure the layout is the same when the locale is changed
  };
  network = new vis.Network(container, data, options);
}

function editNode(data, cancelAction, callback) {
  document.getElementById("node-label").value = data.label;
  document.getElementById("node-saveButton").onclick = saveNodeData.bind(
    this,
    data,
    callback
  );
  document.getElementById("node-cancelButton").onclick = cancelAction.bind(
    this,
    callback
  );
  document.getElementById("node-popUp").style.display = "block";
}

// Callback passed as parameter is ignored
function clearNodePopUp() {
  document.getElementById("node-saveButton").onclick = null;
  document.getElementById("node-cancelButton").onclick = null;
  document.getElementById("node-popUp").style.display = "none";
}

function cancelNodeEdit(callback) {
  clearNodePopUp();
  callback(null);
}

function saveNodeData(data, callback) {
  data.label = document.getElementById("node-label").value;
  clearNodePopUp();
  callback(data);
}

function editEdgeWithoutDrag(data, callback) {
  // filling in the popup DOM elements
  document.getElementById("edge-label").value = data.label;
  document.getElementById("edge-saveButton").onclick = saveEdgeData.bind(
    this,
    data,
    callback
  );
  document.getElementById("edge-cancelButton").onclick = cancelEdgeEdit.bind(
    this,
    callback
  );
  document.getElementById("edge-popUp").style.display = "block";
}

function clearEdgePopUp() {
  document.getElementById("edge-saveButton").onclick = null;
  document.getElementById("edge-cancelButton").onclick = null;
  document.getElementById("edge-popUp").style.display = "none";
}

function cancelEdgeEdit(callback) {
  clearEdgePopUp();
  callback(null);
}

function saveEdgeData(data, callback) {
  if (typeof data.to === "object") data.to = data.to.id;
  if (typeof data.from === "object") data.from = data.from.id;
  data.label = document.getElementById("edge-label").value;
  clearEdgePopUp();
  callback(data);
}

function convertBase(str, fromBase, toBase) {

    const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/!@#$%^&*()-_=[]{};:,.<>?ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥ƒáíóúñÑ¿░▒▓αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°";

    const add = (x, y, base) => {
        let z = [];
        const n = Math.max(x.length, y.length);
        let carry = 0;
        let i = 0;
        while (i < n || carry) {
            const xi = i < x.length ? x[i] : 0;
            const yi = i < y.length ? y[i] : 0;
            const zi = carry + xi + yi;
            z.push(zi % base);
            carry = Math.floor(zi / base);
            i++;
        }
        return z;
    }

    const multiplyByNumber = (num, x, base) => {
        if (num < 0) return null;
        if (num == 0) return [];

        let result = [];
        let power = x;
        while (true) {
            num & 1 && (result = add(result, power, base));
            num = num >> 1;
            if (num === 0) break;
            power = add(power, power, base);
        }

        return result;
    }

    const parseToDigitsArray = (str, base) => {
        const digits = str.split('');
        let arr = [];
        for (let i = digits.length - 1; i >= 0; i--) {
            const n = DIGITS.indexOf(digits[i])
            if (n == -1) return null;
            arr.push(n);
        }
        return arr;
    }

    const digits = parseToDigitsArray(str, fromBase);
    if (digits === null) return null;

    let outArray = [];
    let power = [1];
    for (let i = 0; i < digits.length; i++) {
        digits[i] && (outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase));
        power = multiplyByNumber(fromBase, power, toBase);
    }

    let out = '';
    for (let i = outArray.length - 1; i >= 0; i--)
        out += DIGITS[outArray[i]];

    return out;
}

function init() {
  draw();
}

document.addEventListener("DOMContentLoaded", () => {
  init();

  // Get the dropdown
  var dropdown = document.getElementById("fixed-n");
  if (!dropdown) { return; }

  dropdown.addEventListener("change", (e) => {
    const N = parseInt(e.target.value);
    data = generateGraph(N);
    init();
  })


});
