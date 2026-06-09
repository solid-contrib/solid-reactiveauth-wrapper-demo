import * as A from "@solid/reactive-authentication"
import * as M from "@solid/object"
import * as W from "@rdfjs/wrapper"
import * as N from "n3"

//#region Elements

const editorForm = document.querySelector("form")
const titleInput = document.querySelector("input.title")
const nameInput = document.querySelector("input.name")
const loadButton = document.querySelector("button.load")
const removeButton = document.querySelector("button.remove")
const authorizationCodeFlow = document.querySelector("authorization-code-flow")
const idpPicker = document.querySelector("idp-picker")

//#endregion

let myWebId
await authenticate()

//#region Event handlers

editorForm.addEventListener("submit", onSave)
loadButton.addEventListener("click", onLoad)
removeButton.addEventListener("click", onRemove)

async function onLoad() {
    populate(normalize(parse(await load(await identify()), await identify())))
}

async function onSave(e) {
    e.preventDefault()

    await save(await identify(), await serialize(extract()))
}

async function onRemove() {
    await remove(await identify())

    editorForm.reset()
}

//#endregion

//#region Functional operations

async function identify() {
    return new URL("bookData", await storage()).toString()
}

function populate(data) {
    titleInput.value = data.book.title
    nameInput.value = data.book.author.name
}

function extract() {
    const data = normalize()

    data.book.title = titleInput.value
    data.book.author.name = nameInput.value

    return data
}

function normalize(data) {
    return data ?? parse(`
        BASE <http://example.com/>
        [
            <title> "" ;
            <author> [
                <name> ""
            ]
        ] .
`)
}

async function authenticate() {
    const callbackUri = new URL("/callback.html", location.href).toString()

    const dPoPTokenProvider = new A.DPoPTokenProvider(callbackUri, authorizationCodeFlow.getCode.bind(authorizationCodeFlow), idpPicker.getIssuer.bind(idpPicker))
    new A.ReactiveFetchManager([dPoPTokenProvider]).registerGlobally()
}

async function storage() {
    const profile = await webId()

    for (const storage of profile.pimStorage) return storage
}

async function webId() {
    if (myWebId === undefined) {
        const webIdUrl = prompt("What is your WebID?")
        const webIdResponse = await fetch(webIdUrl)
        const webIdText = await webIdResponse.text()
        const webIdDataset = parseRdf(webIdText, webIdUrl)
        const webId = new M.WebIdDataset(webIdDataset, N.DataFactory)

        myWebId = webId.mainSubject
    }

    return myWebId
}

//#endregion

//#region Data operations

async function load(id) {
    const response = await fetch(id)

    if (!response.ok) return undefined

    return await response.text()
}

async function save(id, data) {
    await fetch(id, {method: "PUT", body: data, headers: {"Content-Type": "text/turtle"}})
}

async function remove(id) {
    await fetch(id, {method: "DELETE"})
}

function parse(data, baseIRI) {
    return data === undefined ? undefined : new Data(parseRdf(data, baseIRI), N.DataFactory)
}

function serialize(data) {
    return new Promise((resolve, reject) => {
        const writer = new N.Writer

        writer.addQuads([...data])

        writer.end((error, result) => {
            if (error) reject(error)
            else resolve(result)
        })
    })
}

function parseRdf(rdf, baseIRI) {
    const store = new N.Store
    store.addQuads(new N.Parser({baseIRI}).parse(rdf));

    return store
}

//#endregion

//#region Mapping

const EX = {
    author: "http://example.com/author",
    name: "http://example.com/name",
    title: "http://example.com/title",
}

class Data extends W.DatasetWrapper {
    get book() {
        for (const result of this.subjectsOf(EX.title, Book)) return result
    }
}

class Book extends W.TermWrapper {
    get title() {
        return W.OptionalFrom.subjectPredicate(this, EX.title, W.LiteralAs.string)
    }

    set title(value) {
        W.OptionalAs.object(this, EX.title, value, W.LiteralFrom.string)
    }

    get author() {
        return W.OptionalFrom.subjectPredicate(this, EX.author, W.TermAs.instance(Person))
    }

    set author(value) {
        W.OptionalAs.object(this, EX.author, value, W.TermFrom.instance)
    }
}

class Person extends W.TermWrapper {
    get name() {
        return W.OptionalFrom.subjectPredicate(this, EX.name, W.LiteralAs.string)
    }

    set name(value) {
        W.OptionalAs.object(this, EX.name, value, W.LiteralFrom.string)
    }
}

//#endregion
