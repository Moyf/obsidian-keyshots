export interface CalloutPosition {
    line: number;
    ch: number;
}

export interface CalloutSelection {
    anchor: CalloutPosition;
    head: CalloutPosition;
}

export interface CalloutEditor {
    getLine(line: number): string | undefined;
}

export interface CalloutEditOptions {
    calloutId: string;
    foldingState: "" | "+" | "-";
    prependLineBreak: boolean;
}

export interface CalloutEdit {
    from: CalloutPosition;
    to: CalloutPosition;
    text: string;
    cursor: CalloutPosition;
}

const isBefore = (left: CalloutPosition, right: CalloutPosition) =>
    left.line < right.line || (left.line === right.line && left.ch <= right.ch)

const isQuoteLine = (line: string | undefined) => line !== undefined && /^>\s?/.test(line)

const quoteLine = (line: string) => isQuoteLine(line) ? line : `> ${line}`

export const createCalloutEdit = (
    editor: CalloutEditor,
    selection: CalloutSelection,
    options: CalloutEditOptions
): CalloutEdit => {
    const [start, end] = isBefore(selection.anchor, selection.head)
        ? [selection.anchor, selection.head]
        : [selection.head, selection.anchor]
    const from = {line: start.line, ch: 0}
    const to = {line: end.line, ch: editor.getLine(end.line)?.length ?? 0}
    const selectedLines = Array.from(
        {length: end.line - start.line + 1},
        (_, index) => editor.getLine(start.line + index) ?? ""
    )
    const hasQuoteBelow = isQuoteLine(editor.getLine(end.line + 1))
    const omitBlankBody = hasQuoteBelow && selectedLines.every(line => line.trim().length === 0)
    const body = omitBlankBody ? "" : `\n${selectedLines.map(quoteLine).join("\n")}`
    const leadingLineBreak = options.prependLineBreak ? "\n" : ""
    const trailingLineBreak = hasQuoteBelow ? "" : "\n"

    return {
        from,
        to,
        text: `${leadingLineBreak}>[!${options.calloutId}]${options.foldingState}${body}${trailingLineBreak}`,
        cursor: {
            line: start.line + (options.prependLineBreak ? 2 : 1),
            ch: 2
        }
    }
}
