import { forwardRef, useImperativeHandle, useRef } from "react";
import { Bold, Italic, Underline, List, Quote, Minus, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RichEditorHandle {
  getHtml: () => string;
  setHtml: (html: string) => void;
  insertText: (text: string) => void;
  focus: () => void;
}

interface Props {
  initialHtml?: string;
  placeholder?: string;
  onInput?: () => void;
  onImage?: (file: File) => Promise<string | null>;
}

export const RichEditor = forwardRef<RichEditorHandle, Props>(function RichEditor(
  { initialHtml = "", placeholder = "Hôm nay mình muốn kể với chính mình rằng…", onInput, onImage },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useImperativeHandle(ref, () => ({
    getHtml: () => editorRef.current?.innerHTML ?? "",
    setHtml: (html: string) => {
      if (editorRef.current) editorRef.current.innerHTML = html;
    },
    insertText: (text: string) => {
      editorRef.current?.focus();
      document.execCommand("insertText", false, text);
      onInput?.();
    },
    focus: () => editorRef.current?.focus(),
  }));

  // Set initial content once
  if (!initialized.current && editorRef.current && initialHtml) {
    editorRef.current.innerHTML = initialHtml;
    initialized.current = true;
  }

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onInput?.();
  };

  const insertHtml = (html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    onInput?.();
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    let url: string | null = null;
    if (onImage) url = await onImage(file);
    if (!url) {
      // fallback: data URL (works locally but not ideal for storage)
      url = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(file);
      });
    }
    insertHtml(`<img src="${url}" alt="" style="max-width:100%;border-radius:16px;margin:12px 0" />`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 mb-3 rounded-2xl bg-white/50 border border-white/70">
        <ToolBtn onClick={() => exec("bold")} icon={<Bold className="w-4 h-4" />} title="In đậm" />
        <ToolBtn onClick={() => exec("italic")} icon={<Italic className="w-4 h-4" />} title="In nghiêng" />
        <ToolBtn onClick={() => exec("underline")} icon={<Underline className="w-4 h-4" />} title="Gạch chân" />
        <span className="w-px h-5 bg-border mx-1" />
        <ToolBtn onClick={() => exec("insertUnorderedList")} icon={<List className="w-4 h-4" />} title="Danh sách" />
        <ToolBtn onClick={() => exec("formatBlock", "blockquote")} icon={<Quote className="w-4 h-4" />} title="Trích dẫn" />
        <ToolBtn onClick={() => insertHtml("<hr style='border:none;border-top:1px solid var(--border);margin:16px 0' />")} icon={<Minus className="w-4 h-4" />} title="Đường kẻ" />
        <ToolBtn onClick={() => fileRef.current?.click()} icon={<ImageIcon className="w-4 h-4" />} title="Chèn ảnh" />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onInput?.()}
        data-placeholder={placeholder}
        className={cn(
          "rich-editor min-h-[280px] outline-none text-foreground/90 leading-relaxed",
          "prose prose-sm max-w-none",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-mint-deep/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/70 [&_blockquote]:my-3",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2",
          "[&_img]:rounded-2xl",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60",
          "caret-mint-deep",
        )}
      />
    </div>
  );
});

function ToolBtn({ onClick, icon, title }: { onClick: () => void; icon: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-foreground/70 hover:bg-mint/30 hover:text-mint-deep transition-colors"
    >
      {icon}
    </button>
  );
}
