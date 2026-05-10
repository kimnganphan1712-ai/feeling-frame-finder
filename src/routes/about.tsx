import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  projectPageStore,
  bySlug,
  itemsOf,
  type ProjectSection,
  type ProjectItem,
} from "@/lib/project-page-store";
import {
  Image as ImageIcon,
  Sparkles,
  Heart,
  Quote as QuoteIcon,
  Stethoscope,
  Pill,
  Headphones,
  Globe2,
  BookHeart,
  Send,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Phác đồ chữa lành — Hospital Playlist" },
      {
        name: "description",
        content:
          "Câu chuyện về Hospital Playlist cho những ngày lòng mình mỏi mệt.",
      },
      { property: "og:title", content: "Phác đồ chữa lành — Hospital Playlist" },
      {
        property: "og:description",
        content: "Một trạm cứu hộ cảm xúc dịu dàng cho những ngày lòng mình mỏi mệt.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AboutPage />
    </RequireAuth>
  ),
});

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Pill,
  Headphones,
  Sparkles,
  Globe2,
  BookHeart,
  Heart,
};

function AboutPage() {
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectPageStore
      .fetchAll()
      .then(({ sections, items }) => {
        setSections(sections);
        setItems(items);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Không tải được nội dung trang");
      })
      .finally(() => setLoading(false));
  }, []);

  const ordered = useMemo(
    () => sections.filter((s) => s.is_visible).sort((a, b) => a.sort_order - b.sort_order),
    [sections],
  );

  if (loading) {
    return (
      <PageShell mascot={false}>
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang mở trang dịu dàng…
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell mascot={false}>
      <div className="space-y-16 pb-12">
        {ordered.map((s) => {
          switch (s.slug) {
            case "hero":
              return <HeroSection key={s.id} s={s} />;
            case "why":
              return <WhySection key={s.id} s={s} />;
            case "founder":
              return <FounderSection key={s.id} s={s} />;
            case "messages":
              return <MessagesSection key={s.id} s={s} items={itemsOf(items, "messages", "message")} />;
            case "areas":
              return <AreasSection key={s.id} s={s} items={itemsOf(items, "areas", "area")} />;
            case "map":
              return <MapSection key={s.id} s={s} items={itemsOf(items, "map", "mood_label")} />;
            case "contact":
              return <ContactSection key={s.id} s={s} />;
            default:
              return null;
          }
        })}
      </div>
    </PageShell>
  );
}

// ---------- Reusable bits ----------

function Placeholder({ aspect = "video", label = "Ảnh đang được chuẩn bị" }: { aspect?: string; label?: string }) {
  return (
    <div
      className={`relative w-full ${aspect} rounded-3xl overflow-hidden bg-gradient-to-br from-mint/30 via-white to-blush/20 border border-white/70 flex items-center justify-center`}
    >
      <div className="text-center text-mint-deep/70">
        <ImageIcon className="w-10 h-10 mx-auto opacity-60" />
        <p className="text-xs mt-2">{label}</p>
      </div>
    </div>
  );
}

