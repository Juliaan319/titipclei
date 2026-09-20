"use client";
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { getOrderStatus, progressSteps } from "@/lib/order-status";

export function ProgressTimeline({ currentStatus }: { currentStatus: string }) {
  const status = getOrderStatus(currentStatus);
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scroll.current;
    const current = container?.querySelector<HTMLElement>('[aria-current="step"]');
    if (container && current) container.scrollLeft = Math.max(0, current.offsetLeft - container.clientWidth / 2 + current.clientWidth / 2);
  }, [currentStatus]);
  return <><p className="mt-2 text-sm leading-6 text-muted-foreground">Pantau perjalanan titipanmu sampai tiba di alamat.</p>
    <div ref={scroll} tabIndex={0} role="region" aria-label="Tahapan pesanan, geser untuk melihat semua tahap" className="relative mt-5 max-w-full overflow-x-auto overscroll-x-contain rounded-lg pb-3 focus-visible:outline-2 focus-visible:outline-[#B74F68] [scrollbar-width:thin] [scrollbar-color:#DDBCB8_transparent]">
      <ol className="flex w-max min-w-full px-2 py-3">
        {progressSteps.map((step, index) => {
          const completed = index < status.stepIndex || currentStatus === "COMPLETED";
          const active = index === status.stepIndex;
          return <li key={step} aria-current={active ? "step" : undefined} className="relative flex min-w-[130px] flex-1 flex-col items-center text-center">
            {index > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-4 h-0.5 w-full ${index <= status.stepIndex ? "bg-[#B74F68]" : "bg-[#E8D6D2]"}`} />}
            <span aria-hidden="true" className={`relative z-10 grid size-8 place-items-center rounded-full ${completed ? "bg-[#B74F68] text-white" : active ? "border-[3px] border-[#B74F68] bg-[#FFF7F7] ring-4 ring-[#FBECEF]" : "border-2 border-[#E8D6D2] bg-white"}`}>
              {completed ? <Check size={16} strokeWidth={3} /> : <span className={`size-2 rounded-full ${active ? "bg-[#B74F68]" : "bg-[#C9B5AE]"}`} />}
            </span><span className={`mt-3 whitespace-nowrap text-sm font-semibold ${active || completed ? "text-[#B74F68]" : "text-[#8A6F67]"}`}>{step}</span><span className="sr-only">{completed ? "Selesai" : active ? "Sedang berlangsung" : "Belum dimulai"}</span>
          </li>;
        })}
      </ol>
    </div><p className="mt-3 text-sm leading-6"><span className="text-muted-foreground">Status sekarang: </span>{status.label}</p>
  </>;
}
