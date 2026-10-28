import type { Ref } from "preact";
import { Icon } from "../../../../plug-api/ui/icon.tsx";

/**
 * The create row: the typed phrase, with the same right-aligned "Create"
 * chip an aspiring row carries -- the chip is the sole signifier that this
 * row creates rather than opens, so the phrase itself is drawn plain, the
 * same as any other row's primary. Its icon is the view's `createIcon`,
 * resolved once for the view rather than per object: what it would be an
 * icon *of* is whatever is being typed, and asking per keystroke would be a
 * round trip per keystroke.
 *
 * A `createVariants` row carries its variant's `label` in the chip instead
 * (e.g. the template it creates from) and its own name for the phrase.
 */
export function CreateRow({
  phrase,
  label,
  icon,
  hasIcon,
  selected,
  pinned,
  elRef,
  onClick,
}: {
  phrase: string;
  label?: string;
  icon?: Element;
  hasIcon: boolean;
  selected: boolean;
  pinned?: boolean;
  elRef?: Ref<HTMLDivElement>;
  onClick: () => void;
}) {
  return (
    <div
      ref={elRef}
      className={
        "sb-nav-row sb-nav-create" +
        (pinned ? " sb-nav-create-pinned" : "") +
        (label !== undefined ? " sb-nav-create-variant" : "") +
        (selected ? " sb-nav-selected" : "")
      }
      title={label !== undefined ? `Create ${phrase} from ${label}` : undefined}
      onClick={onClick}
    >
      {(hasIcon || icon) &&
        (icon ? (
          <Icon node={icon} class="sb-nav-icon" />
        ) : (
          <span className="sb-nav-icon" />
        ))}
      <span className="sb-nav-primary">{phrase}</span>
      {/* The same right-aligned hint an aspiring row carries, so the two ways
          to make a page read alike. */}
      <span className="sb-nav-chip sb-nav-chip-hint">{label ?? "Create"}</span>
    </div>
  );
}
