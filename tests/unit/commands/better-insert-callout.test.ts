import {CalloutEdit, createCalloutEdit} from "@/commands/better-insert-callout-edit";

const createEditor = (content: string) => ({
    getLine: (line: number) => content.split("\n")[line]
})

const positionToOffset = (content: string, line: number, ch: number) => {
    const lines = content.split("\n")
    return lines.slice(0, line).reduce((offset, value) => offset + value.length + 1, 0) + ch
}

const applyEdit = (content: string, edit: CalloutEdit) => {
    const from = positionToOffset(content, edit.from.line, edit.from.ch)
    const to = positionToOffset(content, edit.to.line, edit.to.ch)
    return content.substring(0, from) + edit.text + content.substring(to)
}

describe("Better insert callout text edit", () => {
    it("creates a standalone callout when there is no quote below", () => {
        const content = "ABC\nnext"
        const edit = createCalloutEdit(
            createEditor(content),
            {anchor: {line: 0, ch: 1}, head: {line: 0, ch: 2}},
            {calloutId: "note", foldingState: "", prependLineBreak: true}
        )

        expect(edit.from).toEqual({line: 0, ch: 0})
        expect(edit.to).toEqual({line: 0, ch: 3})
        expect(applyEdit(content, edit)).toBe("\n>[!note]\n> ABC\n\nnext")
    })

    it("places a callout above and absorbs the existing quote block", () => {
        const content = "\n> first quote\n> second quote\nafter"
        const edit = createCalloutEdit(
            createEditor(content),
            {anchor: {line: 0, ch: 0}, head: {line: 0, ch: 0}},
            {calloutId: "info", foldingState: "+", prependLineBreak: false}
        )

        expect(applyEdit(content, edit)).toBe(">[!info]+\n> first quote\n> second quote\nafter")
        expect(edit.cursor).toEqual({line: 1, ch: 2})
    })

    it("wraps the complete selected line and absorbs the quote below it", () => {
        const content = "ABC\n> existing quote"
        const edit = createCalloutEdit(
            createEditor(content),
            {anchor: {line: 0, ch: 1}, head: {line: 0, ch: 2}},
            {calloutId: "warning", foldingState: "-", prependLineBreak: false}
        )

        expect(applyEdit(content, edit)).toBe(">[!warning]-\n> ABC\n> existing quote")
    })

    it("omits the preceding line break when the option is disabled", () => {
        const content = "ABC"
        const edit = createCalloutEdit(
            createEditor(content),
            {anchor: {line: 0, ch: 1}, head: {line: 0, ch: 2}},
            {calloutId: "tip", foldingState: "", prependLineBreak: false}
        )

        expect(applyEdit(content, edit)).toBe(">[!tip]\n> ABC\n")
        expect(edit.cursor).toEqual({line: 1, ch: 2})
    })
})
