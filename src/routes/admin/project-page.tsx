import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/about/ImageUploader";
import {
  projectPageStore,
  type ProjectSection,
  type ProjectItem,
  type ContactSubmission,
} from "@/lib/project-page-store";
import { ArrowLeft, Plus, Trash2, Save, Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/project-page")({
  component: () => (
    <RequireAdmin>
      <ProjectPageAdmin />
    </RequireAdmin>
  ),
});

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  why: "Vì sao dự án ra đời",
  founder: "Founder",
  messages: "5 lời nhắn",
  areas: "Các khu vực",
  map: "Bản đồ cảm xúc",
  contact: "Liên hệ hợp tác",
};

const ITEM_KIND_BY_SECTION: Record<string, string> = {
  messages: "message",
  areas: "area",
  map: "mood_label",
};

function ProjectPageAdmin() {
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const [pp, cs] = await Promise.all([
      projectPageStore.fetchAll(),
      projectPageStore.listContacts().catch(() => []),
    ]);
    setSections(pp.sections);
    setItems(pp.items);
    setContacts(cs);
  };

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageShell mascot={false}>
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải…
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell mascot={false}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/admin/dashboard" className="text-xs text-mint-deep hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Quay lại bảng điều khiển
          </Link>
          <h1 className="font-display text-2xl md:text-3xl mt-2">Trang Phác đồ chữa lành</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chỉnh sửa toàn bộ nội dung, ảnh và thứ tự các phần của trang dự án.
          </p>
        </div>
        <Link to="/about">
          <Button variant="outline" size="sm" className="rounded-full">Xem trang</Button>
        </Link>
      </header>

      <Tabs defaultValue="sections" className="space-y-6">
        <TabsList className="rounded-full bg-mint/15">
          <TabsTrigger value="sections" className="rounded-full">Sections</TabsTrigger>
          <TabsTrigger value="items" className="rounded-full">Lời nhắn & Card</TabsTrigger>
          <TabsTrigger value="contacts" className="rounded-full">
            Liên hệ {contacts.filter((c) => !c.is_read).length > 0 && `(${contacts.filter((c) => !c.is_read).length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <Accordion type="multiple" className="space-y-3">
            {sections.map((s) => (
              <SectionEditor
                key={s.id}
                section={s}
                onSaved={reload}
              />
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="items">
          <div className="space-y-6">
            {(["messages", "areas", "map"] as const).map((slug) => (
              <ItemListEditor
                key={slug}
                sectionSlug={slug}
                kind={ITEM_KIND_BY_SECTION[slug]}
                title={SECTION_LABELS[slug]}
                items={items.filter((i) => i.section_slug === slug)}
                onChanged={reload}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsList contacts={contacts} onChanged={reload} />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

// ---------- Section Editor ----------

function SectionEditor({ section, onSaved }: { section: ProjectSection; onSaved: () => void }) {
  const [draft, setDraft] = useState<ProjectSection>(section);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(section), [section]);

  const setExtra = (k: string, v: string) => {
    setDraft({ ...draft, extra: { ...(draft.extra || {}), [k]: v } });
  };

  const save = async () => {
    setSaving(true);
    try {
      await projectPageStore.updateSection(draft.id, {
        title: draft.title,
        subtitle: draft.subtitle,
        description: draft.description,
        image_main: draft.image_main,
        image_secondary: draft.image_secondary,
        image_gallery: draft.image_gallery,
        button_text: draft.button_text,
        button_link: draft.button_link,
        extra: draft.extra,
        is_visible: draft.is_visible,
        sort_order: draft.sort_order,
      });
      toast.success("Đã lưu");
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Không lưu được");
    } finally {
      setSaving(false);
    }
  };

  const updateGallery = (i: number, url: string | null) => {
    const next = [...draft.image_gallery];
    if (url == null) next.splice(i, 1);
    else next[i] = url;
    setDraft({ ...draft, image_gallery: next });
  };

  const addGallerySlot = () => setDraft({ ...draft, image_gallery: [...draft.image_gallery, ""] });

  return (
    <AccordionItem value={section.id} className="border border-white/70 rounded-2xl bg-white/70 px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <span className="text-[10px] uppercase tracking-widest text-mint-deep/80">{section.slug}</span>
          <span className="font-display text-base">{SECTION_LABELS[section.slug] || section.slug}</span>
          {!section.is_visible && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Ẩn</span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Tiêu đề">
            <Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Subtitle">
            <Input value={draft.subtitle || ""} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
          </Field>
        </div>

        <Field label="Mô tả">
          <Textarea
            rows={4}
            value={draft.description || ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Text nút">
            <Input value={draft.button_text || ""} onChange={(e) => setDraft({ ...draft, button_text: e.target.value })} />
          </Field>
          <Field label="Link nút">
            <Input value={draft.button_link || ""} onChange={(e) => setDraft({ ...draft, button_link: e.target.value })} />
          </Field>
        </div>

        {section.slug === "founder" && (
          <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-mint/10 border border-mint/30">
            <Field label="Tên founder">
              <Input
                value={(draft.extra?.founder_name as string) || ""}
                onChange={(e) => setExtra("founder_name", e.target.value)}
              />
            </Field>
            <Field label="Vai trò">
              <Input
                value={(draft.extra?.founder_role as string) || ""}
                onChange={(e) => setExtra("founder_role", e.target.value)}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Câu trích dẫn">
                <Textarea
                  rows={2}
                  value={(draft.extra?.founder_quote as string) || ""}
                  onChange={(e) => setExtra("founder_quote", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Nút phụ - text">
              <Input
                value={(draft.extra?.secondary_button_text as string) || ""}
                onChange={(e) => setExtra("secondary_button_text", e.target.value)}
              />
            </Field>
            <Field label="Nút phụ - link">
              <Input
                value={(draft.extra?.secondary_button_link as string) || ""}
                onChange={(e) => setExtra("secondary_button_link", e.target.value)}
              />
            </Field>
          </div>
        )}

        {section.slug === "contact" && (
          <Field label="Email nhận form (chỉ ghi chú)">
            <Input
              value={(draft.extra?.contact_email as string) || ""}
              onChange={(e) => setExtra("contact_email", e.target.value)}
            />
          </Field>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Ảnh chính">
            <ImageUploader
              value={draft.image_main}
              onChange={(url) => setDraft({ ...draft, image_main: url })}
              folder={section.slug}
              aspect="video"
            />
          </Field>
          <Field label="Ảnh phụ">
            <ImageUploader
              value={draft.image_secondary}
              onChange={(url) => setDraft({ ...draft, image_secondary: url })}
              folder={section.slug}
              aspect="square"
            />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Gallery</Label>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={addGallerySlot}>
              <Plus className="w-3 h-3 mr-1" /> Thêm khung ảnh
            </Button>
          </div>
          {draft.image_gallery.length === 0 && (
            <p className="text-xs text-muted-foreground">Chưa có ảnh gallery.</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {draft.image_gallery.map((url, i) => (
              <ImageUploader
                key={i}
                value={url || null}
                onChange={(u) => updateGallery(i, u)}
                folder={`${section.slug}/gallery`}
                aspect="square"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Switch
              checked={draft.is_visible}
              onCheckedChange={(v) => setDraft({ ...draft, is_visible: v })}
            />
            <Label className="text-sm">Hiển thị</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Thứ tự</Label>
            <Input
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
              className="w-20"
            />
          </div>
          <Button onClick={save} disabled={saving} className="ml-auto rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Lưu
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ---------- Items list editor ----------

function ItemListEditor({
  sectionSlug,
  kind,
  title,
  items,
  onChanged,
}: {
  sectionSlug: string;
  kind: string;
  title: string;
  items: ProjectItem[];
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);

  const add = async () => {
    setAdding(true);
    try {
      await projectPageStore.createItem({
        section_slug: sectionSlug,
        kind,
        title: kind === "mood_label" ? "Cảm xúc mới" : "Tiêu đề mới",
        sort_order: (items.at(-1)?.sort_order ?? 0) + 10,
        color: kind === "mood_label" ? "#A8DADC" : null,
      });
      onChanged();
    } catch (e) {
      console.error(e);
      toast.error("Không thêm được");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/70 bg-white/70 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg">{title}</h3>
        <Button onClick={add} disabled={adding} size="sm" className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
          <Plus className="w-3 h-3 mr-1" /> Thêm mục
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((it) => (
          <ItemEditor key={it.id} item={it} kind={kind} onChanged={onChanged} />
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Chưa có mục nào.</p>}
      </div>
    </div>
  );
}

function ItemEditor({ item, kind, onChanged }: { item: ProjectItem; kind: string; onChanged: () => void }) {
  const [draft, setDraft] = useState<ProjectItem>(item);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(item), [item]);

  const save = async () => {
    setSaving(true);
    try {
      await projectPageStore.updateItem(draft.id, {
        title: draft.title,
        subtitle: draft.subtitle,
        description: draft.description,
        image_url: draft.image_url,
        icon: draft.icon,
        link: draft.link,
        color: draft.color,
        is_visible: draft.is_visible,
        sort_order: draft.sort_order,
      });
      toast.success("Đã lưu");
      onChanged();
    } catch (e) {
      console.error(e);
      toast.error("Không lưu được");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Xoá mục này?")) return;
    try {
      await projectPageStore.deleteItem(draft.id);
      toast.success("Đã xoá");
      onChanged();
    } catch {
      toast.error("Không xoá được");
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-mint/20 p-4 space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        <Field label="Tiêu đề">
          <Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        {kind !== "mood_label" && (
          <Field label="Subtitle / vai trò">
            <Input value={draft.subtitle || ""} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
          </Field>
        )}
        {kind === "mood_label" && (
          <Field label="Màu (hex)">
            <Input value={draft.color || ""} onChange={(e) => setDraft({ ...draft, color: e.target.value })} placeholder="#A8DADC" />
          </Field>
        )}
        <Field label="Thứ tự">
          <Input
            type="number"
            value={draft.sort_order}
            onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
          />
        </Field>
      </div>

      {kind !== "mood_label" && (
        <Field label="Mô tả / Nội dung">
          <Textarea
            rows={3}
            value={draft.description || ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Field>
      )}

      {kind === "area" && (
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Icon (Stethoscope, Pill, Headphones, Sparkles, Globe2, BookHeart, Heart)">
            <Input value={draft.icon || ""} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
          </Field>
          <Field label="Link">
            <Input value={draft.link || ""} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
          </Field>
        </div>
      )}

      {kind !== "mood_label" && (
        <Field label="Ảnh">
          <ImageUploader
            value={draft.image_url}
            onChange={(url) => setDraft({ ...draft, image_url: url })}
            folder={`${item.section_slug}/items`}
            aspect="video"
          />
        </Field>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border/40">
        <div className="flex items-center gap-2">
          <Switch checked={draft.is_visible} onCheckedChange={(v) => setDraft({ ...draft, is_visible: v })} />
          <Label className="text-xs">Hiển thị</Label>
        </div>
        <Button onClick={save} disabled={saving} size="sm" className="ml-auto rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
          {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
          Lưu
        </Button>
        <Button onClick={remove} variant="outline" size="sm" className="rounded-full text-destructive">
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// ---------- Contacts list ----------

function ContactsList({ contacts, onChanged }: { contacts: ContactSubmission[]; onChanged: () => void }) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-3xl bg-white/70 border border-white/70 p-10 text-center text-muted-foreground">
        <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
        Chưa có lời nhắn nào.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {contacts.map((c) => (
        <div
          key={c.id}
          className={`rounded-2xl p-4 border ${c.is_read ? "bg-white/60 border-white/60" : "bg-mint/10 border-mint/30"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-base">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.email}
                {c.organization && ` · ${c.organization}`}
              </p>
              {c.partnership_type && (
                <p className="text-xs text-mint-deep mt-1">{c.partnership_type}</p>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex-shrink-0">
              {new Date(c.created_at).toLocaleString("vi-VN")}
            </p>
          </div>
          <p className="mt-3 text-sm whitespace-pre-line text-foreground/85">{c.message}</p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              onClick={async () => {
                await projectPageStore.markContactRead(c.id, !c.is_read);
                onChanged();
              }}
            >
              {c.is_read ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {c.is_read ? "Đánh dấu chưa đọc" : "Đã đọc"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs text-destructive"
              onClick={async () => {
                if (!confirm("Xoá lời nhắn này?")) return;
                await projectPageStore.deleteContact(c.id);
                onChanged();
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Xoá
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
