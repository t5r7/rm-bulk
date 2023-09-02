// ==UserScript==
// @name         Railmiles Bulk Updater (Unofficial)
// @namespace    https://tomr.me
// @version      0.1
// @description  Add the ability to bulk update journeys logged with Railmiles.me
// @author       TomR.me
// @match        https://my.railmiles.me/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=railmiles.me
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    console.log("script loaded!");

    const thisPath = window.location.pathname;
    // are we on an individual journey page?
    // true = yes, false = another page
    const journeyPage = thisPath.includes("journeys/rail/edit") ? true : false;

    // if we are on a journey page, we need to edit the form and then submit
    if(journeyPage) {
        console.log("journey page!");

        // for some reason, query params didn't work, so we'll use this
        const hash = window.location.hash.replace("#","");

        if(!hash) return console.log(`${window.location.pathname}: no hash, done here!`);

        const formElementName = hash.split("=")[0];
        const value = hash.split("=")[1];

        console.log(`${window.location.pathname}: going to set name=${formElementName} to ${value}`);

        // make sure the element exists first
        const formElement = document.querySelector(`[name="${formElementName}"]`);
        if(!formElement) return console.error(`${window.location.pathname}: name=${formElementName} doesn't exist`);

        // visuals (scroll into view and make blue)
        formElement.parentElement.style.color = "blue";
        formElement.style.color = "blue";
        formElement.style["font-weight"] = "bold";
        formElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

        // actually set the value
        formElement.value = value;

        // submit the form after a short delay!
        const delaySecs = 0;
        window.setTimeout(function() {
            //document.querySelector("form[method=post]").submit();
        }, delaySecs*1000);

        return; // we are done here (todo: close iframe after a delay?)
    }

    // if we have gotten this far, we are not on the page for an individual journey
    // we should check if we're on the journey list page
    if(!thisPath.includes("journeys/list")) return console.log("not on journey list or journey page! nothing to do!");

    console.log("journey list page!");

    const journeyElements = document.querySelectorAll(".journey.clearfix:not(.deleted)");

    for(const e of journeyElements) {
        const jID = e.children[0].getAttribute("journey-id");

        // for some reason here, e.onclick didn't work
        e.setAttribute("onclick", "this.classList.toggle('bulk-selected')");
    }

    // show the buttons to mess with journeys
    // this is the final line of text before the journeys change, just copied from dev tools (todo: find a better spot)
    const buttonHolder = document.querySelector("#container > div:nth-child(1) > div:nth-child(1) > p:nth-child(6)");

    buttonHolder.innerHTML += `<br><br><hr><br>
        <b>Bulk Options</b> (click a journey to mark it)<br><br>

        Update Travel Reason:<br>
        <button class="bulk-butt" data-form="reason" data-value="0">🏖️ Leisure</button>
        <button class="bulk-butt" data-form="reason" data-value="1">💼 Business</button>
        <button class="bulk-butt" data-form="reason" data-value="2">👷 Crew</button>
        <button class="bulk-butt" data-form="reason" data-value="4">🕘 Commute</button>
        <button class="bulk-butt" data-form="reason" data-value="3">❓ Other</button>
    `;
})();


window.showIframe = function(journeyID,formElement,value) {
    if(!journeyID) return;

    let urlHash = ``;
    if(formElement) urlHash = `#${formElement}=${value}`;

    document.querySelector(`[journey-id="${journeyID}"]`).parentElement.innerHTML += `
        <iframe src="https://my.railmiles.me/journeys/edit/${journeyID}${urlHash}" style="width: 100%; height: 300px;"></iframe>
    `;
}

// this is horrible to work in but oh well
GM_addStyle(`
    .journey.clearfix.bulk-selected { background-color: lightblue };
`);
