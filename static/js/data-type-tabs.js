/* =========================================================================
   Data type tabs
   The tabs on the data types landing page. The data-type-tabs shortcode
   writes the tabs and a panel for each data type. This script switches
   between them and plays the animation of the tab on show.

   Each panel has a heading that isn't shown, with the ID it had when the
   page was a list of sections, so a link to #sorted-sets opens that tab.
   Choosing a tab puts that ID in the address bar, so the address can be
   shared.

   A data type can belong under another one, as bitfields does under
   strings. In a narrow column, where the tabs are rows of pills, its tab is
   offered only while that tab, or one next to it, is the one on show.

   Only the first animation is on the page at load. Another one is added
   when its tab is first opened, and it starts again from its first command
   each time the reader comes back to the tab. data-type-animation.js must
   load first.
   ========================================================================= */
(function () {
  "use strict";

  function setup(root) {
    if (root.dttReady) return;   // this file ran twice
    root.dttReady = true;
    const tabs = Array.prototype.slice.call(root.querySelectorAll(".dtt-tab"));
    const panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    const ids = tabs.map(function (t) { return t.getAttribute("data-id"); });   // the IDs that links and the address use
    const above = tabs.map(function (t) { return t.getAttribute("data-parent") || ""; });   // the tab each one belongs under, if any
    let cur = Math.max(0, tabs.findIndex(function (t) { return t.getAttribute("aria-selected") === "true"; }));

    /* Play the panel's animation from its first command. The first time, that means adding it. */
    function animate(panel) {
      const holder = panel.querySelector(".dtt-anim"), D = window.DataTypeAnimation;
      if (!holder || !D) return;
      let a = holder.querySelector(".dta");
      if (!a) {
        a = document.createElement("div");
        a.className = "dta";
        a.setAttribute("data-dta", holder.getAttribute("data-type"));
        holder.appendChild(a);
        D.mount(a);
      } else if (a.dtaPlayer && !a.dtaPlayer.userPaused) a.dtaPlayer.play(0);   // a reader who paused it finds it as they left it
    }

    /* Show tab `i`. o.address puts its ID in the address bar, and o.focus moves the keyboard focus to the tab. */
    function show(i, o) {
      o = o || {};
      if (i < 0 || i >= tabs.length) return;
      const changed = i !== cur, family = above[i] || ids[i];   // the top-level tab this one is, or belongs under
      cur = i;
      tabs.forEach(function (t, k) {
        t.setAttribute("aria-selected", k === i ? "true" : "false");
        t.tabIndex = k === i ? 0 : -1;
        t.classList.toggle("is-open", above[k] === family);   // the tabs under that one are on offer
        t.classList.toggle("has-on", ids[k] === above[i]);    // the tab above the one on show
        panels[k].classList.toggle("is-on", k === i);
      });
      if (changed) animate(panels[i]);
      if (o.address && window.history && history.replaceState) history.replaceState(null, "", "#" + ids[i]);
      if (o.focus) tabs[i].focus();
    }
    /* Open the tab that the address names. The browser scrolls to that tab's heading, which sits at the
       top of the tabs. */
    function fromAddress() {
      let id = location.hash.slice(1);
      try { id = decodeURIComponent(id); } catch (e) { /* not a data type's ID, then */ }
      show(ids.indexOf(id));
    }

    tabs.forEach(function (t, i) { t.addEventListener("click", function () { show(i, { address: true }); }); });
    /* The arrow keys go through the tabs in the order written, so they walk into a family and out of it. */
    root.querySelector(".dtt-tabs").addEventListener("keydown", function (e) {
      const n = tabs.length, to = { ArrowRight: cur + 1, ArrowDown: cur + 1, ArrowLeft: cur - 1, ArrowUp: cur - 1, Home: 0, End: n - 1 }[e.key];
      if (to == null || e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      show((to + n) % n, { address: true, focus: true });
    });
    /* A link in a panel to another data type on this page opens that tab in place. */
    root.addEventListener("click", function (e) {
      const a = e.target.closest ? e.target.closest('a[href^="#"]') : null, i = a ? ids.indexOf(a.getAttribute("href").slice(1)) : -1;
      if (i < 0 || e.defaultPrevented || e.button || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      show(i, { address: true });
    });
    window.addEventListener("hashchange", fromAddress);
    fromAddress();
  }

  function start() { Array.prototype.forEach.call(document.querySelectorAll(".dtt"), setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
