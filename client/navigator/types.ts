import type { Ref } from "@silverbulletmd/silverbullet/lib/ref";
import type {
  ActionMeta,
  Decoration,
  Row,
} from "../../plug-api/ui/tree_types.ts";

export type { ActionMeta, Decoration, Row };

export type FilterFields = Record<
  string,
  number | { weight: number; segments?: boolean }
>;

export type NavigatorHook =
  | "meta"
  | "rows"
  | "content"
  | "select"
  | "create"
  | "createVariants"
  | "key"
  | "action"
  | "rowState"
  | "dropdown"
  | "move";

export type SegmentMeta = {
  label: string;
  icon?: string;
  hasWhere: boolean;
  default?: boolean;
  prefix?: string;
  placeholder?: string;
  helpText?: string;
};

export type DropdownMeta = {
  placeholder?: string;
  allLabel?: string;
};

/** One selectable entry of a view's dropdown, as its `options` produced it. */
export type DropdownOption = {
  label: string;
  value: any;
};

/**
 * An extra create row a view offers next to the plain one, e.g. "create this
 * page from the Person template". Its row creates `prefix` + the phrase.
 */
export type CreateVariant = {
  label: string;
  /** Prepended to the phrase, unless the phrase already starts with it. */
  prefix?: string;
  icon?: string;
  /** Opaque to the panel; handed back to `onCreate` with the variant. */
  value?: unknown;
};

/** The name a variant's create row creates for `phrase`. */
export function createVariantName(
  variant: Pick<CreateVariant, "prefix">,
  phrase: string,
): string {
  const prefix = variant.prefix ?? "";
  return phrase.startsWith(prefix) ? phrase : prefix + phrase;
}

export type SourceCtx = {
  phrase: string;
  segment?: string;
  dock?: string;
  /** The selected dropdown option's value; undefined for the built-in first option. */
  dropdown?: unknown;
};

export const WINDOW_DOCKS = ["lhs", "rhs", "bhs"] as const;
export const PAGE_DOCKS = ["page-top", "page-bottom"] as const;
export const ALL_DOCKS = [...WINDOW_DOCKS, "modal", ...PAGE_DOCKS] as const;

export function isPageDock(dock: string): boolean {
  return (PAGE_DOCKS as readonly string[]).includes(dock);
}
export function isWindowDock(dock: string): boolean {
  return (WINDOW_DOCKS as readonly string[]).includes(dock);
}

export const TABLE_COLUMN_TYPES = [
  "ref",
  "number",
  "boolean",
  "url",
  "text",
  "markdown",
] as const;
export type TableColumnType = (typeof TABLE_COLUMN_TYPES)[number];

export type TableColumn = {
  attribute?: string;
  label: string;
  type?: TableColumnType;
};

export type ViewMeta = {
  name: string;
  title: string;
  definition?: Ref;
  label?: string;
  placeholder?: string;
  helpText?: string;
  stripPrefix?: string;
  mode: "list" | "tree" | "table";
  columns?: TableColumn[];
  hasContent?: boolean;
  hasSelect?: boolean;
  dock: (typeof ALL_DOCKS)[number];
  supportedDocks?: string[];
  hierarchy: { field: string; separator: string };
  foldersFirst: boolean;
  selectableFolders?: boolean;
  expandAll: boolean;
  expansionScope: "view" | "page";
  filterFields?: FilterFields;
  inlineFilter?: boolean;
  /** `filter = false`: no phrase filtering; the input is hidden but stays the
   * panel's focus home so the keyboard pipeline keeps working. */
  noFilter?: boolean;
  emptyText?: string;
  followEditor: boolean;
  refreshOn: string[];
  hasMove: boolean;
  uploadFiles?: boolean;
  hasCreate: boolean;
  /** The view offers extra create rows (`createVariants`) under the plain one. */
  hasCreateVariants?: boolean;
  refreshOnOpen: boolean;
  /** A modal open without a phrase starts from the phrase this view last
   * queried in this tab (in memory only), selected so typing replaces it. */
  rememberPhrase?: boolean;
  keys?: string[];
  actions?: ActionMeta[];
  segments?: SegmentMeta[];
  dropdown?: DropdownMeta;
  limit: number;
  search: "client" | "source";
  hasRowIcon: boolean;
  prefixViews?: Record<string, string>;
  createIcon?: string;
  pathCompletion: boolean;
  hashtagFilter: boolean;
  ephemeral?: boolean;
  openOnStart?: boolean;
  defaultOpen?: boolean;
  frame?: "full" | "minimal";
  builtin?: boolean;
};
