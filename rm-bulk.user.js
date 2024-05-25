// ==UserScript==
// @name         Railmiles Bulk Updater (Unofficial)
// @namespace    https://tomr.me
// @version      1.0.5
// @description  Add the ability to bulk update journeys logged with Railmiles.me
// @author       TomR.me
// @match        https://my.railmiles.me/*
// @icon         http://www.railmiles.me/assets/img/rm-logo-sm.png
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==

(function() {
  "use strict";
  console.log("script loaded!");

  const thisPath = window.location.pathname;
  // are we on an individual journey page?
  // true = yes, false = another page
  const journeyPage = thisPath.includes("journeys/rail/edit") ? true : false;

  // if we are on a journey page, we need to edit the form and then submit
  if (journeyPage) {
    console.log("journey page!");

    // for some reason, query params didn't work, so we'll use this
    const hash = window.location.hash.replace("#", "");

    if (!hash) return console.log(`${window.location.pathname}: no hash, done here!`);

    const formElementName = hash.split("=")[0];
    const value = hash.split("=")[1];

    console.log(
      `${window.location.pathname}: going to set name=${formElementName} to ${value}`
    );

    // make sure the element exists first
    const formElement = document.querySelector(`[name="${formElementName}"]`);
    if (!formElement) return console.error(`${window.location.pathname}: name=${formElementName} doesn't exist`);

    // check whether we are being invoked from the railmiles site
    if (window.parent.location.hostname.toLowerCase() !== "my.railmiles.me") return alert("RailMiles Bulk Updater:\nYOU SHOULD NEVER SEE THIS. Something has gone wrong, or someone has attempted to execute a CSRF attack.");

    // check if we are in a frame or not
    if (window == window.parent) return alert("RailMiles Bulk Updater:\nCannot be ran outside of a frame!");

    // visuals (scroll into view and make blue)
    formElement.parentElement.style.color = "blue";
    formElement.style.color = "blue";
    formElement.style["font-weight"] = "bold";
    formElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center", });

    // actually set the value
    formElement.value = value;

    // submit the form after a short delay!
    const delaySecs = 0;
    window.setTimeout(function() {
      document.querySelector("form[method=post]").submit();
    }, delaySecs * 1000);

    return; // we are done here (todo: close iframe after a delay?)
  }

  // if we have gotten this far, we are not on the page for an individual journey
  // we should check if we're on the journey list page
  if (!thisPath.includes("journeys/list")) {
    return console.log("not on journey list or journey page! nothing to do!");
  }

  console.log("journey list page!");

  // v v hacky
  window.setTimeout(function() { updateCounters() }, 1000);

  const journeyElements = document.querySelectorAll(
    ".journey.clearfix:not(.deleted)"
  );

  // mark journeys by clicking on them
  for (const e of journeyElements) {
    const jID = e.children[0].getAttribute("journey-id");

    // for some reason here, e.onclick didn't work
    e.setAttribute("onclick", "this.classList.toggle('bulk-selected'); updateCounters();");
    if(e.children[2]) e.children[2].innerHTML += `<a href="javascript:showJourneyIframe(${jID});" onclick="this.remove();" style="color: #000; filter: invert(0.5);">edit inline</a>`;
  }

  // show the buttons to mess with journeys
  // this is the final line of text before the journeys change, just copied from dev tools (todo: find a better spot)
  const buttonHolder = document.querySelector(
    "#container > div:nth-child(1) > div:nth-child(1) > p:nth-child(6)"
  );

  buttonHolder.innerHTML += `<br><br><hr><br>
        <b style="font-size: 1.5em;">Bulk Options</b> or click journeys to mark or unmark them<br>

        <button class="aux-butt" onclick="markJourneys('all')">✅ Mark All</button>
        <button class="aux-butt" onclick="markJourneys('none')">❌ Mark None</button>
        <button class="aux-butt" onclick="markJourneys('invert')">🔄 Invert Marked</button>

        <!-- hacky space between buttons -->
        <span style="display:inline-block;width:2em;"></span>
        <button class="aux-butt" onclick="closeFrames()">🖼️ Close Frames</button>

        <br>
        Mark by Text Match (typing here will clear your currently marked journeys!)
        <input type="text" onload="this.value="" onkeyup="markByText(this.value)" placeholder="Home Station"></input>

        <br>

        <b id="marked-num" style="font-size: 1.5em;">0</b> of <span id="total-num">0</span> marked

        <br><br>

        <b style="font-size: 1.5em;">Actions</b> <span style="color: darkred;">There is no undo!</span> Please be sure you have the right journeys selected!</span><br>

        <br>

        Update Travel Reason:<br>
        <button class="bulk-butt" data-form="reason" data-value="0">🏖️ Leisure</button>
        <button class="bulk-butt" data-form="reason" data-value="1">💼 Business</button>
        <button class="bulk-butt" data-form="reason" data-value="2">👷 Crew</button>
        <button class="bulk-butt" data-form="reason" data-value="4">🕘 Commute</button>
        <button class="bulk-butt" data-form="reason" data-value="3">❓ Other</button>

        <br><br>

        Update Visibility:<br>
        <button class="bulk-butt" data-form="hidden" data-value="0">🌍 Visible to All</button>
        <button class="bulk-butt" data-form="hidden" data-value="1">😊 Visible to Friends</button>
        <button class="bulk-butt" data-form="hidden" data-value="10">🥷 Hidden</button>
    `;

  // make the buttons work!
  for (const e of document.querySelectorAll(".bulk-butt")) {
    // again, e.onclick failed me here so this is a janky fix
    e.setAttribute("onclick", "bulkUpdateJourneys(this)");
  }

  // for every date, add buttons and make its group have an ID
  let dateNum = 0;
  for (const e of document.querySelectorAll("h3")) {
    e.nextElementSibling.id = `date-${dateNum}`;

    e.innerHTML += `
            <span>
                <button class="aux-butt" onclick="markJourneys('all', 'date-${dateNum}')">✅ Mark All</button>
                <button class="aux-butt" onclick="markJourneys('none', 'date-${dateNum}')">❌ Mark None</button>
                <button class="aux-butt" onclick="markJourneys('invert', 'date-${dateNum}')">🔄 Invert Marked</button>
            </span>
        `;

    dateNum++;
  }
})();

