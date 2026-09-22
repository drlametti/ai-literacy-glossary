/* Critical AI Literacy: Terminology Map
 * All content comes from data/glossary.json — nothing about the glossary is
 * hard-coded here. Edit the JSON to change the map. */

(function () {
  "use strict";

  var DATA_URL = "data/glossary.json";

  // DOM handles
  var elGraph = document.getElementById("graph");
  var elLegend = document.getElementById("legend");
  var elStatus = document.getElementById("status");
  var elPanel = document.getElementById("detail-panel");
  var elName = document.getElementById("detail-name");
  var elChip = document.getElementById("detail-chip");
  var elGroup = document.getElementById("detail-group");
  var elDefinition = document.getElementById("detail-definition");
  var elConnected = document.getElementById("detail-connected");
  var elClose = document.getElementById("close-panel");
  var elLayout = document.querySelector(".layout");
  var elSearch = document.getElementById("search");
  var elResults = document.getElementById("search-results");
  var elReset = document.getElementById("reset-view");
  var elAllTerms = document.getElementById("all-terms-list");

  // State
  // These maps are keyed by data-supplied ids, so they are created without a
  // prototype: otherwise an id like "constructor" or "__proto__" would appear
  // to exist and be mistaken for a real term.
  var groups = Object.create(null);
  var terms = [];
  var byId = Object.create(null);
  var neighbours = Object.create(null);   // id -> array of ids
  var nodes = [];
  var links = [];
  var selectedId = null;
  var hoverId = null;
  var searchQuery = "";
  var searchMatches = [];
  var activeResult = -1;
  var linkPattern = null;   // RegExp for in-definition term links
  var aliasToId = Object.create(null);
  var svg, gRoot, linkSel, nodeSel, simulation, zoom;
  var width = 0, height = 0;
  var panMoved = false;

  /* ---- helpers ------------------------------------------------------- */

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
  }

  function groupColor(g) {
    return (groups[g] && groups[g].color) || "#888888";
  }

  function groupLabel(g) {
    return (groups[g] && groups[g].label) || g;
  }

  /* ---- data loading and validation ----------------------------------- */

  // "no-cache" revalidates with the server instead of trusting the cached copy,
  // so an edited glossary.json shows up immediately rather than after the
  // ten-minute GitHub Pages cache expires. Unchanged files still come back as a
  // cheap 304, so this costs nothing in the common case.
  var dataArrived = false;
  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " fetching " + DATA_URL);
      return res.json();
    })
    .then(function (data) {
      dataArrived = true;
      init(data);
    })
    .catch(function (err) {
      console.error("Could not load glossary data:", err);
      // Blaming file:// for what is actually a data problem sends you looking
      // in the wrong place, so say which of the two happened.
      elStatus.textContent = dataArrived
        ? "The glossary loaded but could not be displayed. Check " + DATA_URL +
          " — details are in the browser console."
        : "Could not load " + DATA_URL + ". If you opened this file directly, " +
          "run a local server instead (see README).";
    });

  function init(data) {
    Object.keys(data.groups || {}).forEach(function (key) {
      groups[key] = data.groups[key];
    });
    terms = (data.terms || []).slice();
    terms.forEach(function (t) {
      if (byId[t.id]) {
        console.warn('Glossary data: duplicate term id "' + t.id +
                     '". Only the last one will be reachable by link or #hash.');
      }
      byId[t.id] = t;
    });

    // Validate: links pointing at unknown ids are dropped with a warning.
    var rawLinks = data.links || [];
    var pairs = [];
    rawLinks.forEach(function (pair) {
      if (!Array.isArray(pair) || pair.length < 2) {
        console.warn("Glossary data: link entry " + JSON.stringify(pair) +
                     " is not a pair of term ids. Entry ignored.");
        return;
      }
      var a = pair[0], b = pair[1];
      var missing = [];
      if (!byId[a]) missing.push(a);
      if (!byId[b]) missing.push(b);
      if (missing.length) {
        console.warn(
          'Glossary data: link ["' + a + '", "' + b + '"] references unknown term id(s): ' +
          missing.join(", ") + ". Link ignored."
        );
        return;
      }
      pairs.push([a, b]);
    });

    // Adjacency and degree, computed before d3 mutates the link objects.
    terms.forEach(function (t) { neighbours[t.id] = []; });
    pairs.forEach(function (p) {
      if (neighbours[p[0]].indexOf(p[1]) === -1) neighbours[p[0]].push(p[1]);
      if (neighbours[p[1]].indexOf(p[0]) === -1) neighbours[p[1]].push(p[0]);
    });
    Object.keys(neighbours).forEach(function (id) {
      neighbours[id].sort(function (a, b) {
        return byId[a].name.localeCompare(byId[b].name);
      });
    });

    terms.forEach(function (t) {
      if (neighbours[t.id].length === 0) {
        console.warn('Glossary data: term "' + t.id + '" has no links.');
      }
    });

    nodes = terms.map(function (t) {
      var degree = neighbours[t.id].length;
      return {
        id: t.id,
        name: t.name,
        group: t.group,
        degree: degree,
        r: 5 + 2.2 * Math.sqrt(degree)
      };
    });
    links = pairs.map(function (p) { return { source: p[0], target: p[1] }; });

    buildLinkPattern();
    renderLegend();
    renderAllTerms();
    buildGraph();

    elStatus.textContent =
      terms.length + " terms · " + links.length + " connections. " +
      "Use Tab to move between terms, Enter to open one.";

    // Deep link: #term-id. No centring on first load — the layout is still
    // settling, and panning would push the rest of the map out of frame.
    var fromHash = hashId();
    if (fromHash) {
      selectTerm(fromHash, { center: false });
    }
    window.addEventListener("hashchange", function () {
      var id = hashId();
      if (id && id !== selectedId) selectTerm(id, { center: true });
      else if (!id && selectedId) clearSelection();
    });
  }

  function hashId() {
    var raw = location.hash.replace(/^#/, "");
    if (!raw) return null;
    try { raw = decodeURIComponent(raw); } catch (e) { /* keep raw */ }
    return byId[raw] ? raw : null;
  }

  /* ---- in-definition term links -------------------------------------- */
  // Builds one alternation regex over every term name (plus a few aliases),
  // longest first, so a single pass can't re-match text it just linked.
  function buildLinkPattern() {
    var aliases = [];

    function addAlias(text, id) {
      var key = text.toLowerCase();
      if (!(key in aliasToId)) aliasToId[key] = id;
      if (!(key + "s" in aliasToId)) aliasToId[key + "s"] = id;
      aliases.push(text);
    }

    terms.forEach(function (t) {
      addAlias(t.name, t.id);
      // "Transformers" should also match "transformer".
      if (/s$/i.test(t.name) && t.name.length > 2) {
        addAlias(t.name.slice(0, -1), t.id);
      }
    });

    // "LLM"/"LLMs" is the common shorthand. Bare "AI" is deliberately not
    // linked — it appears constantly and would make definitions unreadable.
    if (byId["large-language-model"]) {
      addAlias("LLM", "large-language-model");
    }

    aliases.sort(function (a, b) { return b.length - a.length; });

    var parts = aliases.map(function (a) {
      return escapeRegExp(a) + (/s$/i.test(a) ? "" : "s?");
    });
    linkPattern = new RegExp("\\b(?:" + parts.join("|") + ")\\b", "gi");
  }

  // Returns HTML for a definition, with mentions of other terms as buttons.
  function linkifyDefinition(term) {
    var html = escapeHtml(term.definition);
    if (!linkPattern) return html;
    linkPattern.lastIndex = 0;
    return html.replace(linkPattern, function (match) {
      var key = match.toLowerCase().replace(/\s+/g, " ");
      var id = aliasToId[key];
      if (!id && /s$/.test(key)) id = aliasToId[key.slice(0, -1)];
      // Don't link a term to itself, and don't link unknown matches.
      if (!id || id === term.id) return match;
      return '<button type="button" class="term-link" data-id="' + escapeHtml(id) +
             '" title="Show definition of ' + escapeHtml(byId[id].name) + '">' +
             match + "</button>";
    });
  }

  /* ---- static rendering ---------------------------------------------- */

  function renderLegend() {
    elLegend.innerHTML = "";
    Object.keys(groups).forEach(function (key) {
      var li = document.createElement("li");
      var chip = document.createElement("span");
      chip.className = "chip";
      chip.style.background = groupColor(key);
      var label = document.createElement("span");
      label.textContent = groupLabel(key);
      li.appendChild(chip);
      li.appendChild(label);
      elLegend.appendChild(li);
    });
  }

  // Plain alphabetical list: the whole glossary without the graph.
  function renderAllTerms() {
    elAllTerms.innerHTML = "";
    terms.slice()
      .sort(function (a, b) { return a.name.localeCompare(b.name); })
      .forEach(function (t) {
        var dt = document.createElement("dt");
        dt.id = "term-" + t.id;
        var chip = document.createElement("span");
        chip.className = "chip";
        chip.style.background = groupColor(t.group);
        chip.setAttribute("aria-hidden", "true");
        var nameSpan = document.createElement("span");
        nameSpan.textContent = t.name;
        var groupSpan = document.createElement("span");
        groupSpan.className = "group-name";
        groupSpan.textContent = "(" + groupLabel(t.group) + ")";
        dt.appendChild(chip);
        dt.appendChild(nameSpan);
        dt.appendChild(groupSpan);

        var dd = document.createElement("dd");
        dd.textContent = t.definition;

        elAllTerms.appendChild(dt);
        elAllTerms.appendChild(dd);
      });
  }

  /* ---- graph --------------------------------------------------------- */

  function measure() {
    var rect = elGraph.getBoundingClientRect();
    width = Math.max(320, rect.width);
    height = Math.max(300, rect.height);
  }

  function buildGraph() {
    measure();

    svg = d3.select(elGraph).append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("preserveAspectRatio", "xMidYMid meet");

    gRoot = svg.append("g");

    zoom = d3.zoom()
      .scaleExtent([0.3, 4])
      .on("start", function () { panMoved = false; })
      .on("zoom", function (event) {
        // Only a drag should suppress the click that ends it. A wheel zoom
        // emits no move event, so it must not swallow the next click.
        var src = event.sourceEvent;
        if (src && /move/.test(src.type)) panMoved = true;
        gRoot.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Click on empty space clears the selection (but not after a pan).
    svg.on("click", function () {
      if (panMoved) { panMoved = false; return; }
      clearSelection();
    });

    // Spread nodes around the centre so the layout settles predictably.
    nodes.forEach(function (n, i) {
      var angle = (i / nodes.length) * 2 * Math.PI;
      n.x = width / 2 + Math.cos(angle) * Math.min(width, height) * 0.3;
      n.y = height / 2 + Math.sin(angle) * Math.min(width, height) * 0.3;
    });

    linkSel = gRoot.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "link");

    nodeSel = gRoot.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", function (d) {
        return d.name + ", " + groupLabel(d.group) + ", " +
               d.degree + " connected term" + (d.degree === 1 ? "" : "s");
      });

    nodeSel.append("circle")
      .attr("r", function (d) { return d.r; })
      .attr("fill", function (d) { return groupColor(d.group); });

    nodeSel.append("text")
      .attr("x", function (d) { return d.r + 4; })
      .attr("dy", "0.32em")
      .text(function (d) { return d.name; });

    // Rough label width, used to flip labels inward near the frame edges.
    nodes.forEach(function (d) { d.labelW = d.name.length * 5.9; });

    nodeSel
      .on("click", function (event, d) {
        event.stopPropagation();
        selectTerm(d.id, { center: false });
      })
      .on("mouseenter", function (event, d) { hoverId = d.id; refreshVisual(); })
      .on("mouseleave", function () { hoverId = null; refreshVisual(); })
      .on("focus", function (event, d) { hoverId = d.id; refreshVisual(); })
      .on("blur", function () { hoverId = null; refreshVisual(); })
      .on("keydown", function (event, d) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectTerm(d.id, { center: false });
        }
      });

    nodeSel.call(
      d3.drag()
        .on("start", function (event, d) {
          if (!event.active) simulation.alphaTarget(0.15).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", function (event, d) {
          d.fx = event.x; d.fy = event.y;
        })
        .on("end", function (event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
    );

    simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function (d) { return d.id; })
        .distance(105).strength(0.45))
      .force("charge", d3.forceManyBody().strength(-520).distanceMax(560))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.08))
      // Extra vertical-ish room so the always-visible labels collide less.
      .force("collide", d3.forceCollide().radius(function (d) { return d.r + 22; }))
      .force("x", d3.forceX(width / 2).strength(0.03))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .on("tick", tick);

    // The graph box also changes size when the detail panel opens or closes,
    // which fires no window resize event — observe the element itself.
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(onResize).observe(elGraph);
    } else {
      window.addEventListener("resize", onResize);
    }
  }

  // Bring width/height, the viewBox, and the centring forces back in step with
  // the element's real size. Returns true if anything changed.
  function syncSize() {
    var prevW = width, prevH = height;
    measure();
    if (width === prevW && height === prevH) return false;
    svg.attr("viewBox", [0, 0, width, height]);
    simulation.force("center", d3.forceCenter(width / 2, height / 2).strength(0.08));
    simulation.force("x", d3.forceX(width / 2).strength(0.03));
    simulation.force("y", d3.forceY(height / 2).strength(0.05));
    return true;
  }

  function tick() {
    // Keep nodes inside the frame so labels stay readable at the default view.
    nodes.forEach(function (d) {
      var m = d.r + 2;
      d.x = Math.max(m, Math.min(width - m, d.x));
      d.y = Math.max(m, Math.min(height - m, d.y));
    });

    linkSel
      .attr("x1", function (d) { return d.source.x; })
      .attr("y1", function (d) { return d.source.y; })
      .attr("x2", function (d) { return d.target.x; })
      .attr("y2", function (d) { return d.target.y; });

    nodeSel.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

    // Put the label on whichever side keeps it inside the frame.
    nodes.forEach(function (d) {
      d.flip = (d.x + d.r + 4 + d.labelW > width) &&
               (d.x - d.r - 4 - d.labelW > 0);
    });
    nodeSel.select("text")
      .attr("text-anchor", function (d) { return d.flip ? "end" : "start"; })
      .attr("x", function (d) { return d.flip ? -(d.r + 4) : d.r + 4; });
  }

  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (syncSize()) simulation.alpha(0.2).restart();
    }, 150);
  }

  /* ---- highlighting -------------------------------------------------- */

  function refreshVisual() {
    if (!nodeSel) return;

    var focusId = hoverId || (searchQuery ? null : selectedId);

    if (focusId) {
      highlightNeighbourhood(focusId);
    } else if (searchQuery) {
      highlightMatches();
    } else {
      clearHighlight();
    }

    nodeSel.classed("selected", function (d) { return d.id === selectedId; });
  }

  function highlightNeighbourhood(id) {
    var keep = Object.create(null);
    keep[id] = true;
    (neighbours[id] || []).forEach(function (n) { keep[n] = true; });

    nodeSel
      .classed("dimmed", function (d) { return !keep[d.id]; })
      .classed("neighbour", function (d) { return keep[d.id] && d.id !== id; });

    linkSel
      .classed("dimmed", function (l) {
        return !(l.source.id === id || l.target.id === id);
      })
      .classed("active", function (l) {
        return l.source.id === id || l.target.id === id;
      });
  }

  function highlightMatches() {
    var keep = Object.create(null);
    searchMatches.forEach(function (t) { keep[t.id] = true; });

    nodeSel
      .classed("dimmed", function (d) { return !keep[d.id]; })
      .classed("neighbour", false);

    linkSel
      .classed("dimmed", function (l) {
        return !(keep[l.source.id] && keep[l.target.id]);
      })
      .classed("active", false);
  }

  function clearHighlight() {
    nodeSel.classed("dimmed", false).classed("neighbour", false);
    linkSel.classed("dimmed", false).classed("active", false);
  }

  /* ---- selection and detail panel ------------------------------------ */

  function selectTerm(id, opts) {
    var term = byId[id];
    if (!term) return;
    opts = opts || {};

    selectedId = id;
    renderPanel(term);
    refreshVisual();

    var target = "#" + id;
    if (location.hash !== target) {
      if (history.replaceState) history.replaceState(null, "", target);
      else location.hash = id;
    }

    if (opts.center !== false) centerOnNode(id);
  }

  function renderPanel(term) {
    elName.textContent = term.name;
    elChip.style.background = groupColor(term.group);
    elGroup.textContent = groupLabel(term.group);
    elDefinition.innerHTML = linkifyDefinition(term);

    elConnected.innerHTML = "";
    var list = neighbours[term.id] || [];
    if (!list.length) {
      var li = document.createElement("li");
      li.textContent = "None.";
      elConnected.appendChild(li);
    } else {
      list.forEach(function (nid) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.id = nid;
        btn.textContent = byId[nid].name;
        li.appendChild(btn);
        elConnected.appendChild(li);
      });
    }

    elPanel.hidden = false;
    elLayout.classList.remove("no-panel");
  }

  function clearSelection() {
    selectedId = null;
    elPanel.hidden = true;
    elLayout.classList.add("no-panel");
    refreshVisual();
    if (location.hash && history.replaceState) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  // Pan (without changing zoom) so the node sits in the middle of the view.
  function centerOnNode(id) {
    if (!svg || !zoom) return;
    syncSize();
    var node = nodes.filter(function (n) { return n.id === id; })[0];
    if (!node || typeof node.x !== "number") return;
    var t = d3.zoomTransform(svg.node());
    var k = t.k;
    svg.transition().duration(500).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2 - k * node.x, height / 2 - k * node.y)
        .scale(k)
    );
  }

  // Term buttons in the connected list and inside definitions.
  elPanel.addEventListener("click", function (event) {
    var btn = event.target.closest("button[data-id]");
    if (!btn) return;
    selectTerm(btn.dataset.id, { center: true });
  });

  elClose.addEventListener("click", clearSelection);

  /* ---- search -------------------------------------------------------- */

  function runSearch(query) {
    searchQuery = query.trim();
    if (!searchQuery) {
      searchMatches = [];
      hideResults();
      refreshVisual();
      return;
    }
    var q = searchQuery.toLowerCase();
    searchMatches = terms.filter(function (t) {
      return t.name.toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) {
      // Prefix matches first, then alphabetical.
      var ap = a.name.toLowerCase().indexOf(q) === 0 ? 0 : 1;
      var bp = b.name.toLowerCase().indexOf(q) === 0 ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });
    showResults();
    refreshVisual();
  }

  function showResults() {
    elResults.innerHTML = "";
    activeResult = -1;

    if (!searchMatches.length) {
      var li = document.createElement("li");
      li.className = "no-match";
      li.textContent = "No matching terms";
      elResults.appendChild(li);
    } else {
      searchMatches.slice(0, 10).forEach(function (t) {
        var li = document.createElement("li");
        li.setAttribute("role", "presentation");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", "false");
        btn.dataset.id = t.id;
        btn.textContent = t.name;
        li.appendChild(btn);
        elResults.appendChild(li);
      });
    }

    elResults.hidden = false;
    elSearch.setAttribute("aria-expanded", "true");
  }

  function hideResults() {
    elResults.hidden = true;
    elResults.innerHTML = "";
    activeResult = -1;
    elSearch.setAttribute("aria-expanded", "false");
  }

  function resultButtons() {
    return Array.prototype.slice.call(elResults.querySelectorAll("button[data-id]"));
  }

  function moveActive(delta) {
    var btns = resultButtons();
    if (!btns.length) return;
    activeResult = (activeResult + delta + btns.length) % btns.length;
    btns.forEach(function (b, i) {
      b.setAttribute("aria-selected", i === activeResult ? "true" : "false");
    });
    btns[activeResult].scrollIntoView({ block: "nearest" });
  }

  function chooseSearchResult(id) {
    searchQuery = "";
    searchMatches = [];
    elSearch.value = "";
    hideResults();
    selectTerm(id, { center: true });
  }

  elSearch.addEventListener("input", function () { runSearch(elSearch.value); });

  elSearch.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (elResults.hidden) runSearch(elSearch.value);
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      var btns = resultButtons();
      var pick = activeResult >= 0 ? btns[activeResult] : btns[0];
      if (pick) chooseSearchResult(pick.dataset.id);
    } else if (event.key === "Escape") {
      elSearch.value = "";
      runSearch("");
    }
  });

  elResults.addEventListener("click", function (event) {
    var btn = event.target.closest("button[data-id]");
    if (btn) chooseSearchResult(btn.dataset.id);
  });

  document.addEventListener("click", function (event) {
    if (!elResults.hidden && !event.target.closest(".search-wrap")) hideResults();
  });

  /* ---- reset view ---------------------------------------------------- */

  elReset.addEventListener("click", function () {
    if (!svg || !zoom) return;
    svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
    elSearch.value = "";
    runSearch("");
    // Reset means the whole map again: drop the selection and any fading
    // along with the zoom, so every node is back at full strength.
    hoverId = null;
    clearSelection();
    simulation.alpha(0.3).restart();
  });

})();
