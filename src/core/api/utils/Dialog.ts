import type { Component } from "../text/Component";

/**
 * Formato dos dialogs da Java Edition (JE only).
 *
 * @see https://minecraft.wiki/w/Dialog
 */

export type ThisOrListOf<T> = T | T[];

/** Um componente de texto: string, objeto `Component` ou lista deles. */
export type TextComponent = ThisOrListOf<string | Component>;

export type DialogType =
    "minecraft:notice"
  | "minecraft:confirmation"
  | "minecraft:multi_action"
  | "minecraft:server_links"
  | "minecraft:dialog_list"
  ;

/** Ação executada depois de um clique/submit. Padrão: `close`. */
export type AfterAction =
    "close"
  | "none"
  | "wait_for_response"
  ;

// ---------------------------------------------------------------------------
// Body format
// ---------------------------------------------------------------------------

/** Corpo `minecraft:plain_message`: um label multilinha. */
export type PlainMessageBody = {
    type: "minecraft:plain_message";
    contents: TextComponent;
    /** Valor entre 1 e 1024. Padrão: 200. */
    width?: number;
};

export type ItemStack = {
    /** Identificador do item. */
    id: string;
    count?: number;
    /** Componentes de item. */
    components?: Record<string, unknown>;
};

export type ItemDescription = TextComponent | {
    contents: TextComponent;
    /** Valor entre 1 e 1024. Padrão: 200. */
    width?: number;
};

/** Corpo `minecraft:item`: um item com descrição opcional. */
export type ItemBody = {
    type: "minecraft:item";
    item: ItemStack;
    description?: ItemDescription;
    /** Padrão: true. */
    show_decoration?: boolean;
    /** Padrão: true. */
    show_tooltip?: boolean;
    /** Valor entre 1 e 256. Padrão: 16. */
    width?: number;
    /** Valor entre 1 e 256. Padrão: 16. */
    height?: number;
};

export type DialogBody = PlainMessageBody | ItemBody;

// ---------------------------------------------------------------------------
// Input control format
// ---------------------------------------------------------------------------

export type InputControlType =
    "minecraft:text"
  | "minecraft:boolean"
  | "minecraft:single_option"
  | "minecraft:number_range"
  ;

export type BaseInputControl = {
    type: InputControlType;
    /** Identificador do valor no submit (letras, dígitos e `_`). */
    key: string;
    label: TextComponent;
};

/** Input `minecraft:text`: campo de texto de linha única. */
export type TextInputControl = BaseInputControl & {
    type: "minecraft:text";
    /** Valor entre 1 e 1024. Padrão: 200. */
    width?: number;
    /** Padrão: true. */
    label_visible?: boolean;
    initial?: string;
    /** Padrão: 32. */
    max_length?: number;
    multiline?: {
        max_lines?: number;
        /** Valor entre 1 e 512. */
        height: number;
    };
};

/** Input `minecraft:boolean`: checkbox. */
export type BooleanInputControl = BaseInputControl & {
    type: "minecraft:boolean";
    /** Padrão: false. */
    initial?: boolean;
    /** Padrão: 'true'. */
    on_true?: string;
    /** Padrão: 'false'. */
    on_false?: string;
};

export type SingleOption = {
    /** Valor enviado no submit. */
    id: string;
    display?: TextComponent;
    /** Apenas uma opção pode ser `true`. */
    initial?: boolean;
};

/** Input `minecraft:single_option`: seleção de uma opção. */
export type SingleOptionInputControl = BaseInputControl & {
    type: "minecraft:single_option";
    /** Padrão: true. */
    label_visible?: boolean;
    /** Valor entre 1 e 1024. Padrão: 200. */
    width?: number;
    options: SingleOption[];
};

/** Input `minecraft:number_range`: slider numérico. */
export type NumberRangeInputControl = BaseInputControl & {
    type: "minecraft:number_range";
    label_format?: string;
    /** Valor entre 1 e 1024. Padrão: 200. */
    width?: number;
    start: number;
    end: number;
    step?: number;
    initial?: number;
};

