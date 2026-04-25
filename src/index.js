//#region Elements

const editorForm = document.querySelector("form")
const titleInput = document.querySelector("input.title")
const nameInput = document.querySelector("input.name")
const loadButton = document.querySelector("button.load")
const removeButton = document.querySelector("button.remove")

//#endregion

//#region Event handlers

editorForm.addEventListener("submit", onSave)
loadButton.addEventListener("click", onLoad)
removeButton.addEventListener("click", onRemove)

async function onLoad() {
    populate(normalize(parse(await load(await identify()))))
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
    return "bookData"
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
    return data ?? parse(
        {
            book: {
                title: "",
                author: {
                    name: ""
                }
            }
        }
    )
}

//#endregion

//#region Data operations

async function load(id) {
    return window[id]
}

async function save(id, data) {
    window[id] = data
}

async function remove(id) {
    delete window[id]
}

function parse(data) {
    return data
}

function serialize(data) {
    return data
}

//#endregion