function SmartImage({
  src,
  alt,
  className,
  aspect = "aspect-video",
}: {
  src: string | null;
  alt: string;
  className?: string;
  aspect?: string;
}) {
  if (!src) {
    return (
      <div
        className={`relative w-full ${aspect} rounded-3xl overflow-hidden bg-gradient-to-br from-mint/30 via-white to-blush/20 border border-white/70 flex items-center justify-center ${className ?? ""}`}
      >
        <ImageIcon className="w-10 h-10 text-mint-deep/50" />
      </div>
    );
  }
  return (
    <div className={`relative w-full ${aspect} rounded-3xl overflow-hidden border border-white/70 shadow-soft ${className ?? ""}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}

// ---------- Sections ----------

function HeroSection({ s }: { s: ProjectSection }) {
  return (
    <section className="relative animate-[fade-up_0.7s_ease-out]">
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-mint/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-blush/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative grid md:grid-cols-[1.3fr_1fr] gap-8 items-center pt-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-mint-deep mb-3">Phác đồ chữa lành</p>
          <h1 className="font-display text-3xl md:text-5xl leading-[1.15] font-medium">
            {s.title || "Hospital Playlist"}
          </h1>
          {s.subtitle && (
            <p className="mt-3 font-display text-lg md:text-2xl text-mint-deep/90 italic leading-snug">
              {s.subtitle}
            </p>
          )}
          {s.description && (
            <p className="mt-5 text-base md:text-lg text-foreground/75 leading-relaxed max-w-xl">
              {s.description}
            </p>
          )}
          {s.button_text && (
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={s.button_link || "#"}>
                <Button size="lg" className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white px-6">
                  {s.button_text} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          )}
        </div>

        <div className="relative">
          {s.image_main ? (
            <SmartImage src={s.image_main} alt={s.title || "Hero"} aspect="aspect-[4/5]" />
          ) : (
            <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-mint/40 via-white to-blush/30 border border-white/70 flex items-center justify-center relative overflow-hidden">
              <Mascot size="xl" variant="happy" floating />
              <div className="absolute top-4 right-4 animate-pulse">
                <Sparkles className="w-5 h-5 text-mint-deep/60" />
              </div>
            </div>
          )}
          {s.image_secondary && (
            <div className="absolute -bottom-6 -left-6 w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 border-white shadow-soft hidden sm:block">
              <img src={s.image_secondary} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function WhySection({ s }: { s: ProjectSection }) {
  const gallery = s.image_gallery || [];
  return (
    <section className="animate-[fade-up_0.7s_ease-out]">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-mint-deep/80 mb-2">Câu chuyện</p>
          <h2 className="font-display text-2xl md:text-3xl leading-snug mb-5">{s.title}</h2>
          <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-line">
            {s.description}
          </p>
        </div>
        <div className="space-y-3">
          <SmartImage src={s.image_main} alt={s.title || ""} aspect="aspect-[4/3]" />
          {(s.image_secondary || gallery[0]) && (
            <div className="grid grid-cols-2 gap-3">
              {s.image_secondary && (
                <SmartImage src={s.image_secondary} alt="" aspect="aspect-square" />
              )}
              {gallery[0] && (
                <SmartImage src={gallery[0]} alt="" aspect="aspect-square" />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FounderSection({ s }: { s: ProjectSection }) {
  const founderName = (s.extra?.founder_name as string) || "Founder";
  const founderRole = (s.extra?.founder_role as string) || "";
  const founderQuote = (s.extra?.founder_quote as string) || "";
  const secondaryText = (s.extra?.secondary_button_text as string) || "";
  const secondaryLink = (s.extra?.secondary_button_link as string) || "#";
  const gallery = s.image_gallery || [];

  return (
    <section id="founder-story" className="animate-[fade-up_0.7s_ease-out]">
      <div className="rounded-[2.5rem] glass-strong border border-white/70 shadow-soft p-6 md:p-10">
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-8 items-start">
          <div>
            <SmartImage src={s.image_main} alt={founderName} aspect="aspect-[4/5]" />
            {gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {gallery.slice(0, 3).map((g, i) => (
                  <SmartImage key={i} src={g} alt="" aspect="aspect-square" />
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-mint-deep/80 mb-2">Founder</p>
            <h2 className="font-display text-2xl md:text-3xl leading-snug">{s.title}</h2>
            <p className="font-display text-lg md:text-xl text-mint-deep mt-3">{founderName}</p>
            {founderRole && <p className="text-sm text-muted-foreground">{founderRole}</p>}

            {founderQuote && (
              <div className="mt-5 rounded-2xl bg-mint/15 border border-mint/30 p-5">
                <QuoteIcon className="w-5 h-5 text-mint-deep mb-2" />
                <p className="font-display italic text-base md:text-lg leading-relaxed text-foreground/85">
                  “{founderQuote}”
                </p>
              </div>
            )}

            {s.description && (
              <p className="mt-5 text-base text-foreground/80 leading-relaxed whitespace-pre-line">
                {s.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {secondaryText && (
                <a href={secondaryLink}>
                  <Button variant="outline" className="rounded-full border-mint-deep/40 text-mint-deep">
                    {secondaryText}
                  </Button>
                </a>
              )}
              {s.button_text && (
                <a href={s.button_link || "#contact"}>
                  <Button className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
                    {s.button_text}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MessagesSection({ s, items }: { s: ProjectSection; items: ProjectItem[] }) {
  return (
    <section className="animate-[fade-up_0.7s_ease-out]">
      <div className="text-center mb-7">
        <p className="text-[11px] uppercase tracking-[0.25em] text-mint-deep/80 mb-2">Lời nhắn</p>
        <h2 className="font-display text-2xl md:text-3xl leading-snug">{s.title}</h2>
        {s.description && (
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            {s.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it, i) => (
          <article
            key={it.id}
            className="rounded-3xl p-5 bg-white/70 border border-white/70 shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all"
            style={{
              background:
                i % 2 === 0
                  ? "linear-gradient(135deg, oklch(0.97 0.02 195), white)"
                  : "linear-gradient(135deg, oklch(0.97 0.02 350), white)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              {it.image_url ? (
                <img
                  src={it.image_url}
                  alt={it.title || ""}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mint/40 to-blush/30 flex items-center justify-center border-2 border-white shadow-sm">
                  <Heart className="w-5 h-5 text-mint-deep" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-display text-base truncate">{it.title}</p>
                {it.subtitle && (
                  <p className="text-[11px] text-muted-foreground truncate">{it.subtitle}</p>
                )}
              </div>
            </div>
            <p className="font-display italic text-[15px] leading-relaxed text-foreground/85">
              “{it.description}”
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AreasSection({ s, items }: { s: ProjectSection; items: ProjectItem[] }) {
  return (
    <section className="animate-[fade-up_0.7s_ease-out]">
      <div className="text-center mb-7">
        <p className="text-[11px] uppercase tracking-[0.25em] text-mint-deep/80 mb-2">Khu vực</p>
        <h2 className="font-display text-2xl md:text-3xl leading-snug">{s.title}</h2>
        {s.description && (
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            {s.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          const Icon = ICON_MAP[it.icon || ""] || Sparkles;
          const tint = it.color === "blush" ? "var(--blush)" : "var(--mint)";
          const Card = (
            <div className="group h-full rounded-3xl p-5 bg-white/75 border border-white/70 shadow-sm hover:shadow-soft hover:-translate-y-1 transition-all">
              {it.image_url ? (
                <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-4">
                  <img src={it.image_url} alt={it.title || ""} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `color-mix(in oklch, ${tint} 50%, white)`, color: "var(--mint-deep)" }}
                >
                  <Icon className="w-6 h-6" />
                </div>
              )}
              <p className="text-[10px] uppercase tracking-widest text-mint-deep/80">{it.subtitle}</p>
              <h3 className="font-display text-lg mt-1">{it.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{it.description}</p>
              <div className="mt-3 inline-flex items-center text-xs text-mint-deep group-hover:gap-2 gap-1 transition-all">
                Khám phá <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          );
          return it.link ? (
            <Link key={it.id} to={it.link}>
              {Card}
            </Link>
          ) : (
            <div key={it.id}>{Card}</div>
          );
        })}
      </div>
    </section>
  );
}

function MapSection({ s, items }: { s: ProjectSection; items: ProjectItem[] }) {
  const gallery = s.image_gallery || [];
  return (
    <section className="animate-[fade-up_0.7s_ease-out]">
      <div className="rounded-[2.5rem] bg-gradient-to-br from-mint/15 to-blush/10 border border-white/70 p-6 md:p-10">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
          <div>
            <SmartImage src={s.image_main} alt={s.title || ""} aspect="aspect-[4/3]" />
            {(s.image_secondary || gallery[0]) && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {s.image_secondary && <SmartImage src={s.image_secondary} alt="" aspect="aspect-square" />}
                {gallery[0] && <SmartImage src={gallery[0]} alt="" aspect="aspect-square" />}
              </div>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-mint-deep/80 mb-2">Cộng đồng</p>
            <h2 className="font-display text-2xl md:text-3xl leading-snug">{s.title}</h2>
            <p className="mt-4 text-base text-foreground/80 leading-relaxed">{s.description}</p>

            {items.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {items.map((it) => (
                  <span
                    key={it.id}
                    className="px-3 py-1 rounded-full text-xs font-medium border"
                    style={{
                      background: `color-mix(in srgb, ${it.color || "#A8DADC"} 35%, white)`,
                      borderColor: `color-mix(in srgb, ${it.color || "#A8DADC"} 50%, white)`,
                    }}
                  >
                    {it.title}
                  </span>
                ))}
              </div>
            )}

            {s.button_text && (
              <div className="mt-6">
                <Link to={s.button_link || "/mood-board"}>
                  <Button className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white">
                    {s.button_text} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Hãy cho mình biết tên bạn nhé").max(100),
  email: z.string().trim().email("Email chưa đúng định dạng").max(255),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  partnership_type: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Hãy viết vài dòng nhé").max(2000),
});

function ContactSection({ s }: { s: ProjectSection }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    partnership_type: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ");
      return;
    }
    setSubmitting(true);
    try {
      await projectPageStore.submitContact({
        name: parsed.data.name,
        email: parsed.data.email,
        organization: parsed.data.organization || undefined,
        partnership_type: parsed.data.partnership_type || undefined,
        message: parsed.data.message,
      });
      toast.success("Đã gửi lời nhắn của bạn 💌");
      setForm({ name: "", email: "", organization: "", partnership_type: "", message: "" });
    } catch (e) {
      console.error(e);
      toast.error("Không gửi được, thử lại nhé");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="animate-[fade-up_0.7s_ease-out]">
      <div className="rounded-[2.5rem] glass-strong border border-white/70 shadow-soft p-6 md:p-10">
        <div className="grid md:grid-cols-[1fr_1.3fr] gap-8 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-mint-deep/80 mb-2">Liên hệ hợp tác</p>
            <h2 className="font-display text-2xl md:text-3xl leading-snug">{s.title}</h2>
            <p className="mt-4 text-base text-foreground/80 leading-relaxed">{s.description}</p>
            <div className="mt-6">
              {s.image_main ? (
                <SmartImage src={s.image_main} alt={s.title || ""} aspect="aspect-[4/3]" />
              ) : (
                <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-mint/30 via-white to-blush/20 border border-white/70 flex items-center justify-center">
                  <Mascot size="lg" variant="idea" floating />
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                placeholder="Họ và tên"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                className="rounded-2xl bg-white/70 border-mint/30"
              />
              <Input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
                className="rounded-2xl bg-white/70 border-mint/30"
              />
            </div>
            <Input
              placeholder="Tổ chức / Dự án"
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
              maxLength={200}
              className="rounded-2xl bg-white/70 border-mint/30"
            />
            <Input
              placeholder="Hình thức hợp tác mong muốn"
              value={form.partnership_type}
              onChange={(e) => setForm({ ...form, partnership_type: e.target.value })}
              maxLength={200}
              className="rounded-2xl bg-white/70 border-mint/30"
            />
            <Textarea
              placeholder="Lời nhắn dành cho Hospital Playlist…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              maxLength={2000}
              rows={5}
              className="rounded-2xl bg-white/70 border-mint/30"
            />
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-mint-deep hover:bg-mint-deep/90 text-white w-full sm:w-auto"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {s.button_text || "Gửi lời nhắn"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
