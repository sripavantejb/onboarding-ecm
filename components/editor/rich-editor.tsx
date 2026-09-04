"use client";
import * as React from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link2, Table as TableIcon, Image as ImageIcon,
  Code, Undo, Redo, Pilcrow,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight WYSIWYG editor built on contentEditable. Emits HTML via onChange.
 * Trusted-author tool for an internal app; output is sanitized server-side on save.
 */
export function RichEditor({
  value,
  onChange,
  className,
  placeholder = "Start writing…",
}: {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [focused, setFocused] = React.useState(false);

  // Initialize once; contentEditable is uncontrolled afterwards.
  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  }

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function insertHTML(html: string) {
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    emit();
  }

  const isEmpty = !value || value === "<br>" || value === "<p></p>";

  const btn =
    "grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer";

  return (
    <div className={cn("rounded-lg border bg-background", focused && "ring-2 ring-ring", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1.5">
        <ToolbarButton className={btn} title="Paragraph" onClick={() => exec("formatBlock", "<p>")}><Pilcrow className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton className={btn} title="Heading 1" onClick={() => exec("formatBlock", "<h1>")}><Heading1 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton className={btn} title="Heading 2" onClick={() => exec("formatBlock", "<h2>")}><Heading2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton className={btn} title="Heading 3" onClick={() => exec("formatBlock", "<h3>")}><Heading3 className="h-4 w-4" /></ToolbarButton>
        <Divider />
        <ToolbarButton className={btn} title="Bold" onClick={() => exec("bold")}><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton className={btn} title="Italic" onClick={() => exec("italic")}><Italic className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton className={btn} title="Underline" onClick={() => exec("underline")}><Underline className="h-4 w-4" /></ToolbarButton>
        <Divider />
        <ToolbarButton className={btn} title="Bullet list" onClick={() => exec("insertUnorderedList")}><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton className={btn} title="Numbered list" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton className={btn} title="Quote" onClick={() => exec("formatBlock", "<blockquote>")}><Quote className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton className={btn} title="Code block" onClick={() => exec("formatBlock", "<pre>")}><Code className="h-4 w-4" /></ToolbarButton>
        <Divider />
        <ToolbarButton
          className={btn}
          title="Insert link"
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) exec("createLink", url);
          }}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          className={btn}
          title="Insert image"
          onClick={() => {
            const url = window.prompt("Image URL");
            if (url) insertHTML(`<img src="${url}" alt="" />`);
          }}
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          className={btn}
          title="Insert table"
          onClick={() =>
            insertHTML(
              "<table><thead><tr><th>Heading</th><th>Heading</th></tr></thead><tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table><p><br/></p>",
            )
          }
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton className={btn} title="Undo" onClick={() => exec("undo")}><Undo className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton className={btn} title="Redo" onClick={() => exec("redo")}><Redo className="h-4 w-4" /></ToolbarButton>
      </div>

      <div className="relative">
        {isEmpty && !focused && (
          <p className="pointer-events-none absolute left-4 top-3 text-[15px] text-muted-foreground">{placeholder}</p>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={() => {
            setFocused(false);
            emit();
          }}
          onFocus={() => setFocused(true)}
          className="prose-editco min-h-64 max-h-[60vh] overflow-y-auto scrollbar-thin px-4 py-3 text-[15px] focus:outline-none"
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  className,
  children,
}: {
  onClick: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={className}
      // Prevent losing selection/focus before the command runs.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}
