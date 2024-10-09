
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
                color: "#54b4d3"
            });
            existingEdges[`${i}->${node.base}`] = true;
        }
        if (!existingNodes[node.base]) {
            nodes.push({ id: node.base, label: node.base.toString() });
            existingNodes[node.base] = true;
        }
        node.print();
    }
    return colorGraph({ nodes, edges });
}

var nodes = [ ];
var edges = [ ];
var network = null;

let FIXED_N = 12;
let COLOR_MODE = "none";

var data = generateGraph(FIXED_N);
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
}

// Callback passed as parameter is ignored
function clearNodePopUp() {

}


function saveNodeData(data, callback) {
  data.label = document.getElementById("node-label").value;
  clearNodePopUp();
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
  const submit = document.getElementById("submit");
  const highlight = document.getElementById("highlight");
  const fixedN = document.getElementById("fixed-n");
  if (!submit || !highlight || !fixedN) { return; }

  submit.addEventListener("click", () => {
    COLOR_MODE = highlight.value;
    FIXED_N = parseInt(fixedN.value);
    data = generateGraph(FIXED_N);
    init();
  })


});

function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;

  if (n % 2 == 0 || n % 3 == 0) return false;

  for (let i = 5; i * i <= n; i = i + 6) {
      if (n % i == 0 || n % (i + 2) == 0) return false;
  }

  return true;   
}

function colorGraph(network) {

  if (COLOR_MODE === 'cycles') {
    const nodesInCycle = findCycleNodes(network);
    const fixedNodes = findFixedNodes(network);

    network.nodes = network.nodes.map((node) => {
      return { ...node, color: nodesInCycle.includes(node.id) && !fixedNodes.includes(node.id) ? '#ffc107' : '#54b4d3' };
    })

    return network;
  }

  if ( COLOR_MODE === 'fixed') {
    const fixedNodes = findFixedNodes(network);

    network.nodes = network.nodes.map((node) => {
      return { ...node, color: fixedNodes.includes(node.id) ? '#ffc107' : '#54b4d3' };
    })

    return network;
  }



  network.nodes = network.nodes.map((node) => {
    if (COLOR_MODE === 'none') {
      return { ...node, color: '#54b4d3' };
    } else if (COLOR_MODE === 'primes') {
      return { ...node, color: isPrime(node.id) ? '#ffc107' : '#54b4d3' };
    } else if (COLOR_MODE === 'factors') {
      return { ...node, color: isFactor(node.id, FIXED_N) ? '#ffc107' : '#54b4d3' };
    } else if (COLOR_MODE === 'coprime') {
      return { ...node, color: areCoprime(node.id, FIXED_N) ? '#ffc107' : '#54b4d3' };
    }
  });
  return network;
}


function findCycleNodes(graph) {
  const N = graph.nodes.length;
  let visited = Array(N).fill(false);  // To mark visited nodes
  let recStack = Array(N).fill(false);  // To track nodes in the current DFS path
  let cycleNodes = new Set();  // To store nodes that are part of cycles

  // Helper function to perform DFS
  function dfs(node, path) {
      visited[node.id] = true;
      recStack[node.id] = true;  // Add the node to recursion stack
      path.push(node.id);  // Add node to the current path

      // Explore all adjacent nodes (outgoing edges)
      for (let edge of graph.edges) {
          if (edge.from === node.id) {
              let neighbor = edge.to;

              if (!visited[neighbor]) {
                  if (dfs(graph.nodes.find(n => n.id === neighbor), path)) {
                      return true;
                  }
              } else if (recStack[neighbor]) {
                  // Cycle detected, add nodes in the cycle
                  let cycleStartIndex = path.indexOf(neighbor);
                  if (cycleStartIndex !== -1) {
                      for (let i = cycleStartIndex; i < path.length; i++) {
                          cycleNodes.add(path[i]);
                      }
                  }
                  return true;  // Return true to indicate a cycle was found
              }
          }
      }

      recStack[node.id] = false;  // Remove the node from recursion stack
      path.pop();  // Remove node from current path
      return false;
  }

  // Run DFS on each node
  for (let node of graph.nodes) {
      if (!visited[node.id]) {
          dfs(node, []);
      }
  }

  // Return an array of cycle node IDs
  return Array.from(cycleNodes);
}

function findFixedNodes(graph) {
  let fixedNodes = new Set();
  for (let edge of graph.edges) {
      if (edge.from === edge.to) {
          fixedNodes.add(edge.from);
      }
  }
  return Array.from(fixedNodes);
}

function isFactor(n, N) {
  return N % n === 0;
}

function areCoprime(a, b) {
  
  function gcd(a, b) {
      if (b === 0) {
          return a;
      }
      return gcd(b, a % b);
  }

  return gcd(a, b) === 1;
}