export type DialogInput =
    | TextInputControl
  | BooleanInputControl
  | SingleOptionInputControl
  | NumberRangeInputControl
  ;

// ---------------------------------------------------------------------------
// Action format
// ---------------------------------------------------------------------------

export type OpenUrlAction = {
    type: "open_url";
    url: string;
};
export type RunCommandAction = {
    type: "run_command";
    command: string;
};
export type SuggestCommandAction = {
    type: "suggest_command";
    command: string;
};
export type ChangePageAction = {
    type: "change_page";
    page: number;
};
export type CopyToClipboardAction = {
    type: "copy_to_clipboard";
    value: string;
};
export type ShowDialogAction = {
    type: "show_dialog";
    dialog: string | Dialog;
};
export type CustomAction = {
    type: "custom";
    id: string;
    payload?: string;
};

export type DynamicRunCommandAction = {
    type: "dynamic/run_command";
    template: string;
};
export type DynamicCustomAction = {
    type: "dynamic/custom";
    /** Campos adicionados ao payload enviado ao servidor. */
    additions?: Record<string, unknown>;
};

export type DialogAction =
    | OpenUrlAction
  | RunCommandAction
  | SuggestCommandAction
  | ChangePageAction
  | CopyToClipboardAction
  | ShowDialogAction
  | CustomAction
  | DynamicRunCommandAction
  | DynamicCustomAction
  ;

/** Botão de ação (label + tooltip + ação opcional). */
export type DialogButton = {
    label: TextComponent;
    tooltip?: TextComponent;
    /** Valor entre 1 e 1024. Padrão: 150. */
    width?: number;
    action?: DialogAction;
};

// ---------------------------------------------------------------------------
// Dialog types
// ---------------------------------------------------------------------------

/** Campos comuns a todos os tipos de dialog. */
export interface BaseDialog {
    type: DialogType;
    title: TextComponent;
    /** Nome usado em botões que levam a este dialog. Se ausente, usa `title`. */
    external_title?: TextComponent;
    body?: ThisOrListOf<DialogBody>;
    inputs?: DialogInput[];
    /** Padrão: true. */
    can_close_with_escape?: boolean;
    /** Padrão: true. */
    pause?: boolean;
    after_action?: AfterAction;
}

/** Dialog com um único botão no rodapé. */
export interface NoticeDialog extends BaseDialog {
    type: "minecraft:notice";
    /** Padrão: botão com label `gui.ok` e sem ação. */
    action?: DialogButton;
}

/** Dialog com dois botões (sim/não) no rodapé. */
export interface ConfirmationDialog extends BaseDialog {
    type: "minecraft:confirmation";
    yes: DialogButton;
    no: DialogButton;
}

/** Dialog com uma lista rolável de botões. */
export interface MultiActionDialog extends BaseDialog {
    type: "minecraft:multi_action";
    /** Lista não vazia de botões. */
    actions: DialogButton[];
    /** Inteiro positivo. Padrão: 2. */
    columns?: number;
    exit_action?: DialogButton;
}

/** Dialog com a lista de links do servidor. */
export interface ServerLinksDialog extends BaseDialog {
    type: "minecraft:server_links";
    exit_action?: DialogButton;
    /** Inteiro positivo. Padrão: 2. */
    columns?: number;
    /** Valor entre 1 e 1024. Padrão: 150. */
    button_width?: number;
}

/** Dialog com uma lista rolável de botões que levam a outros dialogs. */
export interface DialogListDialog extends BaseDialog {
    type: "minecraft:dialog_list";
    /** IDs (`#tag` incluso) ou definições de dialogs. */
    dialogs: ThisOrListOf<string | Dialog>;
    exit_action?: DialogButton;
    /** Inteiro positivo. Padrão: 2. */
    columns?: number;
    /** Valor entre 1 e 1024. Padrão: 150. */
    button_width?: number;
}

export type Dialog =
    | NoticeDialog
  | ConfirmationDialog
  | MultiActionDialog
  | ServerLinksDialog
  | DialogListDialog
  ;
