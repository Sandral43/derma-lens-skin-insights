import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, ImageUp, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Chick } from "@/components/chick";
import { ScoreBars } from "@/components/score-bars";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { analyzeSkin, type ScanResult } from "@/lib/ai.functions";
import { profileQuery, scansQuery, useUpdateProfile } from "@/lib/data";
import { toDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/scan")({
  loader: ({ context }) => context.queryClient.ensureQueryData(scansQuery),
  head: () => ({
    meta: [
      { title: "Scan your face — DermaLens" },
      { name: "description", content: "Check your hydration, texture and clarity with a quick face scan." },
      { property: "og:title", content: "Scan your face — DermaLens" },
      { property: "og:description", content: "A quick, friendly skin check-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScanPage,
});

type Phase = "idle" | "camera" | "analyzing" | "result";

async function fileToDataUrl(file: Blob): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return drawScaled(img, img.naturalWidth, img.naturalHeight, false);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawScaled(source: CanvasImageSource, w: number, h: number, mirror: boolean): string {
  const max = 768;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function ScanPage() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { data: scans } = useSuspenseQuery(scansQuery);
  const qc = useQueryClient();
  const updateProfile = useUpdateProfile();
  const analyze = useServerFn(analyzeSkin);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [explainOpen, setExplainOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<ScanResult, { ok: true }> | null>(null);
  const [savePhoto, setSavePhoto] = useState(profile.save_scan_photos);

  const last = scans[0];
  const prev = scans[1];

  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function onStart() {
    if (localStorage.getItem("dl-camera-explained")) openCamera();
    else setExplainOpen(true);
  }

  async function openCamera() {
    localStorage.setItem("dl-camera-explained", "1");
    setExplainOpen(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      fileRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase("camera");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      toast("Camera not available", { description: "No worries, you can upload a selfie instead." });
      fileRef.current?.click();
    }
  }

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const data = drawScaled(v, v.videoWidth, v.videoHeight, true);
    stopCamera();
    void runScan(data);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      void runScan(await fileToDataUrl(file));
    } catch {
      toast.error("That photo couldn't be opened. Try a JPG or PNG.");
    }
  }

  async function runScan(dataUrl: string) {
    setPhoto(dataUrl);
    setPhase("analyzing");
    const res = await analyze({ data: { image: dataUrl } }).catch(
      () => ({ ok: false, error: "Couldn't reach the scanner. Check your connection." }) as ScanResult,
    );
    if (!res.ok) {
      toast(res.error);
      setPhase("idle");
      setPhoto(null);
      return;
    }
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session!.user.id;
      let photoPath: string | null = null;
      if (savePhoto) {
        const blob = await (await fetch(dataUrl)).blob();
        const path = `${uid}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("skin-photos")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (!upErr) photoPath = path;
      }
      const { error } = await supabase.from("scans").insert({
        scanned_on: toDateKey(new Date()),
        hydration: res.hydration,
        texture: res.texture,
        clarity: res.clarity,
        summary: res.summary,
        tips: res.tips,
        photo_path: photoPath,
      });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: scansQuery.queryKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save your scan.");
    }
    setResult(res);
    setPhase("result");
  }

  function reset() {
    setPhase("idle");
    setPhoto(null);
    setResult(null);
  }

  return (
    <main className="px-5 pb-36">
      <h1 className="pb-4 pt-6 text-[2.1rem] font-black">Scan your face</h1>

      <div className="scene-sky relative aspect-[4/4.3] !bg-sky">
        <div className="absolute inset-x-5 top-5 z-20 rounded-full bg-card px-4 py-3 text-center text-lg font-extrabold">
          {phase === "camera"
            ? "Center your face in the oval!"
            : phase === "analyzing"
              ? "Taking a close look…"
              : phase === "result"
                ? "All done! Here's your check-in."
                : "Center your face in the oval!"}
        </div>

        {phase === "camera" && (
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label="Camera preview"
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          />
        )}
        {(phase === "analyzing" || phase === "result") && photo && (
          <img src={photo} alt="Your selfie" className="absolute inset-0 h-full w-full object-cover" />
        )}

        <div
          aria-hidden
          className={cn(
            "dashed-oval absolute left-1/2 top-[54%] z-10 h-[62%] w-[52%] -translate-x-1/2 -translate-y-1/2",
            phase === "camera" && "border-card",
            phase === "analyzing" && "animate-pulse border-primary",
          )}
        />
        <Chick
          mood={phase === "analyzing" ? "thinking" : phase === "result" ? "joy" : "happy"}
          className="absolute bottom-2 left-3 z-20 w-24"
        />
      </div>

      {phase === "idle" && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-extrabold">
            <span className="rounded-full bg-butter px-2 py-3">Good light</span>
            <span className="rounded-full bg-blush px-2 py-3">No makeup</span>
            <span className="rounded-full bg-mint px-2 py-3">Face forward</span>
          </div>
          <Button size="lg" className="mt-4" onClick={onStart}>
            <Camera /> Start scan
          </Button>
          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="flex min-h-11 items-center gap-3 font-bold">
              <Checkbox
                checked={savePhoto}
                onCheckedChange={(v) => {
                  const on = v === true;
                  setSavePhoto(on);
                  updateProfile.mutate({ save_scan_photos: on });
                }}
                className="h-6 w-6 rounded-lg border-2"
              />
              Save photo to my private calendar
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-11 items-center gap-1 font-extrabold text-accent"
            >
              <ImageUp className="h-5 w-5" /> Upload
            </button>
          </div>
        </>
      )}

      {phase === "camera" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={() => { stopCamera(); setPhase("idle"); }}>
            Cancel
          </Button>
          <Button size="lg" onClick={capture}>
            <Camera /> Snap
          </Button>
        </div>
      )}

      {phase === "analyzing" && (
        <p className="mt-5 text-center font-bold text-muted-foreground">This takes a few seconds…</p>
      )}

      {phase === "result" && result && (
        <section className="mt-5 flex flex-col gap-4">
          <div className="card-cozy px-5 pt-4">
            <h2 className="text-xl font-black">Today's skin check</h2>
            <ScoreBars scores={result} previous={prev ?? null} />
          </div>
          <div className="bubble font-semibold">
            <p className="font-extrabold">{result.summary}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {result.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {result.confidence === "low" && (
              <p className="mt-2 text-sm text-muted-foreground">Lighting made this one tricky, so take these scores lightly.</p>
            )}
          </div>
          {result.seeDermatologist && (
            <Link to="/dermatologists" className="flex items-center gap-4 rounded-[1.8rem] border-2 border-blush bg-blush/50 p-4">
              <Stethoscope className="h-7 w-7 shrink-0" />
              <span className="font-bold">Something might be worth a professional look. Find a dermatologist near you.</span>
            </Link>
          )}
          <Button variant="outline" size="lg" onClick={reset}>
            Scan again
          </Button>
        </section>
      )}

      {phase === "idle" && (
        <section className="card-cozy mt-5 px-5 pt-5">
          <div className="flex items-baseline justify-between border-b-2 border-border pb-3">
            <h2 className="text-xl font-black">Your last skin check</h2>
            {last && <span className="text-sm font-bold text-muted-foreground">{new Date(last.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}</span>}
          </div>
          {last ? (
            <ScoreBars scores={last} previous={prev ?? null} />
          ) : (
            <p className="py-6 font-semibold text-muted-foreground">No checks yet. Your first scan sets your baseline!</p>
          )}
        </section>
      )}

      <p className="mt-5 text-center text-sm font-semibold text-muted-foreground">
        Not a medical diagnosis. Your photo is only saved if you choose.
      </p>

      <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFile} />

      <Dialog open={explainOpen} onOpenChange={setExplainOpen}>
        <DialogContent>
          <DialogHeader>
            <Chick className="mx-auto w-20" />
            <DialogTitle className="text-center">Can I use your camera?</DialogTitle>
            <DialogDescription className="text-center font-semibold">
              I only use it while you scan. Your selfie is sent once to estimate your scores, and it's saved only if
              you tick "Save photo".
            </DialogDescription>
          </DialogHeader>
          <Button size="lg" onClick={openCamera}>
            Allow camera
          </Button>
          <Button variant="outline" size="lg" onClick={() => { setExplainOpen(false); fileRef.current?.click(); }}>
            Upload a photo instead
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
