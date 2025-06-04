/**
 * These configurations are for the basic site and should be replaced entirely in your application.
 * @cubap
 */

const config = {
    langKey: {
        appName: "Tiny Things v.1.2",
        appDesc: "Simple web forms to ping RERUM operations.",

        loadExample: "load example",

        createBtn: "create",
        createTitle: "create resource",
        createDesc: "Provide a valid JSON object to create an object in RERUM attributed to your RERUM registered application.",
        createHelpText: "JSON to save",

        updateBtn: "update",
        updateTitle: "update resource",
        updateDesc: "Provide the URI of an object to update. Then, provide a new representation of the JSON object to update with. By default, this is a RESTful PUT update. The resulting object is attributed to your RERUM registered agent.",
        updateHelpText1: "URI to update",
        updateHelpText2: "New JSON representation",

        overwriteBtn: "overwrite",
        overwriteTitle: "overwrite resource",
        overwriteDesc: "Provide the URI of an object to overwrite. Then, provide a new representation of the JSON object to overwrite with. This will perform a RESTful PUT update but will not make a new node in history. Instead, the originating node at the provided URI will be overwritten, with no way to see how it originally existed. Only those objects attributed to this application's RERUM registration agent can be overwritten.",
        overwriteHelpText1: "URI to overwrite",
        overwriteHelpText2: "New JSON representation",

        deleteBtn: "delete",
        deleteTitle: "delete resource",
        deleteDesc: "Provide a URI to a RERUM object attributed to your RERUM registered application to delete it. Only those objects attributed to this application's RERUM registration agent can be deleted.",
        deleteHelpText: "URI to Delete",

        queryBtn: "query",
        queryTitle: "find by property",
        queryDesc: "Enter a key and value to search RERUM for objects containing that key-value pair. *Note RERUM supports more complex queries than this simple form (multi-key, embedded-key, wildcards, etc.)",
        queryHelpText1: "Key",
        queryHelpText2: "Value",

        importBtn: "import",
        importTitle: "import resource",
        importDesc: "Provide the URI of an object external to RERUM to be imported into RERUM and attribute to your RERUM registered application. This results in a new object in RERUM that references the original provided URI so as not to alter the original object.",
        importHelpText: "URI to Import",

    },
        RERUM_REGISTRATION_URL: 'https://store.rerum.io/v1/' // imported from .env file
}

// initialize page
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-lang-key]').forEach(el => el.textContent = config.langKey[el.dataset.langKey])
})

export { config as default }
