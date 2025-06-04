/**
 * Interactions for this page, which can all be dropped in your application.
 * @author cubap
 */

import { API } from './api.js'

/**
 * The UI for controlling which tab shows (which happens to be a form)
 * @param {HTMLElement} form
 */
function showForm(form,btn) {
    let forms = document.getElementsByTagName('form')
    for (let f of forms) {
        f.setAttribute("data-hidden", "true")
    }
    let shownForm = document.getElementById(form)
    shownForm.removeAttribute("data-hidden")
    document.getElementById("obj-viewer").style.display = "none"
    document.getElementById("flash-message").style.display = "none"
    const apiLegend = btn.nextElementSibling
    if(!apiLegend.classList.contains("open")){
        document.querySelectorAll(".api-legend").forEach(el=>el.classList.remove("open"))
    }
    apiLegend.classList.toggle("open")
}

/**
 * The UI for controlling which tab shows (which happens to be a form)
 * @param {string} msg The text to show
 * @param {string} type A class to provide to color the text 
 */
function setMessage(msg, type) {
    let msgDiv = document.getElementById("flash-message")
    msgDiv.innerHTML = msg
    msgDiv.className = (type) ? type : ""
    msgDiv.style.display = "block"
}

/**
 * The UI for showing resulting JSON objects
 * @param {object} object The object to put into HTML
 */
function setObject(object) {
    let showThis
    if (typeof object !== "object") {
        try {
            showThis = JSON.parse(object)
        } catch (error) {
            showThis = { error: error }
        }
    } else {
        showThis = object
    }
    let viewObject = document.getElementById("obj-viewer")
    viewObject.innerHTML = JSON.stringify(showThis, undefined, 4)
    viewObject.style.display = (Object.keys(showThis).length) ? "block" : "none"
}

document.addEventListener("rerum-result", e => {
    setMessage(e.detail.message)
    setObject(e.detail.object)
})
document.addEventListener("rerum-error", e => {
    console.error(e.detail.cause)
    setMessage(`${e.detail.message}\n${e.detail.cause.status ?? e.status}: ${e.detail.cause.statusText ?? e.detail.cause.message ?? e.message }`)
    setObject(e.detail.object)
})

const UI = { showForm, setMessage, setObject }
export { UI }