// not sure why we need unsafeWindow since a second ago it was working with just window...
// journeyQueue is so we can space out the requests and not load a lot of iframes at once
unsafeWindow.journeyQueue = 0;
// buffer time is the ms to wait between updating each journey
unsafeWindow.bufferTime = 1000;

unsafeWindow.bulkUpdateJourneys = function(pushedButton) {
  if (!pushedButton) return;

  const formName = pushedButton.getAttribute("data-form");
  const formValue = pushedButton.getAttribute("data-value");

  // get all of the marked journeys
  const marked = document.querySelectorAll(".bulk-selected");

  for (const j of marked) {
    // increase the queue length for buffering
    unsafeWindow.journeyQueue++;
    console.log("+", unsafeWindow.journeyQueue);

    // get the journey ID
    const jID = j.children[0].getAttribute("journey-id");

    // update the journey after a set time
    window.setTimeout(function() {
      showJourneyIframe(jID, formName, formValue);
    }, unsafeWindow.bufferTime * unsafeWindow.journeyQueue);
  }
};

unsafeWindow.showJourneyIframe = function(journeyID, formElement, value) {
  if (!journeyID) return;

  let urlHash = ``;

  if (formElement) urlHash = `#${formElement}=${value}`;

  // if there's a previous frame for this journey, remove it before we make another
  const residualFrame = document.querySelector(`#iframe-${journeyID}`);
  if (typeof residualFrame != "undefined" && residualFrame != null) residualFrame.remove();

  document.querySelector(
    `[journey-id="${journeyID}"]`
  ).parentElement.innerHTML += `
        <iframe frameBorder="0" id="iframe-${journeyID}" src="https://my.railmiles.me/journeys/edit/${journeyID}${urlHash}" style="width: 100%; height: 300px;"></iframe>
    `;

  unsafeWindow.setTimeout(function() {
    unsafeWindow.journeyQueue--;
    console.log("-", unsafeWindow.journeyQueue);
  }, 2000);
};

unsafeWindow.markJourneys = function(action, dateNumber) {
  const allJourneys = document.querySelectorAll(
    `${dateNumber ? `#${dateNumber}` : ""} .journey.clearfix:not(.deleted)`
  );

  switch (action) {
    case "all":
      // mark all
      allJourneys.forEach((e) => e.classList.add("bulk-selected"));
      break;
    case "none":
      // mark none
      allJourneys.forEach((e) => e.classList.remove("bulk-selected"));
      break;
    case "invert":
      // invert selection
      allJourneys.forEach((e) => e.classList.toggle("bulk-selected"));
      break;
    default:
      console.log("how did you get here?");
  }

  updateCounters();
};

unsafeWindow.markByText = function(text) {
  // first, unmark everything
  markJourneys("none");

  if (text == "") return;

  const allJourneys = document.querySelectorAll(
    `.journey.clearfix:not(.deleted)`
  );
  console.log("searching");

  for (const j of allJourneys) {
    const jText = j.innerText;

    if (jText.toLowerCase().includes(text.toLowerCase())) {
      j.classList.add("bulk-selected");
    }
  }

  updateCounters();
};

unsafeWindow.updateCounters = function() {
  document.getElementById("marked-num").innerText = document.querySelectorAll(
    `.journey.clearfix.bulk-selected:not(.deleted)`
  ).length;
  document.getElementById("total-num").innerText = document.querySelectorAll(
    `.journey.clearfix:not(.deleted)`
  ).length;
};

unsafeWindow.closeFrames = function() {
  document.querySelectorAll("iframe").forEach((e) => e.remove());
};

// this is horrible to work in but oh well
GM_addStyle(`
    .journey.clearfix.bulk-selected { background-color: lightblue }
    .aux-butt { background-color: #eee; color: #008CBA; padding: 0.5em 2em; }

    /* fix the ship icon! */
    .glyphicons-boat {
        background-image: url("https://my.railmiles.me/static/svg/boat.svg");
     }
`);
