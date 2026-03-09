import KeyshotsCommand from "../model/KeyshotsCommand";
import {Category} from "../constants/Category";
import CalloutPickerModal from "../components/callout-picker-modal";
import KeyshotsPlugin from "../plugin";
import {HotKey} from "../utils";
import SelectionsProcessing from "../classes/SelectionsProcessing";
import {Notice} from "obsidian";

export const betterInsertCallout: (plugin: KeyshotsPlugin) => KeyshotsCommand = (plugin) => ({
    category: Category.INSERT_COMPONENTS,
    id: 'better-insert-callout',
    name: "Better insert callout",
    hotkeys: {
        keyshots: [HotKey("C", "Shift", "Alt")],
    },
    editorCallback: (editor) => new CalloutPickerModal(
        plugin,
        (calloutId,evt) => {
            // default state
            let foldingState = "";

            if (evt instanceof KeyboardEvent) {
                if (evt.shiftKey) {
                    foldingState = "+"
                }
                else if (evt.ctrlKey) {
                    foldingState = "-"
                }
            } 

            SelectionsProcessing.selectionsProcessorTransaction(editor, sel => {
                const selectedText = sel.getText();

                const currentLineContent = editor.getLine(sel.anchor.line);
                const nextLineNum = sel?.anchor?.line + 1;
                const nextLineContent = editor.getLine(nextLineNum);

                let convertedSel = "";
                let ending = "";

                // if next line is already a callout, do not insert a new line
                if (currentLineContent.trim() == '' && nextLineContent.startsWith('> ')) {
                    ending = "";
                    new Notice(`Combine existing quote with new ${calloutId} callout.`);
                } else {
                    ending = "\n";
                    convertedSel = "\n" + selectedText.split("\n").map(p => "> " + p).join("\n");
                }

                return {
                    replaceSelection: sel,
                    replaceText: `\n>[!${calloutId}]${foldingState}${convertedSel}${ending}`,
                    finalSelection: sel.clone().expand().moveLines(2).moveCharsWithoutOffset(2)
                }
            })
            editor.focus();
        }
    ).open()
})